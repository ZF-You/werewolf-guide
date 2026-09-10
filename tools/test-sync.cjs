const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { syncRepository } = require('./sync-github.cjs');

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'werewolf-sync-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const remote = join(root, 'remote.git');
  const source = join(root, 'source');
  const local = join(root, 'local');
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git(root, 'init', '--bare', '--initial-branch=main', remote);
  git(root, 'clone', remote, source);
  const commit = (cwd, file, content) => {
    writeFileSync(join(cwd, file), content);
    git(cwd, 'add', file);
    git(cwd, '-c', 'user.name=Sync Test', '-c', 'user.email=sync@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', file);
  };
  commit(source, 'videos.json', '[1]');
  git(source, 'push', 'origin', 'main');
  git(root, 'clone', remote, local);
  const update = () => {
    commit(source, 'videos.json', '[1,2]');
    commit(source, 'history.json', '["new video"]');
    git(source, 'push', 'origin', 'main');
  };
  return { local, git, commit, update };
}

test('fast-forward preserves videos and history and is repeatable', t => {
  const { local, update } = fixture(t);
  update();
  assert.match(syncRepository(local), /Synchronized 2 commit/);
  assert.equal(readFileSync(join(local, 'videos.json'), 'utf8'), '[1,2]');
  assert.equal(readFileSync(join(local, 'history.json'), 'utf8'), '["new video"]');
  assert.equal(syncRepository(local), 'Already synchronized.');
});

test('modified, staged, and untracked files prevent automatic updates', t => {
  const { local, git, update } = fixture(t);
  update();
  writeFileSync(join(local, 'videos.json'), 'local edit');
  assert.match(syncRepository(local), /Skipped: local changes/);
  git(local, 'add', 'videos.json');
  assert.match(syncRepository(local), /Skipped: local changes/);
  assert.equal(readFileSync(join(local, 'videos.json'), 'utf8'), 'local edit');
  git(local, '-c', 'user.name=Sync Test', '-c', 'user.email=sync@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'local edit');
  writeFileSync(join(local, 'draft.txt'), 'draft');
  assert.match(syncRepository(local), /Skipped: local changes/);
});

test('divergent branches are left intact', t => {
  const { local, git, commit, update } = fixture(t);
  commit(local, 'page.html', 'local page');
  const head = git(local, 'rev-parse', 'HEAD');
  update();
  assert.throws(() => syncRepository(local), /Branches diverged/);
  assert.equal(git(local, 'rev-parse', 'HEAD'), head);
  assert.equal(git(local, 'status', '--porcelain'), '');
});

test('local-only commits and other branches are not pushed or changed', t => {
  const { local, git, commit } = fixture(t);
  commit(local, 'page.html', 'local page');
  assert.match(syncRepository(local), /local commits are waiting/);
  git(local, 'switch', '-c', 'feature');
  assert.match(syncRepository(local), /not on main/);
  git(local, 'checkout', '--detach');
  assert.match(syncRepository(local), /not on main/);
});

test('unfinished Git operations prevent syncing', t => {
  const { local } = fixture(t);
  mkdirSync(join(local, '.git', 'rebase-merge'));
  assert.match(syncRepository(local), /another Git operation/);
});

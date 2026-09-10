const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

function syncRepository(root = resolve(__dirname, '..')) {
  const git = (...args) => {
    const result = spawnSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 120000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' },
    });
    if (result.error || result.status !== 0) {
      throw new Error(result.error?.message || result.stderr.trim() || `git ${args[0]} failed`);
    }
    return result.stdout.trim();
  };
  const ready = () => {
    if (git('branch', '--show-current') !== 'main') return 'Skipped: not on main.';
    if (git('status', '--porcelain', '--untracked-files=all')) return 'Skipped: local changes need to be committed first.';
    for (const marker of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply']) {
      const { existsSync } = require('node:fs');
      if (existsSync(resolve(root, git('rev-parse', '--git-path', marker)))) {
        return 'Skipped: another Git operation is in progress.';
      }
    }
    return null;
  };
  let skipped = ready();
  if (skipped) return skipped;
  git('fetch', 'origin', 'refs/heads/main:refs/remotes/origin/main');
  // Recheck after the network request so edits made while fetching are protected.
  skipped = ready();
  if (skipped) return skipped;
  const [ahead, behind] = git('rev-list', '--left-right', '--count', 'HEAD...origin/main').split(/\s+/).map(Number);
  if (ahead && behind) throw new Error('Branches diverged. Merge origin/main manually; no files were changed.');
  if (ahead) return 'Skipped: local commits are waiting to be pushed.';
  if (!behind) return 'Already synchronized.';
  git('merge', '--ff-only', 'origin/main');
  return `Synchronized ${behind} commit(s) from GitHub.`;
}

if (require.main === module) {
  try {
    console.log(syncRepository());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { syncRepository };

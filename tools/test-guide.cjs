const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const context = vm.createContext({ window: {}, document: { addEventListener() {} } });
vm.runInContext(readFileSync(join(root, 'script.js'), 'utf8'), context);
vm.runInContext(readFileSync(join(root, 'data/jcms-seasons.js'), 'utf8'), context);
const { groups, order, art, seasons } = JSON.parse(JSON.stringify(vm.runInContext(
  '({ groups: IDENTITY_CATEGORIES, order: IDENTITY_ORDER, art: ROLE_ART, seasons: window.JCMS_SEASONS.seasons })', context,
)));
const season = title => seasons.find(item => item.title === title);

test('identity categories cover all 40 cards exactly once', () => {
  assert.deepEqual(groups.map(group => group.names.length), [1, 18, 1, 13, 7]);
  const names = groups.flatMap(group => group.names);
  assert.equal(new Set(names).size, 40);
  assert.deepEqual([...names].sort(), [...order].sort());
  assert.deepEqual(groups[0].names, ['平民']);
  assert.deepEqual(groups[2].names, ['狼人']);
  for (const name of names) assert(existsSync(join(root, 'images/identities', art[name])), name);
});

test('corrected historical video dates and boards stay attached to their BV links', () => {
  const episodes = seasons.flatMap(item => item.episodes);
  const expected = {
    BV1hWmHBAEpa: { date: '2025-12-09', board: '针锋相杠' },
    BV1zZqDBTE2a: { date: '2025-12-18' },
    BV1zZqDBKEbB: { date: '2025-12-18' },
    BV1zZqDBKEVm: { date: '2025-12-18' },
    BV1qwqQBYEFP: { date: '2025-12-18' },
    BV16MKrzSEDE: { date: '2025-06-28' },
    BV16MKrzSERm: { date: '2025-06-28' },
    BV1RNxceUEWd: { board: '机械狼通灵师' },
  };
  for (const [bvid, fields] of Object.entries(expected)) {
    const episode = episodes.find(item => item.bvid === bvid);
    assert(episode, bvid);
    for (const [key, value] of Object.entries(fields)) assert.equal(episode[key], value, bvid);
  }
  assert(!season('紫禁之巅').episodes.some(item => item.bvid === 'BV1fn6zBkEYQ'));
  assert.equal(season('紫禁之巅').episodes.length, 165);
});

test('season statistics match the underlying videos', () => {
  for (const item of seasons) {
    assert.equal(item.episodeCount, item.episodes.length, item.title);
    const counts = new Map();
    for (const episode of item.episodes) counts.set(episode.board, (counts.get(episode.board) || 0) + 1);
    assert.equal(item.boards.length, counts.size, item.title);
    for (const board of item.boards) assert.equal(board.count, counts.get(board.name), item.title);
  }
});

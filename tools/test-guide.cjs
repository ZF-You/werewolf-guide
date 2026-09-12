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

test('identity categories cover all 42 cards exactly once', () => {
  assert.deepEqual(groups.map(group => group.names.length), [1, 19, 1, 14, 7]);
  const names = groups.flatMap(group => group.names);
  assert.equal(new Set(names).size, 42);
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

test('new full-bleed cards use uncropped bounds and preserve image proportions', () => {
  for (const name of ['诡术师', '九尾狐', '白泽']) {
    const style = vm.runInContext(`identityArtStyle(${JSON.stringify(name)})`, context);
    assert.equal(style, '--art-width:100%;--art-height:100%;--art-left:0%;--art-top:0%;--art-fit:cover;');
    const png = readFileSync(join(root, 'images/identities', art[name]));
    assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    assert(width >= 960 && height >= 1360, `${name}: high-resolution artwork`);
    assert(Math.abs(width / height / (12 / 17) - 1) < 0.04, `${name}: near the 12:17 display ratio`);
  }
  assert(groups.find(group => group.id === 'special-wolves').names.includes('九尾狐'));
  assert(groups.find(group => group.id === 'gods').names.includes('白泽'));
  const css = readFileSync(join(root, 'styles.css'), 'utf8');
  assert(css.includes('object-fit: var(--art-fit, fill)'));
});

test('new cards are included in both marquee rows and the identity gallery', () => {
  const poster = { innerHTML: '', querySelectorAll: () => [] };
  const gallery = { innerHTML: '' };
  const renderingContext = vm.createContext({
    window: { matchMedia: () => ({ matches: true }) },
    document: {
      addEventListener() {},
      querySelector: selector => selector === '#identity-marquee-poster' ? poster : selector === '#identity-gallery' ? gallery : null,
    },
  });
  vm.runInContext(readFileSync(join(root, 'script.js'), 'utf8'), renderingContext);
  vm.runInContext('renderHomeIdentityMarquee(); renderIdentityGallery();', renderingContext);
  for (const name of ['诡术师', '九尾狐', '白泽']) {
    assert.equal(poster.innerHTML.split(`data-identity-name="${name}"`).length - 1, 4, `${name}: two rows with loop copies`);
    assert.equal(gallery.innerHTML.split(`data-identity-name="${name}"`).length - 1, 1, `${name}: one gallery card`);
    assert(poster.innerHTML.includes(`images/identities/${art[name]}?v=20260912-identity34`));
    assert(gallery.innerHTML.includes(`images/identities/${art[name]}?v=20260912-identity34`));
  }
});

test('black-margin cards use shared display bounds and new terms appear once', () => {
  for (const name of ['熊', '蒙面人', '梦魇', '证婚人', '情侣', '狼术师']) {
    const margins = vm.runInContext(`IDENTITY_ART_MARGINS[${JSON.stringify(name)}]`, context);
    assert(margins.every(value => value > 0), name);
  }
  const glossary = readFileSync(join(root, 'pages/speech.html'), 'utf8');
  for (const name of ['压毒', '舞池']) {
    assert.equal(glossary.split(`<dt>${name}</dt>`).length - 1, 1, name);
  }
});

test('wolf sorcerer display bounds exclude its baked-in black side bars', () => {
  const margins = Array.from(vm.runInContext('IDENTITY_ART_MARGINS["狼术师"]', context));
  assert.deepEqual(margins, [19, 4, 19, 4]);
  const style = vm.runInContext('identityArtStyle("狼术师")', context);
  const properties = Object.fromEntries(style.split(';').filter(Boolean).map(item => item.split(':')));
  assert.equal(parseFloat(properties['--art-width']), 480 / 442 * 100);
  assert.equal(parseFloat(properties['--art-height']), 680 / 672 * 100);
  assert.equal(parseFloat(properties['--art-left']), -19 / 442 * 100);
  assert.equal(parseFloat(properties['--art-top']), -4 / 672 * 100);
});

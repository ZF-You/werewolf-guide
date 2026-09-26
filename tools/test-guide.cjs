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

test('retired board labels are absent from every video and season filter', () => {
  const retired = new Set(['预女猎禁混', '黑狼王骑士', '机械狼狼人杀', '狼美骑士']);
  for (const item of seasons) {
    for (const episode of item.episodes) assert(!retired.has(episode.board), episode.bvid);
    for (const board of item.boards) assert(!retired.has(board.name), item.title);
  }
});

test('video search matches only compact dates or season names, combined with board selection', () => {
  const matches = vm.runInContext('matchesJcmsEpisode', context);
  const fixture = { title: '20260101 第一期 第一局-狼王守卫', date: '2026-01-01', board: '狼王守卫' };
  const collection = { title: '诡秘巫影' };
  for (const term of ['', '20260101', '诡秘巫影', '诡秘', ' 20260101 ']) {
    assert(matches(fixture, collection, term), term);
    assert(matches(fixture, collection, term, '狼王守卫'), term);
    assert(!matches(fixture, collection, term, '青丘夜影'), term);
  }
  for (const term of ['202601', '2026-01-01', '20260230', '20260102', '第一期', '第一局', '狼王守卫', '诡秘 狼王']) {
    assert(!matches(fixture, collection, term), term);
  }
  assert(matches({ title: '第二局-唯邻是从', board: '唯邻是从' }, { title: '天空之城' }, '20240904'));
});

test('new setups use existing role cards and include the supplied rule exceptions', () => {
  const setups = JSON.parse(JSON.stringify(vm.runInContext('SETUP_GUIDES', context)));
  const setupOrder = Array.from(vm.runInContext('SETUP_ORDER', context));
  assert.equal(new Set(setupOrder).size, setupOrder.length);
  assert(!setupOrder.includes('狼美猎人'));
  assert(setupOrder.includes('狼美人猎人'));
  const guard = setups.find(item => item.name === '狼王守卫');
  const fox = setups.find(item => item.name === '青丘夜影');
  for (const setup of [guard, fox]) {
    assert(setupOrder.includes(setup.name));
    assert.equal(setup.roles.length, 7);
    assert(setup.rules.includes('所有神职或所有平民'));
    for (const role of setup.roles) assert(role.skill && role.play && art[role.name]);
  }
  assert(guard.rules.includes('双爆吞警徽'));
  assert(guard.roles.find(item => item.name === '狼王').skill.includes('被毒杀或自爆不可开枪'));
  const baize = fox.roles.find(item => item.name === '白泽').skill;
  for (const text of ['强制', '神民双阵营', '白天投票结束后', '最后一神', '猎杀时刻']) assert(baize.includes(text), text);
  const nine = fox.roles.find(item => item.name === '九尾狐').skill;
  for (const text of ['免疫女巫毒药', '每夜必须', '警徽投票和放逐投票', 'A人数大于B', '仅生效一次', '三名普通狼人全部出局']) assert(nine.includes(text), text);
  const output = { innerHTML: '' };
  const renderContext = vm.createContext({ document: { addEventListener() {}, querySelector: () => output } });
  vm.runInContext(readFileSync(join(root, 'script.js'), 'utf8'), renderContext);
  vm.runInContext('renderRolePage()', renderContext);
  assert(output.innerHTML.includes(guard.rules));
  assert(output.innerHTML.includes(fox.rules));
});

const expectedMasters = 'JY,KS,耿许儿,牛肉干,小苍,诅咒,李斯,大卫,申屠,荣耀,翼风,陈明峻,鲸鱼,佩玖,彭彭,二妖,园长,华仔仔,笑笑,果冻,苏打,Bobby,李舒服,焦阳,圈圈,Ted,冰辰,蛋黄派,宝玉妹妹,又又,陈俊洁,徐言雨,亚亚,鬼鬼,橘子,郭小炜,周二珂,葛小舞,谢朵儿,饱嗝粒粒,大道寺,Duu,猫儿曼,Happy,林花花'.split(',');

test('all 45 master posters exist in the requested order below the official link', () => {
  assert.deepEqual(Array.from(vm.runInContext('MASTER_NAMES', context)), expectedMasters);
  for (const name of expectedMasters) {
    const jpg = readFileSync(join(root, 'images/masters', name + '.jpg'));
    assert.equal(jpg.subarray(0, 2).toString('hex'), 'ffd8', name);
  }
  const html = readFileSync(join(root, 'pages/jcms.html'), 'utf8');
  assert(html.indexOf('打开官方主页') < html.indexOf('id="masters-title"'));
  assert(html.indexOf('id="masters-title"') < html.indexOf('id="season-title"'));
});

test('master lightbox opens the selected poster, wraps both ways, and restores focus', () => {
  const element = () => ({ events: {}, addEventListener(type, handler) { this.events[type] = handler; } });
  const posters = expectedMasters.map(name => ({
    ...element(), querySelector: () => ({ src: name + '.jpg' }),
    focus() { this.focused = true; },
  }));
  const gallery = { innerHTML: '', querySelectorAll: () => posters };
  const image = {};
  const caption = {};
  const position = {};
  const close = element();
  const previous = { ...element(), dataset: { step: '-1' } };
  const next = { ...element(), dataset: { step: '1' } };
  const dialog = {
    ...element(), setAttribute() {},
    querySelector: selector => ({ 'figure img': image, figcaption: caption, '.identity-dialog-position': position, '.identity-dialog-close': close })[selector],
    querySelectorAll: () => [previous, next],
    showModal() { this.open = true; },
    close() { this.open = false; this.events.close(); },
  };
  const classes = new Set();
  const renderContext = vm.createContext({ document: {
    addEventListener() {}, querySelector: () => gallery, createElement: () => dialog,
    body: { appendChild() {}, classList: { add: name => classes.add(name), remove: name => classes.delete(name) } },
  } });
  vm.runInContext(readFileSync(join(root, 'script.js'), 'utf8'), renderContext);
  vm.runInContext('renderMastersGallery()', renderContext);
  assert.equal((gallery.innerHTML.match(/data-master-index=/g) || []).length, 45);
  assert(gallery.innerHTML.includes('width="1440" height="2524"'));
  posters[0].events.click();
  assert(dialog.open);
  assert.equal(image.src, 'JY.jpg');
  previous.events.click();
  assert.equal(caption.textContent, '林花花');
  next.events.click();
  assert.equal(caption.textContent, 'JY');
  dialog.events.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(caption.textContent, 'KS');
  close.events.click();
  assert(!dialog.open);
  assert(posters[0].focused);
  assert.equal(classes.size, 0);
});

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

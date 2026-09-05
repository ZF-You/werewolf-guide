document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  bindSideDrawers();
  bindCopyButtons();
  renderHomeIdentityMarquee();
  bindImageFallbacks();
  renderJcmsPage();
  renderIdentityGallery();
  renderRolePage();
  bindGlossarySearch();
  bindPageIndex();
  bindStickyDisclosures();
  bindSiteMotion();
});

const ASSET_VERSION = "20260902-kunlun27";

const SITE_CHANGELOG = [
  ["2026-09-05", "统一滚动海报、身份列表与大图弹窗的卡面边界，修复悬停动画再次露出白边的问题；适度放大全站正文、表格及辅助说明字号，并调整手机端身份框高度以完整显示文字。"],
  ["2026-09-05", "首页身份海报统一卡面尺寸并去除外侧白边；全部身份按村民、神职、小狼、大狼与特殊身份分组；合集和比赛版型新增标题随滚动固定；修正紫禁之巅、诡秘巫影、天空之城视频资料，移除紫禁之巅颁奖视频和版型筛选中的待补充项。"],
  ["2026-09-05", "更新全站字体层级、留白与列表排版；优化首页身份展台；新增章节导航、返回顶部、赛事搜索与版型筛选、身份大图连续翻页，并优化移动端与减少动态效果设置。"],
  ["2026-08-29", "首页改为双行滚动身份海报，可暂停查看并点击放大身份牌。"],
  ["2026-08-24", "移除交流论坛；调整全部身份与比赛版型顺序；更新游戏技巧；新增全站侧边信息与影像抽屉。"],
  ["2026-08-04", "首页改用动态海报并加入播放控制；京城大师赛合集与比赛版型改为默认收起。"],
  ["2026-08-03", "更新曙光航纪视频；加入自动检查新视频的工作流、术语搜索和首页身份群像海报。"],
  ["2026-07-17", "更新术语与夜间手势；补充曙光航纪视频；替换猎人身份牌并优化全站动效；修复移动端术语列表。"],
  ["2026-07-16", "统一版型身份卡片和背景图尺寸。"],
  ["2026-07-15", "发布第二版与第三版；补充独立页面、比赛资料及各版型身份背景图。"],
  ["2026-07-13", "狼人杀入坑指南第一版上线。"],
];

function sideDrawerContent(side) {
  if (side === "right") {
    return `
      <section class="drawer-section drawer-gallery-section">
        <p class="drawer-kicker">活动影像廊</p>
        <h2>照片与视频</h2>
        <div class="drawer-gallery" aria-label="活动影像廊预留区域">
          <div><span aria-hidden="true">▧</span><small>活动照片</small></div>
          <div><span aria-hidden="true">▶</span><small>活动视频</small></div>
          <div><span aria-hidden="true">▦</span><small>线下合影</small></div>
        </div>
        <p class="drawer-note">后续上传活动影像后，可在这里点击查看大图或播放视频。</p>
      </section>
    `;
  }

  return `
    <section class="drawer-section">
      <p class="drawer-kicker">站点信息</p>
      <h2>狼人杀入坑指南</h2>
      <div class="drawer-links">
        <a href="https://github.com/ZF-You/werewolf-guide" target="_blank" rel="noreferrer">💻 源代码仓库</a>
        <a href="mailto:zfy.sjtu@sjtu.edu.cn">📧 zfy.sjtu@sjtu.edu.cn</a>
        <p>💬 WeChat：NovaFynne</p>
        <p>🔍 小红书搜索：轻桌游聚集地</p>
      </div>
      <p class="drawer-welcome">欢迎加入轻桌游聚集地。</p>
    </section>
    <section class="drawer-section">
      <p class="drawer-kicker">更新记录</p>
      <h2>网站更新</h2>
      <ol class="drawer-changelog">
        ${changelogMarkup(SITE_CHANGELOG.map(([date, content]) => ({ date, content, timestamp: `${date}T12:00:00+08:00` })))}
      </ol>
    </section>
  `;
}

function changelogMarkup(records) {
  return records
    .sort((a, b) => String(b.timestamp || b.date).localeCompare(String(a.timestamp || a.date)))
    .map((item) => `<li><time datetime="${escapeHtml(item.timestamp || item.date)}">${escapeHtml(item.date)}</time><p>${escapeHtml(item.content)}</p></li>`)
    .join("");
}

function bindSideDrawers() {
  const createDrawer = (side) => {
    const drawer = document.createElement("aside");
    const direction = side === "left" ? "右" : "左";
    drawer.className = `side-drawer side-drawer-${side}`;
    drawer.setAttribute("aria-label", side === "left" ? "左侧站点信息与更新记录" : "右侧活动影像廊");
    drawer.innerHTML = `
      <button class="side-drawer-handle" type="button" aria-expanded="false" aria-label="向${direction}展开侧边菜单">
        <span aria-hidden="true">${side === "left" ? "›" : "‹"}</span>
      </button>
      <div class="side-drawer-scroll">${sideDrawerContent(side)}</div>
    `;
    document.body.appendChild(drawer);
    return drawer;
  };

  const drawers = [createDrawer("left"), createDrawer("right")];
  const dataRoot = document.body.classList.contains("page-home") ? "" : "../";
  fetch(`${dataRoot}data/jcms-update-history.json?v=${Date.now()}`, { cache: "no-store" })
    .then((response) => response.ok ? response.json() : [])
    .then((videoUpdates) => {
      const siteUpdates = SITE_CHANGELOG.map(([date, content]) => ({ date, content, timestamp: `${date}T12:00:00+08:00` }));
      const merged = [...siteUpdates, ...videoUpdates].filter((item) => item.date !== "2026-08-25");
      document.querySelectorAll(".drawer-changelog").forEach((list) => {
        list.innerHTML = changelogMarkup(merged);
      });
    })
    .catch(() => {});
  const drawerSide = (drawer) => drawer.classList.contains("side-drawer-left") ? "left" : "right";
  const closeDrawer = (drawer) => {
    drawer.classList.remove("is-open");
    drawer.querySelector(".side-drawer-handle").setAttribute("aria-expanded", "false");
    document.body.classList.remove(`drawer-${drawerSide(drawer)}-open`);
  };
  const openDrawer = (drawer) => {
    drawers.filter((item) => item !== drawer).forEach(closeDrawer);
    drawer.classList.add("is-open");
    drawer.querySelector(".side-drawer-handle").setAttribute("aria-expanded", "true");
    document.body.classList.add(`drawer-${drawerSide(drawer)}-open`);
  };

  drawers.forEach((drawer) => {
    const handle = drawer.querySelector(".side-drawer-handle");
    const scrollArea = drawer.querySelector(".side-drawer-scroll");
    handle.addEventListener("pointerenter", () => openDrawer(drawer));
    drawer.addEventListener("pointerleave", () => closeDrawer(drawer));
    drawer.addEventListener("focusin", () => openDrawer(drawer));
    drawer.addEventListener("focusout", (event) => {
      if (!drawer.contains(event.relatedTarget)) closeDrawer(drawer);
    });
    handle.addEventListener("click", () => {
      if (drawer.classList.contains("is-open")) closeDrawer(drawer);
      else openDrawer(drawer);
    });
    scrollArea.addEventListener("wheel", (event) => {
      event.preventDefault();
      scrollArea.scrollTop += event.deltaY;
    }, { passive: false });
  });
}

function renderHomeIdentityMarquee() {
  const poster = document.querySelector("#identity-marquee-poster");
  if (!poster) return;

  const cardMarkup = (names, duplicate = false) => names
    .map((name) => `
      <button
        class="identity-marquee-card identity-motion-${identityMotionGroup(name)}"
        type="button"
        data-identity-name="${escapeHtml(name)}"
        aria-label="查看${escapeHtml(name)}身份牌大图"
        title="${escapeHtml(name)}"
        ${duplicate ? 'tabindex="-1"' : ""}
      >
        <span class="identity-marquee-card-inner identity-art-frame" style="${identityArtStyle(name)}">
          <img
            src="images/identities/${escapeHtml(ROLE_ART[name])}?v=${ASSET_VERSION}"
            alt="${duplicate ? "" : `${escapeHtml(name)}身份牌`}"
            width="480"
            height="680"
            loading="${duplicate ? "lazy" : "eager"}"
          />
        </span>
      </button>
    `)
    .join("");

  const rows = [
    { direction: "left", label: "正序身份展示", names: IDENTITY_ORDER },
    { direction: "right", label: "逆序身份展示", names: [...IDENTITY_ORDER].reverse() },
  ];

  poster.innerHTML = rows.map((row) => `
    <div class="identity-marquee-row identity-marquee-row-${row.direction}" data-marquee-direction="${row.direction}">
      <span class="visually-hidden">${row.label}</span>
      <div class="identity-marquee-track">
        <div class="identity-marquee-group">${cardMarkup(row.names)}</div>
        <div class="identity-marquee-group identity-marquee-group-copy" aria-hidden="true">${cardMarkup(row.names, true)}</div>
      </div>
    </div>
  `).join("");

  const marqueeRows = [...poster.querySelectorAll(".identity-marquee-row")];
  marqueeRows.forEach((row) => {
    row.querySelectorAll(".identity-marquee-card").forEach((card) => {
      card.addEventListener("pointerenter", () => row.classList.add("is-paused"));
      card.addEventListener("pointerleave", () => row.classList.remove("is-paused"));
      card.addEventListener("focus", () => row.classList.add("is-paused"));
      card.addEventListener("blur", () => row.classList.remove("is-paused"));
    });
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let frameCount = 0;
  let posterVisible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      posterVisible = entry.isIntersecting;
      poster.classList.toggle("is-offscreen", !posterVisible);
    }).observe(poster);
  }
  const rowCards = marqueeRows.map((row) => [...row.querySelectorAll(".identity-marquee-card")]);
  const paintCylinder = () => {
    frameCount += 1;
    if (frameCount % 2 === 0 && !document.hidden && posterVisible) {
      marqueeRows.forEach((row, rowIndex) => {
        const bounds = row.getBoundingClientRect();
        const center = bounds.left + bounds.width / 2;
        const halfWidth = Math.max(bounds.width / 2, 1);

        const positions = rowCards[rowIndex].map((card) => ({ card, bounds: card.getBoundingClientRect() }));
        positions.forEach(({ card, bounds: cardBounds }) => {
          const cardCenter = cardBounds.left + cardBounds.width / 2;
          const distance = Math.min(1, Math.abs(cardCenter - center) / halfWidth);
          const curve = Math.pow(distance, 1.35);
          const scale = 1 - curve * 0.43;
          const tilt = (cardCenter < center ? 1 : -1) * curve * 24;

          card.style.opacity = String(1 - curve * 0.5);
          card.style.transform = `translateY(${curve * 7}px) rotateY(${tilt}deg) scale(${scale})`;
        });
      });
    }
    window.requestAnimationFrame(paintCylinder);
  };

  window.requestAnimationFrame(paintCylinder);
}

function bindGlossarySearch() {
  const input = document.querySelector("#glossary-search");
  if (!input) return;

  const rows = [...document.querySelectorAll(".glossary-list > div")];
  const count = document.querySelector("#glossary-count");
  const empty = document.querySelector("#glossary-empty");
  const normalize = (value) => value.toLocaleLowerCase("zh-CN").replace(/\s+/g, "");

  const update = () => {
    const query = normalize(input.value.trim());
    let visible = 0;

    rows.forEach((row) => {
      const matches = !query || normalize(row.textContent).includes(query);
      row.hidden = !matches;
      if (matches) visible += 1;
    });

    if (count) count.textContent = query ? `找到 ${visible} 条` : `共 ${rows.length} 条`;
    if (empty) empty.hidden = visible !== 0;
  };

  input.addEventListener("input", update);
  input.addEventListener("search", update);
  update();
}

function bindImageFallbacks() {
  const fallback =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
        <rect width="1200" height="675" fill="#fff6df"/>
        <rect x="34" y="34" width="1132" height="607" rx="24" fill="#fbf7ea" stroke="#c8b58d" stroke-width="4"/>
        <circle cx="330" cy="315" r="86" fill="#235f5b" opacity=".16"/>
        <circle cx="874" cy="286" r="110" fill="#78343a" opacity=".13"/>
        <path d="M240 470c110-120 210-150 330-70 86 57 180 62 300 18 76-28 142-20 214 52" fill="none" stroke="#9a7728" stroke-width="18" stroke-linecap="round"/>
        <text x="600" y="348" text-anchor="middle" fill="#282117" font-size="54" font-family="Microsoft YaHei, Arial" font-weight="800">狼人杀入坑指南</text>
        <text x="600" y="414" text-anchor="middle" fill="#665d4d" font-size="28" font-family="Microsoft YaHei, Arial">插图加载中</text>
      </svg>
    `);

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = "true";
        image.src = fallback;
      },
      { once: true },
    );
  });
}

const SETUP_GUIDES = [
  {
    name: "魔幻对决",
    camps: ["神职：预言家、女巫、猎人、魔术师", "平民：平民 x4", "狼人：狼术师、狼人 x3"],
    note: "这一板最怕只记“谁被换了”。复盘时要把原号码、交换后号码、夜间技能目标分开记。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "先听清换位后谁吃了技能，别急着用位置逻辑硬定身份。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "验人要考虑换位影响，白天重点讲清自己验的是哪个座位、为什么验。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "用药前先确认刀口是否可能被换位影响，别把药用在低收益情绪位。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "枪口优先打能校正换位逻辑的位置，不要被单一号码误导。"),
      role("魔术师", "神职", "第一夜起可交换两名玩家座位，当夜技能效果视为对新玩家使用；每个号码牌只能换一次。", "目标是保护关键好人或制造狼队刀口错误，收益在于让夜间信息更偏向好人。"),
      role("狼术师", "狼人", "每夜在魔术师后睁眼，可再次更换两名玩家座位，随后与狼人共同行动。", "目标是破坏好人信息链，把查验、毒药、守护引到错误位置。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "白天要解释死亡和换位关系，别让狼术师的操作变成自己发言里的漏洞。"),
    ],
  },
  {
    name: "梦魇摄梦人",
    camps: ["神职：女巫、猎人、预言家、摄梦人", "平民：平民 x4", "狼人：梦魇、狼人 x3"],
    note: "摄梦和梦魇都会影响夜间结果。先判断谁无法行动、谁被保护，再看死亡能不能对上。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "别只听夜间信息，要看谁在利用“恐惧 / 梦游”解释漏洞。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "警徽流尽量验能打开关系的位置，避免被梦魇打断后世界断层。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "注意梦游免疫伤害，毒药最好打能改变票型的高收益狼位。"),
      role("猎人", "神职", "出局时可带走一名玩家；被毒杀、梦亡、恐杀时不能发动。", "发言要藏好枪口，避免被梦魇或狼队用规则压掉收益。"),
      role("摄梦人", "神职", "每晚必须选一名梦游者，梦游者免疫夜间伤害；连续两晚成为梦游者会梦亡；摄梦人夜间出局时梦游者一同梦亡。", "收益在于保护关键位或制造轮次差，但连续摄同一人会变成伤害。"),
      role("梦魇", "狼人", "每晚恐惧一名玩家，使其当夜无法行动；若恐惧狼人，整个狼人阵营也无法行动；不能连续恐惧同一人。", "目标是压预言家、女巫、摄梦人等关键技能，让好人的夜间信息断掉。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "刀口要配合梦魇目标，别把狼队夜晚打成互相冲突。"),
    ],
  },
  {
    name: "黑白使者",
    camps: ["神职：预言家、女巫、摄梦人、白夜使者", "平民：平民 x4", "狼人：黑夜使者、狼王、狼人 x2"],
    note: "这一板最重要的是“回溯前后信息怎么变化”。不要只看第一次夜晚结果。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "白天帮忙记录回溯前后的发言和票型，找谁在两套结果里解释不一致。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "查验可能被黑夜使者反杀威胁，发言要讲清验人收益和风险。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "毒药别急着打不确定位置，先看黑夜使者庇护可能带来的反伤。"),
      role("摄梦人", "神职", "每晚选择梦游者，连续两晚同一人会造成伤害。", "梦人路线要考虑黑夜使者庇护，最好让技能换到确定信息。"),
      role("白夜使者", "神职", "两个夜晚后的任意一天放逐投票前可发动回溯，使游戏回到前一夜；整局一次，警上和第一天不可回溯。", "收益在于纠错关键轮次。发动前要判断回溯能不能让好人多拿信息，而不是单纯拖时间。"),
      role("黑夜使者", "狼人", "每晚狼人睁眼后选择一名狼人庇护；被庇护狼人免疫夜间伤害，并可反杀查验、毒杀或二次伤害自己的身份；不能连续庇护同一人。", "目标是保护关键狼并反打神职，让好人不敢轻易用技能锁狼。"),
      role("狼王", "狼人", "按房规拥有出局带人能力。", "尽量把带人收益留给关键神职或归票位，别只为情绪换人。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "发言要能解释黑夜使者带来的异常夜间结果。"),
    ],
  },
  {
    name: "禁言长老",
    camps: ["神职：预言家、女巫、猎人、禁言长老", "平民：平民 x4", "狼人：狼人 x4"],
    note: "被禁言的人不是天然坏，也不是天然好。关键看他之前的发言、票型和谁希望他闭嘴。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "如果被禁言，动作要简洁，尽量让翻译帮你说清投票方向。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "要提前把警徽流和狼坑讲清，防止被禁言后信息断档。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "禁言会改变白天发言压力，用药要看谁在借禁言带节奏。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "如果被迫拍身份，枪口顺序要讲清楚，避免被狼队逼枪。"),
      role("禁言长老", "神职", "每晚可禁言一名玩家，该玩家次日放逐发言不能使用有声语言，只能用手势和动作表达，可指定一名翻译。", "收益在于压住高危狼位或阻断狼队发言节奏，但禁错好人会伤轮次。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "可以利用禁言制造混乱，但不要让自己显得过度期待别人说不清。"),
    ],
  },
  {
    name: "白狼王骑士",
    camps: ["神职：预言家、女巫、守卫、骑士", "平民：平民 x4", "狼人：白狼王、狼人 x3"],
    note: "骑士负责解决关键矛盾，白狼王负责强行换人。双方都在抢第一天的节奏。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "别逼神职乱拍身份，先帮骑士判断最值得验证的位置。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "起跳后要防白狼王自爆带走，警徽流尽量给出可执行路线。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "药水要看白狼王是否可能一换一，别让狼队轻松改轮次。"),
      role("守卫", "神职", "每晚守护一名玩家。", "守人路线要围绕真预言家和关键轮次，不要固定到被狼队绕开。"),
      role("骑士", "神职", "放逐发言环节可翻牌验证任意玩家；对方为狼人则狼人倒牌直接入夜，对方为好人则骑士出局并留遗言。", "收益是强拆真假世界。最好戳能同时验证多条关系的位置。"),
      role("白狼王", "狼人", "发言环节可自爆并带走一名玩家；可自爆、可自刀。被女巫毒杀后，警上选择吞毒自爆不可发动技能。", "目标是带走预言家、女巫、骑士等关键位，换掉好人节奏。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "白天要配合白狼王制造焦点，让骑士戳错或不敢戳。"),
    ],
  },
  {
    name: "狼美猎人",
    camps: ["神职：预言家、女巫、猎人、守卫", "平民：平民 x4", "狼人：狼美人、狼人 x3"],
    note: "狼美人让“出谁”变成连锁问题。残局一定要算殉情和猎人能不能开枪。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "后期别只算单出一人，要把狼美人殉情带来的连锁死亡算进去。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "验人要尽量打开情侣式关系和被魅惑风险，别只追单点身份。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "毒狼美人要看被魅惑目标是否会一起出局，别把好人轮次打崩。"),
      role("猎人", "神职", "出局可带走一名玩家；被女巫毒杀、被狼美人魅惑出局时不可发动。", "枪口要围绕狼美人和被魅惑关系，避免被狼队压掉技能。"),
      role("守卫", "神职", "每晚守护一名玩家。", "保护关键神职，同时注意狼美人可以用魅惑绕开单纯守护思路。"),
      role("狼美人", "狼人", "每夜与狼人共同行动后单独魅惑一名玩家；出局时魅惑玩家一并殉情。不可自刀、不可自爆、不可连续两晚魅惑同一人；作为最后一狼出局时不触发殉情。", "收益是控制关键好人和残局人数，用魅惑让好人不敢轻易推你。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "刀口要配合狼美人的魅惑目标，把好人的技能和票型拆开。"),
    ],
  },
  {
    name: "鬼魂新娘",
    camps: ["神职：预言家、女巫、猎人、守卫", "平民：平民 x4", "狼人：狼人 x3", "第三方：鬼魂新娘"],
    note: "固定三方阵营，单爆吞警徽。第三方要让另外两个阵营互相消耗。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "先分清情侣线是否改阵营，不要用普通好人板的逻辑硬套。"),
      role("预言家", "神职", "每晚查验一名玩家阵营；鬼魂新娘被查验为好人。", "查验要考虑第三方伪装成好人结果，白天更要看行为收益。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "用药前看清情侣殉情会不会让第三方或狼队直接获利。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "枪口优先打能确认阵营归属的位置，别只凭查验结果开枪。"),
      role("守卫", "神职", "每晚守护一名玩家。", "保护关键好人，同时防止第三方借平安夜做身份。"),
      role("鬼魂新娘", "第三方", "首夜选择一名新郎结为情侣，一人出局另一人殉情。情侣每晚可沟通信息，鬼魂新娘被预言家查验为好人。", "目标是藏成好人，让好人和狼人互相处理，最后靠情侣线收局。"),
      role("证婚人", "特殊身份", "首夜情侣见面时共同选择一人成为证婚人。证婚人只知道情侣号码，夜间不与情侣见面。单身狼人出局后情侣可带刀；单身狼人和情侣出局后证婚人可带刀。", "重点是判断什么时候帮情侣，什么时候隐藏自己。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "不仅要找神职，还要判断第三方是否在借狼队刀口做局。"),
    ],
  },
  {
    name: "石像鬼守墓人",
    camps: ["神职：预言家、女巫、猎人、守墓人", "平民：平民 x4", "狼人：石像鬼、狼人 x3"],
    note: "石像鬼和狼人不见面，守墓人又能补死亡信息。重点看谁的身份视角和队友视角对不上。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "听发言时区分“小狼视角”和“石像鬼视角”，别把不见面关系误判成好人。"),
      role("预言家", "神职", "每晚查验一名玩家阵营；石像鬼被查验为狼人。", "验人要兼顾小狼和石像鬼，警徽流最好能打开不见面关系。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "毒药优先打会改变局势的狼位，别被石像鬼的单独视角带偏。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "枪口要看守墓人信息和票型，避免替石像鬼清小狼。"),
      role("守墓人", "神职", "每夜得知上一个放逐环节出局玩家为好人或狼人。", "收益是校正白天放逐结果，发言要把前一轮票型一起讲清。"),
      role("石像鬼", "狼人", "全局与狼人不见面，每晚可验一名在场玩家具体身份。狼人同伴全部出局后，可查验后带刀。", "目标是找神职、找小狼、藏身份。不要因为信息多就聊成开眼视角。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "要防石像鬼不见面带来的误伤，也要靠发言让他能认到你们。"),
    ],
  },
  {
    name: "针锋相杠",
    camps: ["神职：预言家、女巫、猎人、杠精", "平民：平民 x4", "狼人：狼人 x4"],
    note: "开杠不是吵架，是把一组矛盾单独拎出来问清楚。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "开杠时别被情绪带跑，听谁能回答具体问题。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "发言要能经得住开杠追问，验人和警徽流别空。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "如果被开杠，不要因为压力乱拍信息，先说清用药逻辑。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "被开杠时重点保护枪口信息，不要让狼队骗枪。"),
      role("杠精", "神职", "放逐发言环节可翻牌中断一名玩家发言，进入 3 分钟开杠；结束后不记名投票，过半则对方失去本轮发言和投票权，若为警长则失去警长资格并由杠精接任；平票或未过半则杠精失去本轮投票权；整局一次。", "收益是打断狼队节奏或逼焦点位回答问题，但开错人会亏投票权。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "可以借开杠制造对立，但别只靠情绪压人。"),
    ],
  },
  {
    name: "机械狼通灵师",
    camps: ["神职：通灵师、女巫、猎人、守卫", "平民：平民 x4", "狼人：机械狼、狼人 x3"],
    note: "机械狼会让信息变脏。通灵师查到的信息要和死亡、票型一起看。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "不要把单个查验结果当铁证，要问机械狼有没有可能模仿。"),
      role("通灵师", "神职", "每晚可查验一名存活玩家具体身份；查验机械狼时，结果为机械狼模仿的玩家身份。", "收益是拿具体身份，但要警惕机械狼假信息，白天要讲清信息边界。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "用毒前考虑机械狼是否模仿守卫或女巫，避免被反伤或误导。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "枪口要结合通灵师信息和机械狼可能的模仿路线。"),
      role("守卫", "神职", "每晚守护一名玩家。", "守护关键位时要防机械狼模仿守卫制造假保护。"),
      role("机械狼", "狼人", "夜间可模仿一名玩家。模仿守卫后次夜可守护；模仿女巫后次夜可毒杀；模仿猎人出局可带人但被毒杀不能发动；模仿通灵师可查验具体身份；模仿狼人后，狼人同伴全出局可行使无视保护的技能刀；模仿平民无特殊技能。机械狼不与其他狼人见面，不可自爆，其他狼人出局后方可带刀。", "目标是制造假信息和假技能结果。收益在于让好人不知道哪条夜间信息可信。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "要用发言给机械狼留空间，别把它逼成孤立狼坑。"),
    ],
  },
  {
    name: "预女猎白混",
    camps: ["神职：预言家、女巫、猎人、白神", "平民：平民 x3、混血儿", "狼人：狼人 x4"],
    note: "混血儿的胜利条件跟随榜样，白神被放逐会公开身份。站边时要防混血儿目标不纯。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "普通村民要用票型和关系证明自己，不要只靠喊身份。"),
      role("混血儿", "平民", "首夜选择一名玩家作为榜样，胜利条件跟随榜样阵营。自身属性为平民，无夜间技能，被预言家查验永远为好人。", "目标是藏好榜样方向。好人阵营时帮好人，狼阵营时别急着暴露意图。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "验人结果对混血儿有限，要用发言和票型判断他到底帮谁。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "别因为混血儿被验好就完全放下，重点看他票型跟谁走。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "枪口优先打确定狼或强收益狼位，别被混血儿搅乱。"),
      role("白神", "神职", "被放逐时公布自己的身份。", "收益是保住好人轮次。发言要让好人知道你不怕被推，但别过早送身份。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "可以利用混血儿方向制造混乱，但要防他榜样在好人阵营。"),
    ],
  },
  {
    name: "孤注一掷",
    camps: ["神职：预言家、女巫、猎人、摄梦人", "平民：平民 x4", "狼人：典狱长、狼人 x3"],
    note: "交易是这板的核心。每次交易都要问：谁因为这次交易活下来，谁因此出局，谁最获利。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "白天要帮忙复盘交易选择，别只看最后死亡结果。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "验人要避开被交易扰乱的低收益位置，优先验能打开关系的人。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "交易可能改变夜间伤害结果，用药前先想是否会被交易抵消或转移。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "枪口要根据交易后谁获利来定，不要只看谁说话冲。"),
      role("摄梦人", "神职", "每晚必须选择梦游者，按房规产生保护或伤害。", "梦人路线要和交易结果分开记，避免把两个技能混成一条逻辑。"),
      role("典狱长", "狼人", "次夜起，每晚可选择两名玩家交易，随后与狼人行动；每名玩家只能交易一次。两人会得知交易对象但不知道身份，并选择交易或背叛。双方交易则免夜间伤害；双方背叛则彼此成为当夜技能目标；一交易一背叛则选择交易者出局。典狱长选自己交易时，双方选择相同则典狱长出局，不同则另一方出局。", "目标是用交易改死亡、骗选择、制造好人互疑。收益来自让好人无法只凭夜间结果定身份。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "刀口要配合典狱长交易，别让交易把狼队刀口收益抵消。"),
    ],
  },
  {
    name: "假面舞会",
    camps: ["神职：预言家、女巫、舞者、白神", "平民：平民 x4", "狼人：假面、狼人 x3"],
    note: "舞池阵营会被改变。听发言时要看他是不是借“舞池变化”解释所有漏洞。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "记录谁进过舞池，谁被面具改变过阵营，不要只靠原身份判断。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "验人要和舞池结果一起看，单点查验不一定能解释全部死亡。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "女巫要注意舞者和假面的免疫规则，毒药别打空收益。"),
      role("舞者", "神职", "自次夜起选择 3 名玩家共舞。同阵营无事；不同阵营时人数少的一方死亡。舞者免疫女巫的毒。若舞者选择自己参与共舞，当夜共舞三人均免疫狼刀。每名玩家只可参与一次共舞。", "收益是用三人组判断阵营并保护关键轮次，但选错组合会误伤好人。"),
      role("白神", "神职", "被放逐时公布自己的身份。", "不要过早暴露，关键时用身份帮助好人保住放逐轮次。"),
      role("假面", "狼人", "与狼人互不见面，每晚验证一名玩家是否在舞池中，并可赐予一名玩家面具，改变其当夜在舞池中的阵营。假面免疫女巫的毒，连续两晚不可验证同一人，连续两晚不可赐予同一人面具。", "目标是污染舞池判断，让好人把死亡归因到错误阵营。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "要配合假面制造错误共舞结果，但别聊出和假面见面的视角。"),
    ],
  },
  {
    name: "熊隐狼",
    camps: ["神职：熊、女巫、猎人、白神", "平民：平民 x4", "狼人：隐狼、狼人 x3"],
    note: "熊的咆哮看相邻位置，隐狼前期又可能不被当普通狼人处理。位置关系很重要。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "要结合熊左右两边关系，不要只看单人发言。"),
      role("熊", "神职", "入夜时，熊身边相邻两名玩家存在狼人时，次日法官宣布熊咆哮了；反之宣布熊没有咆哮。若熊夜间出局，无论身边是否有狼，法官均宣布熊没有咆哮。", "收益是用相邻关系压缩狼坑。发言要明确左右两边谁更像狼。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "用药要考虑熊的信息价值，别轻易让熊的轮次断掉。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "枪口优先打熊信息里解释不通的位置。"),
      role("白神", "神职", "被放逐时公布自己的身份。", "关键时能帮好人保轮次，但别过早让狼队找到刀口。"),
      role("隐狼", "狼人", "知道其他狼人身份，但其他狼人不知道隐狼身份。仅当狼人阵营只剩隐狼时，隐狼才可行使击杀。不可击杀前不会被查验为狼人。", "目标是藏成好人，等小狼出局后接刀。收益在于骗过查验和站边压力。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "要利用熊的相邻信息做身份，别把隐狼强行聊成见面队友。"),
    ],
  },
  {
    name: "唯邻是从",
    camps: ["神职：预言家、女巫、猎人、守卫", "平民：平民 x5", "狼人：狼王、狼人 x2、傀儡"],
    note: "相邻关系会影响技能错乱。别只听谁和谁像队友，也要看谁在保护相邻位置。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "人数多时更要主动给票型理由，不要躲成无法分辨的低焦点。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "若被傀儡影响，查验结果可能相反。发言要预留被干扰的可能。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "被傀儡影响时技能失效，别把“没效果”当成对方一定好。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "被傀儡影响时技能失效，发言要避免被狼队骗成无效枪。"),
      role("守卫", "神职", "每晚守护一名玩家。", "被傀儡影响时技能失效，守人路线要考虑相邻干扰。"),
      role("狼王", "狼人", "按房规拥有出局带人能力。", "目标是用带人能力打断好人关键轮次。"),
      role("傀儡", "狼人", "3 名狼人入夜后，选择与狼人相邻的一位玩家成为傀儡。傀儡玩家底牌不变，但技能错乱：预言家查验结果相反，女巫、猎人、守卫技能失效。", "收益是污染神职技能，让好人以为夜间结果可信。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "刀口和傀儡目标要配合，别让技能错乱没有实际收益。"),
    ],
  },
  {
    name: "诡术之境",
    camps: ["神职：预言家、女巫、魔术师、定序王子", "平民：平民 x4", "狼人：诡术师、狼人 x3"],
    note: "特殊规则：魔术师和诡术师交换的号码完全相同时，两者均无效。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "把交换号码和白天出局信息分开记，别被结果置换绕晕。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "验人要注意号码被交换，白天说清自己验人对应的逻辑收益。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "用药时先考虑是否可能被交换影响，毒药别打成低收益。"),
      role("魔术师", "神职", "每晚可交换两名玩家号码，按房规影响技能目标。", "目标是保护关键好人或让狼队刀错。收益来自提前预判狼队刀口。"),
      role("定序王子", "神职", "放逐投票后可翻牌发动技能，重新组织投票；重新投票前可额外发言一次，整局最多一次。", "收益是纠正关键票型。出手前要确定重投能让好人多拿一轮。"),
      role("诡术师", "狼人", "每晚可交换两个玩家号码，每个玩家只能交换一次；可不发动，不能连续空换。被交换玩家白天出局信息置换。", "目标是污染出局信息和技能目标，让好人推错关系。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "刀口要配合诡术师换位，白天要能解释信息置换后的世界。"),
    ],
  },
  {
    name: "盗贼丘比特",
    camps: ["神职：预言家、女巫、猎人、白神", "平民：平民 x5", "狼人：狼王、狼人 x2", "特殊身份：盗贼、丘比特"],
    note: "这一板先看胜利条件。情侣是同阵营还是第三方，会决定整局的方向。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "别只按基础板站边，要观察谁在保护情侣线。"),
      role("预言家", "神职", "每晚查验一名玩家阵营。", "查验能找狼，但不能直接解决情侣胜利条件问题。"),
      role("女巫", "神职", "拥有药水，按房规救人或毒人。", "用药要考虑殉情，别一瓶药帮第三方收局。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家；殉情出局的猎人不可发动技能。", "枪口要结合情侣线，避免被迫殉情失去技能。"),
      role("白神", "神职", "被放逐时公布自己的身份。", "能帮好人保轮次，但也可能成为情侣线的保护伞。"),
      role("盗贼", "特殊身份", "首夜第一个被唤醒，从剩余两张牌中选择一张作为本局身份；若牌堆中有狼人阵营身份，必须选择狼人阵营。", "目标是快速适应最终身份。别用选择前的视角发言。"),
      role("丘比特", "特殊身份", "首夜选择场上任意两名玩家成为情侣。丘比特不知道情侣身份，情侣也不知道丘比特身份。", "收益来自改变阵营结构。发言要判断情侣是否需要保护或隐藏。"),
      role("情侣", "特殊关系", "情侣彼此不知道对方身份。若为好人 + 狼人，丘比特与情侣成为第三方阵营，获胜条件为屠城；同阵营时胜利条件与原阵营相同。一方出局，另一方殉情，且殉情出局的狼王或猎人不可发动技能。", "关键是藏住绑定关系，同时让另外两个阵营互相消耗。"),
      role("狼王", "狼人", "按房规拥有出局带人能力；本版型狼人必须统一刀型才视为击杀成功，否则视为空刀。", "刀口必须统一，带人要考虑是否会触发情侣殉情。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家。", "先找情侣线，再找神职。刀型不统一会直接亏夜晚。"),
    ],
  },
  {
    name: "盗宝大师",
    camps: ["神职：通灵师、毒师、猎人、摄梦人、蒙面人", "平民：平民 x5", "狼人：狼王、狼人 x3", "特殊身份：盗宝大师、蒙面人"],
    note: "特殊规则：本版型首夜狼人无法发动击杀技能。",
    roles: [
      role("平民", "平民", "没有夜间技能。", "因为首夜无刀，第一天别用“没死人”套基础板逻辑。"),
      role("通灵师", "神职", "每晚可查验一名玩家具体身份。", "信息要和盗宝大师阵营变化一起看，别只看单张身份牌。"),
      role("毒师", "神职", "拥有一瓶毒药，可夜间毒杀一名玩家。被毒杀的猎人或狼王无法发动技能。", "毒药最好打能改变轮次的狼位，尤其注意狼王是否会被压技能。"),
      role("猎人", "神职", "出局时可按房规带走一名玩家。", "枪口要避开被毒师处理过的无收益位置。"),
      role("摄梦人", "神职", "每晚必须选择梦游者，按房规产生保护或伤害。", "梦人路线要和盗宝大师用过的技能牌分开记。"),
      role("蒙面人", "神职 / 特殊", "入夜被毒、摄或狼人刀死时被动发动蒙面技能，进入中毒和负伤状态，当晚不死，在第二天自己发言结束后死亡。盗宝蒙面狼为场上最后一狼时，被抗推可主动蒙面被推不死，入夜可多一刀，此时盗宝必须切为蒙面人牌才生效。", "好人蒙面要用最后发言交信息；盗宝蒙面狼则用它争最后轮次。"),
      role("盗宝大师", "特殊身份", "首夜获知剩余牌堆三张身份牌。若牌堆有狼人阵营身份，本局为狼人阵营；其狼人同伴全部出局后可行使击杀技能，反之为好人阵营。每夜选择一张并使用其技能，连续两夜不可选择同一张身份牌。", "目标随阵营变化。核心收益是灵活借技能牌，但每次选择都要服务当下轮次。"),
      role("狼王", "狼人", "按房规拥有出局带人能力。", "带人要配合盗宝大师的阵营和技能选择，别让最后一狼技能断掉。"),
      role("狼人", "狼人", "夜里共同击杀一名玩家；首夜不可击杀。", "第一天重点做身份，不要暴露首夜无刀带来的视角。"),
    ],
  },
];

const ROLE_ART = {
  "白狼王": "white-wolf-king.png",
  "白神": "white-god.png",
  "白夜使者": "white-night-envoy.png",
  "盗宝大师": "treasure-master.png",
  "盗贼": "thief.png",
  "典狱长": "warden.png",
  "定序王子": "order-prince.png",
  "毒师": "poisoner.png",
  "杠精": "debater.png",
  "诡术师": "trickster.png",
  "鬼魂新娘": "ghost-bride.png",
  "黑夜使者": "black-night-envoy.png",
  "混血儿": "mixed-blood.png",
  "机械狼": "mechanical-wolf.png",
  "假面": "mask.png",
  "禁言长老": "silence-elder.png",
  "傀儡": "puppet.png",
  "狼美人": "wolf-beauty.png",
  "狼人": "werewolf.png",
  "狼术师": "wolf-sorcerer.png",
  "狼王": "wolf-king.png",
  "猎人": "hunter.png",
  "蒙面人": "masked-one.png",
  "梦魇": "nightmare.png",
  "魔术师": "magician.png",
  "女巫": "witch.png",
  "平民": "villager.png",
  "骑士": "knight.png",
  "情侣": "lovers.png",
  "丘比特": "cupid.png",
  "摄梦人": "dreamer.png",
  "石像鬼": "gargoyle.png",
  "守墓人": "gravekeeper.png",
  "守卫": "guard.png",
  "通灵师": "medium.png",
  "舞者": "dancer.png",
  "熊": "bear.png",
  "隐狼": "hidden-wolf.png",
  "预言家": "seer.png",
  "证婚人": "officiant.png",
};

const IDENTITY_ORDER = [
  "预言家", "女巫", "猎人", "白神", "平民", "混血儿", "狼人", "通灵师", "守卫", "机械狼",
  "舞者", "假面", "魔术师", "定序王子", "诡术师", "狼王", "傀儡", "毒师", "摄梦人", "蒙面人",
  "盗宝大师", "梦魇", "狼术师", "白夜使者", "黑夜使者", "禁言长老", "骑士", "白狼王", "狼美人", "鬼魂新娘",
  "证婚人", "守墓人", "石像鬼", "杠精", "典狱长", "熊", "隐狼", "盗贼", "丘比特", "情侣",
];

const IDENTITY_CATEGORIES = [
  { id: "villagers", title: "村民", names: ["平民"] },
  { id: "gods", title: "神职", names: ["预言家", "女巫", "猎人", "白神", "通灵师", "守卫", "舞者", "魔术师", "定序王子", "毒师", "摄梦人", "蒙面人", "白夜使者", "禁言长老", "骑士", "守墓人", "杠精", "熊"] },
  { id: "wolves", title: "小狼", names: ["狼人"] },
  { id: "special-wolves", title: "大狼", note: "带有特殊技能的狼人", names: ["机械狼", "假面", "诡术师", "狼王", "盗宝大师", "梦魇", "狼术师", "黑夜使者", "白狼王", "狼美人", "石像鬼", "典狱长", "隐狼"] },
  { id: "special", title: "特殊身份", note: "或第三方", names: ["混血儿", "傀儡", "鬼魂新娘", "证婚人", "盗贼", "丘比特", "情侣"] },
];

// Shared display bounds (left, top, right, bottom) in 480 x 680 source files.
// Includes irregular blank edges; artwork files stay intact.
const IDENTITY_ART_MARGINS = {
  "黑夜使者": [19, 7, 20, 7], "舞者": [27, 13, 28, 13],
  "杠精": [18, 5, 19, 5], "鬼魂新娘": [19, 7, 20, 7],
  "守墓人": [27, 12, 27, 12], "守卫": [27, 12, 28, 13],
  "假面": [19, 6, 20, 7], "机械狼": [20, 6, 20, 6],
  "通灵师": [27, 12, 27, 12], "混血儿": [19, 7, 20, 7],
  "定序王子": [16, 6, 16, 6], "毒师": [25, 4, 26, 4],
  "傀儡": [20, 6, 20, 6], "禁言长老": [20, 6, 21, 6],
  "诡术师": [19, 7, 20, 7], "典狱长": [25, 4, 26, 4],
};

function identityArtStyle(name) {
  const [left, top, right, bottom] = IDENTITY_ART_MARGINS[name] || [0, 0, 0, 0];
  const width = 480 - left - right;
  const height = 680 - top - bottom;
  return `--art-width:${480 / width * 100}%;--art-height:${680 / height * 100}%;--art-left:${-left / width * 100}%;--art-top:${-top / height * 100}%;`;
}

const SETUP_ORDER = [
  "预女猎白混", "机械狼通灵师", "假面舞会", "唯邻是从", "诡术之境", "盗宝大师",
  "梦魇摄梦人", "鬼魂新娘", "白狼王骑士", "石像鬼守墓人", "狼美猎人", "盗贼丘比特",
  "禁言长老", "针锋相杠", "黑白使者", "孤注一掷", "魔幻对决", "熊隐狼",
];

const IDENTITY_MOTION_GROUPS = {
  wolf: new Set([
    "白狼王", "典狱长", "诡术师", "黑夜使者", "机械狼", "假面", "傀儡", "狼美人", "狼人", "狼术师",
    "狼王", "梦魇", "石像鬼", "隐狼",
  ]),
  mystic: new Set([
    "白夜使者", "盗宝大师", "毒师", "鬼魂新娘", "混血儿", "魔术师", "女巫", "情侣", "丘比特", "摄梦人",
    "通灵师", "舞者", "预言家",
  ]),
  martial: new Set(["白神", "猎人", "骑士", "守卫", "熊"]),
};

function renderIdentityGallery() {
  const container = document.querySelector("#identity-gallery");
  if (!container) return;

  container.innerHTML = `
    <nav class="identity-category-nav" aria-label="身份分类">
      ${IDENTITY_CATEGORIES.map((group) => `<a href="#identity-${group.id}">${group.title}<span>${group.names.length}</span></a>`).join("")}
    </nav>
    ${IDENTITY_CATEGORIES.map((group) => `
      <section class="identity-group" aria-labelledby="identity-${group.id}">
        <header class="identity-group-heading"><h3 id="identity-${group.id}">${group.title}${group.note ? `<small>（${group.note}）</small>` : ""}</h3><span>${group.names.length} 个身份</span></header>
        <div class="identity-gallery">
          ${group.names.map((name) => `
        <figure class="identity-gallery-card identity-motion-${identityMotionGroup(name)}" data-identity-name="${escapeHtml(name)}" tabindex="0" role="button" aria-label="查看${escapeHtml(name)}身份牌大图" title="${escapeHtml(name)}">
          <span class="identity-art-frame" style="${identityArtStyle(name)}">
          <img src="../images/identities/${escapeHtml(ROLE_ART[name])}?v=${ASSET_VERSION}" alt="${escapeHtml(name)}身份牌" width="480" height="680" loading="lazy" />
          </span>
        </figure>
          `).join("")}
        </div>
      </section>
    `).join("")}`;
}

function identityMotionGroup(name) {
  const entry = Object.entries(IDENTITY_MOTION_GROUPS).find(([, names]) => names.has(name));
  return entry?.[0] || "story";
}

function bindSiteMotion() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  bindIdentityLightbox();
  bindScrollProgress();

  if (reduceMotion) return;
  bindScrollReveals();
}

// Selected Lucide icons, kept local; see assets/lucide-LICENSE.txt.
function uiIcon(name) {
  const paths = {
    left: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    right: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  };
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
}

function bindPageIndex() {
  const hero = document.querySelector(".page-hero");
  const sections = [...document.querySelectorAll(".page-shell > .page-section[aria-labelledby]")];
  if (hero && sections.length > 1) {
    const nav = document.createElement("nav");
    nav.className = "page-index";
    nav.setAttribute("aria-label", "本页章节");
    nav.innerHTML = sections.map((section) => {
      const heading = document.getElementById(section.getAttribute("aria-labelledby"));
      return `<a href="#${heading.id}">${escapeHtml(heading.textContent)}</a>`;
    }).join("");
    hero.after(nav);
    const links = [...nav.querySelectorAll("a")];
    const update = () => {
      let current = 0;
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= 190) current = index;
      });
      links.forEach((link, index) => {
        if (index === current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
  const top = document.createElement("button");
  top.className = "back-to-top";
  top.type = "button";
  top.title = "回到顶部";
  top.setAttribute("aria-label", "回到顶部");
  top.innerHTML = uiIcon("up");
  document.body.append(top);
  top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }));
  const updateTop = () => { top.hidden = window.scrollY < 600; };
  window.addEventListener("scroll", updateTop, { passive: true });
  updateTop();
}

function bindStickyDisclosures() {
  const header = document.querySelector(".site-header");
  const index = document.querySelector(".page-index");
  const updateOffset = () => {
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const offset = headerHeight + (index?.getBoundingClientRect().height || 0);
    document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
    document.documentElement.style.setProperty("--disclosure-top", `${offset}px`);
  };
  updateOffset();
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(updateOffset);
    [header, index].filter(Boolean).forEach((element) => observer.observe(element));
  } else {
    window.addEventListener("resize", updateOffset);
  }
  document.querySelectorAll(".season-panel, .setup-panel").forEach((panel) => {
    const summary = panel.querySelector(":scope > summary");
    let closingPinned = false;
    summary.addEventListener("click", () => {
      const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--disclosure-top"));
      closingPinned = panel.open && panel.getBoundingClientRect().top < offset;
    });
    panel.addEventListener("toggle", () => {
      if (!panel.open && closingPinned) {
        panel.scrollIntoView({ block: "start", behavior: "instant" });
      }
      closingPinned = false;
    });
  });
}

function bindIdentityLightbox() {
  const cards = document.querySelectorAll(".identity-gallery-card, .identity-marquee-card");
  if (!cards.length) return;

  const dialog = document.createElement("dialog");
  dialog.className = "identity-dialog";
  dialog.setAttribute("aria-label", "身份牌大图");
  dialog.innerHTML = `
    <div class="identity-dialog-toolbar">
      <span class="identity-dialog-position" aria-live="polite"></span>
      <button class="identity-dialog-close" type="button" aria-label="关闭大图" title="关闭大图">${uiIcon("close")}</button>
    </div>
    <figure>
      <span class="identity-art-frame"><img alt="" /></span>
      <figcaption></figcaption>
    </figure>
    <div class="identity-dialog-navigation">
      <button type="button" data-step="-1" aria-label="上一张身份牌" title="上一张身份牌">${uiIcon("left")}</button>
      <button type="button" data-step="1" aria-label="下一张身份牌" title="下一张身份牌">${uiIcon("right")}</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const image = dialog.querySelector("img");
  const caption = dialog.querySelector("figcaption");
  const closeButton = dialog.querySelector(".identity-dialog-close");
  const uniqueCards = [...new Map([...cards].map((card) => [card.dataset.identityName, card])).values()];
  let selected = 0;
  let opener = null;
  let openedWithKeyboard = false;
  const paintCard = () => {
    const card = uniqueCards[selected];
    image.src = card.querySelector("img").src;
    image.alt = `${card.dataset.identityName}身份牌`;
    image.parentElement.style.cssText = identityArtStyle(card.dataset.identityName);
    caption.textContent = card.dataset.identityName;
    dialog.querySelector(".identity-dialog-position").textContent = `${String(selected + 1).padStart(2, "0")} / ${uniqueCards.length}`;
  };
  const step = (direction) => {
    selected = (selected + direction + uniqueCards.length) % uniqueCards.length;
    paintCard();
  };

  const openCard = (card, keyboard = false) => {
    opener = card;
    openedWithKeyboard = keyboard;
    selected = uniqueCards.findIndex((item) => item.dataset.identityName === card.dataset.identityName);
    paintCard();
    dialog.showModal();
    document.body.classList.add("lightbox-open");
  };

  cards.forEach((card) => {
    card.addEventListener("click", (event) => openCard(card, event.detail === 0));
    if (card.tagName === "BUTTON") return;
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCard(card, true);
      }
    });
  });

  closeButton.addEventListener("click", () => dialog.close());
  dialog.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", () => step(Number(button.dataset.step))));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      step(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("lightbox-open");
    opener?.focus({ preventScroll: true });
    const row = opener?.closest(".identity-marquee-row");
    if (row && !openedWithKeyboard) {
      row.classList.toggle("is-paused", Boolean(row.querySelector(".identity-marquee-card:hover")));
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function bindScrollReveals() {
  if (!("IntersectionObserver" in window)) return;

  const targets = document.querySelectorAll(
    ".hero-copy, .hero-media, .page-hero-copy, .page-hero-media, .page-section > .page-visual, .page-section > h2, .portal-card, .stat-card, .setup-panel, .season-panel",
  );
  if (!targets.length) return;

  document.body.classList.add("has-scroll-reveal");
  targets.forEach((target, index) => {
    target.dataset.reveal = "";
    target.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 55}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.04, rootMargin: "0px 0px -24px" },
  );
  targets.forEach((target) => observer.observe(target));
}

function bindPointerHalo() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const halo = document.createElement("span");
  halo.className = "pointer-halo";
  halo.setAttribute("aria-hidden", "true");
  document.body.appendChild(halo);

  let frame = 0;
  let x = -100;
  let y = -100;
  const paint = () => {
    halo.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    frame = 0;
  };

  document.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
    halo.classList.add("is-visible");
    if (!frame) frame = window.requestAnimationFrame(paint);
  });
  document.addEventListener("pointerover", (event) => {
    halo.classList.toggle("is-active", Boolean(event.target.closest("a, button, summary, .identity-gallery-card, .identity-marquee-card")));
  });
  document.addEventListener("pointerleave", () => halo.classList.remove("is-visible"));
}

function bindScrollProgress() {
  const progress = document.createElement("span");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  let frame = 0;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    progress.style.transform = `scaleX(${ratio})`;
    frame = 0;
  };
  const requestUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
}

function role(name, camp, skill, play) {
  return { name, camp, skill, play };
}

function bindNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      close();
      toggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) close();
  });
  nav.querySelector(".is-active")?.setAttribute("aria-current", "page");
}

function bindCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copy);
      if (!target) return;

      const text = target.innerText.trim();
      const originalText = button.dataset.originalText || button.textContent;
      button.dataset.originalText = originalText;

      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "已复制";
      } catch {
        const copied = fallbackCopy(text);
        button.textContent = copied ? "已复制" : "已选中文本";
        if (!copied) selectElementText(target);
      }

      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1400);
    });
  });
}

function renderJcmsPage() {
  const data = window.JCMS_SEASONS;
  const root = document.querySelector("#jcms-seasons");
  if (!data || !root) return;

  const seasons = sortSeasons(data.seasons || []);
  const allEpisodes = seasons.flatMap((season) => season.episodes || []);
  const allBoards = countValues(allEpisodes.map((episode) => episode.board)).filter((board) => board.name && !["非对局/待补充", "待补充"].includes(board.name));
  const stats = document.querySelector("#jcms-stats");

  if (stats) {
    stats.innerHTML = [
      statCard("合集", `${seasons.length} 季`, "最新的放在前面"),
      statCard("视频", `${allEpisodes.length} 条`, "点开就能看原局"),
      statCard("版型", `${allBoards.length} 种`, "从基础板到花板都有"),
      statCard("最近更新", displaySeasonTitle(seasons[0]?.title || ""), seasonLatestDate(seasons[0]) || "看合集列表"),
    ].join("");
  }

  root.innerHTML = seasons
    .map((season) => {
      const boards = (season.boards || []).slice(0, 8);
      const episodes = season.episodes || [];

      return `
        <details class="season-panel">
          <summary>
            <span>${escapeHtml(displaySeasonTitle(season.title))}</span>
            <small>${season.completed ? "已完结 · " : ""}${episodes.length} 条视频</small>
          </summary>
          <div class="season-body">
            <div class="board-chip-row">
              ${boards
                .map((board) => `<span class="board-chip">${escapeHtml(board.name)} ${board.count}</span>`)
                .join("")}
            </div>
            <div class="table-wrap compact-table">
              <table>
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>日期</th>
                    <th>版型</th>
                    <th>时长</th>
                    <th>视频</th>
                  </tr>
                </thead>
                <tbody>
                  ${episodes.map((episode, index) => episodeRow(episode, season, index)).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      `;
    })
    .join("");

  const filters = document.createElement("form");
  filters.className = "match-filters";
  filters.setAttribute("role", "search");
  filters.innerHTML = `
    <label class="match-query"><span class="visually-hidden">搜索对局</span>${uiIcon("search")}<input type="search" placeholder="搜索日期、期数或版型" aria-label="搜索对局" /></label>
    <label class="match-board"><span class="visually-hidden">筛选比赛版型</span><select aria-label="筛选比赛版型"><option value="">全部版型</option>${allBoards.map((board) => `<option value="${escapeHtml(board.name)}">${escapeHtml(board.name)}</option>`).join("")}</select></label>
    <output aria-live="polite"></output>
  `;
  root.before(filters);
  const empty = document.createElement("p");
  empty.className = "match-empty";
  empty.textContent = "没有匹配的对局";
  empty.hidden = true;
  root.after(empty);
  let initialOpen = null;
  const panels = [...root.querySelectorAll(".season-panel")];
  const applyFilters = () => {
    const query = filters.querySelector("input").value.trim().toLocaleLowerCase();
    const board = filters.querySelector("select").value;
    const filtering = Boolean(query || board);
    if (filtering && !initialOpen) initialOpen = panels.map((panel) => panel.open);
    let count = 0;
    panels.forEach((panel, index) => {
      let matched = 0;
      panel.querySelectorAll("tbody tr").forEach((row, rowIndex) => {
        const episode = seasons[index].episodes[rowIndex];
        const text = `${seasons[index].title} ${episode.title} ${getEpisodeDate(episode, seasons[index])} ${episode.board}`.toLocaleLowerCase();
        const visible = (!query || query.split(/\s+/).every((part) => text.includes(part))) && (!board || episode.board === board);
        row.hidden = !visible;
        if (visible) matched += 1;
      });
      panel.hidden = matched === 0;
      if (filtering) panel.open = matched > 0;
      else if (initialOpen) panel.open = initialOpen[index];
      count += matched;
    });
    if (!filtering) initialOpen = null;
    empty.hidden = count > 0;
    filters.querySelector("output").textContent = `${count} 场对局`;
  };
  filters.addEventListener("submit", (event) => event.preventDefault());
  filters.addEventListener("input", applyFilters);
  filters.addEventListener("change", applyFilters);
  applyFilters();
}

function episodeRow(episode, season, index) {
  const date = getEpisodeDate(episode, season);
  return `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(episode.board || "待补充")}</td>
      <td>${formatDuration(episode.duration)}</td>
      <td><a href="${escapeHtml(episode.url)}" target="_blank" rel="noreferrer">打开</a></td>
    </tr>
  `;
}

function renderRolePage() {
  const list = document.querySelector("#setup-guide-list");
  if (!list) return;

  const guidesByName = new Map(SETUP_GUIDES.map((guide) => [guide.name, guide]));
  list.innerHTML = SETUP_ORDER.map((name) => guidesByName.get(name)).filter(Boolean).map((guide) => {
    return `
      <details class="setup-panel">
        <summary>
          <span>${escapeHtml(guide.name)}</span>
          <small>${guide.roles.length} 类身份</small>
        </summary>
        <div class="setup-panel-body">
          <div class="setup-camp-list">
            ${guide.camps.map((camp) => `<span class="board-chip">${escapeHtml(camp)}</span>`).join("")}
          </div>
          <div class="role-mini-grid">
            ${guide.roles.map((item) => roleCard(item)).join("")}
          </div>
        </div>
      </details>
    `;
  }).join("");
}

function roleCard(item) {
  const art = ROLE_ART[item.name] || (item.camp.includes("狼人") ? "werewolf.png" : "villager.png");
  return `
    <article class="role-mini-card identity-motion-${identityMotionGroup(item.name)}">
      <img class="role-mini-card-art" src="../images/identities/${escapeHtml(art)}?v=${ASSET_VERSION}" alt="" aria-hidden="true" loading="lazy" />
      <span>${escapeHtml(item.camp)}</span>
      <h3>${escapeHtml(item.name)}</h3>
      <p><strong>技能：</strong>${escapeHtml(item.skill)}</p>
      <p><strong>打法：</strong>${escapeHtml(item.play)}</p>
    </article>
  `;
}

function statCard(label, value, help) {
  return `
    <article class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(help)}</p>
    </article>
  `;
}

function sortSeasons(seasons) {
  return [...seasons].sort((a, b) => {
    const dateCompare = seasonLatestDate(b).localeCompare(seasonLatestDate(a));
    if (dateCompare) return dateCompare;
    return displaySeasonTitle(b.title).localeCompare(displaySeasonTitle(a.title), "zh-CN");
  });
}

function seasonLatestDate(season = {}) {
  const dates = (season.episodes || []).map((episode) => episode.date).filter(Boolean);
  return dates.length ? dates.sort().at(-1) : "";
}

function getEpisodeDate(episode, season) {
  if (episode.date) return episode.date;
  const seasonTitle = `${season?.title || ""}${season?.sourceTitle || ""}`;
  if (
    seasonTitle.includes("天空之城")
    && (episode.title || "").includes("第二局-唯邻是从")
  ) {
    return "2024-09-04";
  }
  if (
    seasonTitle.includes("天空之城")
    && (episode.title || "").includes("第三局-机械狼通灵师")
  ) {
    return "2024-09-04";
  }
  return "";
}

function displaySeasonTitle(title = "") {
  if (title.includes("天空之城")) return "天空之城";
  if (title.includes("深海迷航")) return "深海迷航";
  return title;
}

function countValues(values) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

function formatDuration(value) {
  const seconds = Number(value || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = Math.floor(seconds % 60);
  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  textarea.remove();
  return copied;
}

function selectElementText(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


# 狼人杀新手学院

一个纯静态的狼人杀入门与进阶教学网站，包含：

- 首页门户：`index.html`
- 对局复盘库：`pages/matches.html`
- 经典对局深度复盘：`pages/classics.html`
- 夜间手势图解：`pages/signals.html`
- 精品发言模板：`pages/speech.html`
- 破局逻辑：`pages/logic.html`
- 版型身份：`pages/roles.html`
- 抿牌关系：`pages/tips.html`
- 视频资源：`pages/resources.html`
- 论坛线下：`pages/forum.html`
- 曙光航纪合集数据：`data/season-dawn-voyage.js`
- B 站 HTML 解析工具：`tools/extract_bili_html.py`

## 本地打开

直接双击 `index.html` 即可浏览。也可以用任意静态服务器打开本目录。

## 更新对局复盘

优先更新 `pages/matches.html`：

1. 添加视频标题、链接、板型和胜负。
2. 用页面里的“看完视频后的复盘模板”整理摘要。
3. 只发布学习摘要和自己的复盘，不粘贴完整字幕或大段节目原文。

## 部署

这是纯静态站，部署时上传以下内容即可：

- `index.html`
- `styles.css`
- `script.js`
- `data/`
- `pages/`

推荐方式：

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- 自建 Nginx/Apache 静态站点


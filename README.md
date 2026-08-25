# 狼人杀新手学院

一个纯静态的狼人杀入门教学网站，主要页面包括：

- 首页门户：`index.html`
- 京城大师赛：`pages/jcms.html`
- 版型身份：`pages/roles.html`
- 夜间手势图解：`pages/signals.html`
- 常用术语：`pages/speech.html`
- 游戏技巧：`pages/tips.html`
- 曙光航纪合集数据：`data/season-dawn-voyage.js`
- 京城大师赛自动更新：`tools/update_jcms.py`

## 本地打开

直接双击 `index.html` 即可浏览。也可以用任意静态服务器打开本目录。

## 自动更新

GitHub Actions 会在北京时间每周三、周四、周五、周六 06:00 检查京城大师赛合集。发现新视频后，会同步更新合集数据和网站更新记录。

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


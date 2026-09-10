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

### 本地同步 GitHub

本地也包含 `tools/update_jcms.py`，但采集定时任务运行在 GitHub Actions。本地无需重复采集，拉取远端提交即可获得相同的视频和更新记录。

安装 Node.js 后，在仓库目录运行：

```powershell
node tools/sync-github.cjs
```

同步工具仅在 `main` 分支、工作区干净且没有未完成的 Git 操作时执行快进更新。有未提交文件、本地待推送提交或分支分叉时停止，不覆盖修改，不自动提交或推送。可以由本机定时任务调用；电脑需要开机联网，使用 Codex 定时任务时还需要 Codex 运行。

### 修改后推送

先检查并提交本地修改，再获取、合并 GitHub 最新提交，最后正常推送：

```powershell
git status
git add <本次修改的文件>
git commit -m "说明本次修改"
git fetch origin
git merge --no-edit origin/main
node --test tools/test-guide.cjs tools/test-sync.cjs
git push origin main
```

发生冲突时先解决并验证，再推送。远端在此期间又更新导致推送被拒绝时，重新 fetch、merge、测试后再推送，禁止强制推送。重点保留 `data/jcms-seasons.js` 和 `data/jcms-update-history.json` 中远端新增的内容，也不要删除 `.github/workflows/update-jcms.yml`。

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


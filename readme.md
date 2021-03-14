# 项目说明

本程序用于从 auction.artron.net 网站下载完整高清大图。


# 使用方法

0. 运行本程序（会自动启动 Chromium 浏览器)

1. 打开 [雅昌艺术拼拍卖网](https://auction.artron.net/)

2. 进入【得藏会员精览高清大图】页面（需购买会员资格），点击页面内右上角的按钮。


# 开发环境

```cmd
npm install
xcopy /S /I node_modules\puppeteer\.local-chromium\win64-856583\chrome-win .\chromium
node index.js
```


# 打包成 .exe

```cmd
npm install -g pkg
pkg .
```
打包生成的 `artron-downloader.exe` 运行的时候需要同目录下存在 `chromium` 目录。


# 参考资料

[Puppeteer](https://github.com/puppeteer/puppeteer)
| [English](https://pptr.dev/)
| [中文](https://zhaoqize.github.io/puppeteer-api-zh_CN/)

[Using Chrome DevTools Protocol](https://github.com/aslushnikov/getting-started-with-cdp)

[Awesome Chrome DevTools](https://github.com/ChromeDevTools/awesome-chrome-devtools)

[nodejs 程序打包成 .exe](https://github.com/vercel/pkg)

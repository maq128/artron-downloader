# 项目说明

本程序用于从 auction.artron.net 网站下载完整高清大图。


# 使用方法

0. 运行本程序（会自动启动 Chromium 浏览器)

1. 打开 [雅昌艺术品拍卖网](https://auction.artron.net/)

2. 进入【拍品详情】页面的时候，页面中会出现相应的功能按钮。


# 开发环境

```cmd
npm install
xcopy /S /I node_modules\puppeteer\.local-chromium\win64-856583\chrome-win .\chromium

node index.js
```


# 打包成 .exe

安装 `pkg` 打包工具：
```cmd
npm install -g pkg
```

基于 `package.json` 的配置信息进行打包：
```cmd
pkg .
```

**NOTE:** 打包生成的 `.exe` 可执行程序文件在运行的时候需要同目录下存在必要的运行时文件：
- `chromium` 文件夹
- `js` 文件夹


# 遗留问题

如果页面的缩放比例不是 `100%`，或者卷滚条位置不在初始状态，那么最终调用 `.screenshot()` 的时候获取到的图片可能不完整。

复位卷滚条比较容易，**但是复位页面缩放比例暂时还没有找到方法。**


# 参考资料

[Puppeteer](https://github.com/puppeteer/puppeteer)
| [English](https://pptr.dev/)
| [中文](https://zhaoqize.github.io/puppeteer-api-zh_CN/)

[Using Chrome DevTools Protocol](https://github.com/aslushnikov/getting-started-with-cdp)

[Awesome Chrome DevTools](https://github.com/ChromeDevTools/awesome-chrome-devtools)

[nodejs 程序打包成 .exe](https://github.com/vercel/pkg)

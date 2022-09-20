const process = require('process');
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.APP_NODE_MODULES, 'puppeteer'));

async function onTargetCreated(target) {
	// 只关注 page 类型的 target
	if (target.type() != 'page') return;

	// page 实际上代表的是“页签”，而不是“网页”
	let page = await target.page();

	// 监听该页签的 load 事件
	// Note: 当该页签导航到其它 url 的时候，监听仍然有效
	page.on('load', async function() {
		// 只关注【拍品详情】页面
		let url = page.url();
		let m = url.match(/https\:\/\/auction\.artron\.net\/paimai-([0-9a-zA-Z]*)\/?/);
		if (!m || m.length != 2) return;

		// 在页面中注入一段代码
		var injectJsFile = path.join(__dirname, 'inject.js');
		var injectJs = fs.readFileSync(injectJsFile, 'utf-8');
		await page.evaluate(injectJs);
	});

	// 通过监控 console 来接收页面发出的 "下载完成" 通知
	page.on('console', async function(msg) {
		if (msg.text() == '下载完成') {
			// 获取 title 并剔除作为文件名可能包含的非法字符  \/:*?"<>|
			let title = await page.title();
			title = title.replace(/[\\\/\:\*\?\"\<\>\|]/g, '');
			let m = title.match(/【(.*)】/);
			title = m && m.length == 2 && m[1] || title;
			let filename = title + '.png';

			// 截图并保存
			let bigpic = await page.$('.ad-bigpic');
			await bigpic.screenshot({path: filename});
			console.log('下载完成: ' + filename);

			// 在网页内弹框提示，然后刷新恢复
			await page.evaluate(`alert('下载完成！\\n\\n` + filename + `');window.location.reload()`);
		}
	});
};

(async () => {
	// 去掉启动时显示的【缺少 Google API 密钥，因此 Chromium 的部分功能将无法使用。】
	process.env.GOOGLE_API_KEY = 'no';
	process.env.GOOGLE_DEFAULT_CLIENT_ID = 'no';
	process.env.GOOGLE_DEFAULT_CLIENT_SECRET = 'no';

	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		userDataDir: 'UserData',
		executablePath: 'chromium\\chrome.exe',

		args: [
			// 去掉启动时显示的【Chromium 不是您的默认浏览器】
			'--no-default-browser-check',

			// 启动时自动打开的网页
			'-url', 'https://auction.artron.net/'
		],

		// 缺省的启动参数都在 node_modules\puppeteer\lib\cjs\puppeteer\node\Launcher.js 里面
		ignoreDefaultArgs: [
			// 去掉启动时显示的【Chrome 正受到自动测试软件的控制。】
			'--enable-automation',

			// 去掉启动时显示的【您使用的是不受支持的命令行标记...】
			'--enable-blink-features=IdleDetection',
		],
	});

	// 对已经打开的页签进行拦截处理
	let targets = await browser.targets();
	targets.forEach(onTargetCreated);

	// 对将来打开的页签进行拦截处理
	browser.on('targetcreated', onTargetCreated);
})();

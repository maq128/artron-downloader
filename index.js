const puppeteer = require('puppeteer');
const process = require('process');

(async () => {
	let injectFuncTemplate = `
(function() {
	var artCode = '<<artCode>>';
	var body = document.body;

	var bigpic = document.querySelector('#ad-bigpic');
	if (bigpic) return;

	var btn = document.querySelector('#ad-btn');
	if (btn) return;

	document.oncontextmenu = null;
	btn = document.createElement('button');
	body.appendChild(btn);
	btn.id = 'ad-btn';
	btn.style.position = 'absolute';
	btn.style.right = '0.5em';
	btn.style.top = '0.5em';
	btn.style.cursor = 'pointer';
	btn.innerText = '下载完整高清大图';
	btn.addEventListener('click', function() {
		var loadImages = function(artCode, data) {
			$(document.body).empty();
			bigpic = $('<div></div>').appendTo($(document.body));
			bigpic.attr('id', 'ad-bigpic').css({
				width: data.w,
				height: data.h,
				position: 'relative',
			});

			var tasks = [];
			for (var j=0; j * 256 < data.h; j++) {
				for (var i=0; i * 256 < data.w; i++) {
					tasks.push(new Promise(function(resolve, reject) {
						$('<img/>')
							.appendTo(bigpic)
							.attr('src', 'https://hd-images.artron.net/auction/images/' + artCode + '/12/' + i + '_' + j + '.jpg')
							.css({
								position: 'absolute',
								left: i * 256,
								top: j * 256,
							})
							.on('load', resolve)
							.on('error', reject);
					}));
				}
			}
			Promise.all(tasks).then(function() {
				// 通知 puppeteer
				console.log('下载完成');
			}).catch(function() {
				alert('出错了！无法下载大图的某些局部内容。')
			});
		};

		// 获取大图信息
		$.ajax({
			url: 'https://hd-images.artron.net/auction/getImageOption',
			dataType: "jsonp",
			jsonp: "callback",
			data: {artCode: artCode},
			success: function(resp) {
				if (!resp.data) {
					alert('出错了！无法获得大图信息。')
					return;
				}
				// 加载所有碎片
				loadImages(artCode, resp.data);
			}
		});
	});
})()`;

	let crackPage = async function(target) {
		// 只关注【精览高清大图】页面，并从中提取出 artCode
		if (target.type() != 'page') return;
		let url = target.url();
		let m = url.match(/https\:\/\/auction\.artron\.net\/showbigpic-(.*)\//);
		if (!m || m.length != 2) return;
		let artCode = m[1];
		let page = await target.page();

		// 页面加载完成时在其中注入一个操作按钮
		page.on('load', async function() {
			await page.$eval('body', injectFuncTemplate.replace('<<artCode>>', artCode));
		});

		// 通过监控 console 来接收页面发出的 "下载完成" 通知
		page.on('console', async function(msg) {
			if (msg.text() == '下载完成') {
				// 获取 title 并剔除作为文件名可能包含的非法字符  \/:*?"<>|
				let title = await page.title();
				let filename = title.replace(/[\\\/\:\*\?\"\<\>\|]/g, '') + '.png';
				let bigpic = await page.$('#ad-bigpic');

				// 截图并保存
				await bigpic.screenshot({path: filename});
				console.log('下载完成: ' + filename);

				// 在网页内弹框提示
				await page.$eval('body', `alert('下载完成！\\n\\n` + filename + `')`);
			}
		});
	};

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
	browser.on('targetcreated', crackPage);
	browser.on('targetchanged', crackPage);

	// await browser.disconnect();
})();
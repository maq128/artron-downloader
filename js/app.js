const puppeteer = require('D:\\snapshot\\artron-downloader\\node_modules\\puppeteer');
// const puppeteer = require('puppeteer');
const process = require('process');

// 网页中加载的 jQuery 版本为 1.6
let injectFunction = `
async function injectFunction() {
	if ($('.ad-inject').length > 0) return;

	$('<button></button>').appendTo($('.imgShow'))
		.addClass('ad-inject')
		.css({
			position: 'absolute',
			left: 530,
			top: '-2em',
			cursor: 'pointer',
		})
		.text('打开半高清大图')
		.click(() => {
			window.open($('#smallPic').attr('src'));
		});

	// 不支持【精览高清大图】
	if ($('.enterHD').length == 0) return;

	$('<button></button>').appendTo($('.imgShow'))
		.addClass('ad-inject')
		.css({
			position: 'absolute',
			left: 400,
			top: '-2em',
			cursor: 'pointer',
		})
		.text('下载完整高清大图')
		.click(() => {
			var loadImages = function(data) {
				$(document.body).empty();
				var bigpic = $('<div></div>').appendTo($(document.body))
					.addClass('ad-inject ad-bigpic')
					.css({
						width: data.w,
						height: data.h,
						position: 'relative',
					});

				var tasks = [];
				for (var j=0; j * 256 < data.h; j++) {
					for (var i=0; i * 256 < data.w; i++) {
						tasks.push(new Promise(function(resolve, reject) {
							$('<img/>').appendTo(bigpic)
								.attr('src', 'https://hd-images.artron.net/auction/images/' + ArtWorkId + '/12/' + i + '_' + j + '.jpg')
								.css({
									position: 'absolute',
									left: i * 256,
									top: j * 256,
								})
								.load(resolve)
								.error(reject);
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
				data: {artCode: ArtWorkId},
				success: function(resp) {
					if (!resp.data) {
						alert('出错了！无法获得大图信息。')
						return;
					}
					// 加载所有碎片
					loadImages(resp.data);
				}
			});
		});
}
setTimeout(injectFunction, 0);
`;

async function crackPage(target) {
	// 只关注【查看详情】页面
	if (target.type() != 'page') return;
	let url = target.url();
	let m = url.match(/https\:\/\/auction\.artron\.net\/paimai-(.*)\//);
	if (!m || m.length != 2) return;
	let page = await target.page();

	// 页面加载完成时在其中注入一段代码
	page.on('load', async function() {
		await page.$eval('body', injectFunction);
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
			let bigpic = await page.$('.ad-bigpic');

			// 截图并保存
			await bigpic.screenshot({path: filename});
			console.log('下载完成: ' + filename);

			// 在网页内弹框提示
			await page.$eval('body', `alert('下载完成！\\n\\n` + filename + `')`);
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
	browser.on('targetcreated', crackPage);
	browser.on('targetchanged', crackPage);

	// await browser.disconnect();
})();

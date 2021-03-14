const puppeteer = require('puppeteer');

(async () => {
	let injectFuncTemplate = `
(function() {
	var artCode = '<<artCode>>';
	var body = document.body;

	var bigpic = document.querySelector('#ad-bigpic');
	if (bigpic) {
		return 'bigpic';
	}

	var btn = document.querySelector('#ad-btn');
	if (!btn) {
		btn = document.createElement('button');
		btn.id = 'ad-btn';
		btn.style.position = 'absolute';
		btn.style.right = '0.5em';
		btn.style.top = '0.5em';
		btn.style.cursor = 'pointer';
		btn.innerText = '下载完整高清大图';
		body.appendChild(btn);
		btn.addEventListener('click', function() {
			var loadImages = function(artCode, data) {
				document.oncontextmenu = null;
				$(document.body).empty();
				var container = $('<div></div>').appendTo($(document.body));
				container.attr('id', 'ad-bigpic').css({
					width: data.w,
					height: data.h,
					position: 'relative',
				});

				var tasks = [];
				for (var j=0; j * 256 < data.h; j++) {
					for (var i=0; i * 256 < data.w; i++) {
						tasks.push(new Promise(function(resolve, reject) {
							$('<img/>')
								.appendTo(container)
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
		return 'btn';
	}
	return 'none';
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

		// 通过监控 console 来接收页面发出的“下载完成”通知
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

	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		userDataDir: 'UserData',
		executablePath: 'chromium\\chrome.exe',
		ignoreDefaultArgs: ['--enable-automation'],
	});
	browser.on('targetcreated', crackPage);
	browser.on('targetchanged', crackPage);

	const page = await browser.newPage();
	await page.goto('https://auction.artron.net/');

	// await browser.disconnect();
})();
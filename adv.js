// 相比于 index.js，这个 adv.js 增强了一个功能。
// 在【精览高清大图】页面的 js 代码里有一个 imageData 变量，可以据此列示出相关的作品。
//
// imageData: [{
//	ArtCode: "art5182320149"
//	FileName: "art5182320149.jpg"
//	Folder: "https://img1.artron.net/auction/2021/art518232/d/"
// }, {...}]
//
// POST https://auction.artron.net/ajaxdata/getartinfo.php
// content-type: application/x-www-form-urlencoded; charset=UTF-8
// ArtCode=art5182320179
//	 {
//	 	"balance": "",
//	 	"worksName": "陆恢 1914年作 山楼香雪 立轴",
//	 	"lot": "0179",
//	 	"author": [
//	 	{
//	 		"Name": "陆恢"
//	 	}
//	 	],
//	 	"size": "124.0×49.2cm",
//	 	"estimateprice": "JPY 　80,000-240,000",
//	 	"classname": "中国书画>绘画",
//	 	"creatdate": "1914年作",
//	 	"filefoler": null,
//	 	"filename": "art5182320179.jpg",
//	 	"present": "",
//	 	"expireDate": "2023-03-01",
//	 	"cansee": true,
//	 	"status": 1
//	 }

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

	btn = document.createElement('button');
	body.appendChild(btn);
	btn.style.position = 'absolute';
	btn.style.right = '0.5em';
	btn.style.top = '2.5em';
	btn.style.cursor = 'pointer';
	btn.innerText = '浏览相关作品';
	btn.addEventListener('click', function() {
		$(document.body).empty();
		var browse = $('<div></div>').appendTo($(document.body))
			.attr('id', 'ad-bigpic')
			.css({position: 'relative'})
			.on('click', '.ad-frame', function(evt) {
				var url = $(evt.currentTarget).attr('data-url');
				window.open(url);
			})
			.on('mouseenter', '.ad-frame', function(evt) {
				var info = $(evt.currentTarget).children('.info').show();
				if (info.length > 0) return;
				var artCode = $(evt.currentTarget).attr('data-code');
				info = $('<div></div>').appendTo($(evt.currentTarget))
					.addClass('info')
					.css({
						position: 'absolute',
						left: 0,
						top: 0,
						width: 200,
						fontSize: '10pt',
						textAlign: 'left',
						lineHeight: '1.3em',
						backgroundColor: 'rgba(0,0,0,0.6)',
					})
					.text('...');
				$.post('/ajaxdata/getartinfo.php', {ArtCode:artCode}, data => {
					info.empty();
					data.worksName     && $('<p></p>').text(data.worksName).appendTo(info);
					data.size          && $('<p></p>').text(data.size).appendTo(info);
					data.estimateprice && $('<p></p>').text(data.estimateprice).appendTo(info);
					data.creatdate     && $('<p></p>').text(data.creatdate).appendTo(info);
				}, 'json');
			})
			.on('mouseleave', '.ad-frame', function(evt) {
				$(evt.currentTarget).children('.info').hide();
			});

		imageData.forEach(d => {
			var imageUrl = d.Folder + d.FileName;
			var frame = $('<div></div>').appendTo(browse)
				.addClass('ad-frame')
				.css({
					float: 'left',
					position: 'relative',
					width: 200,
					height: 200,
					textAlign: 'center',
					border: '1px solid gray',
					margin: 1,
					cursor: 'pointer',
				})
				.attr('data-url', imageUrl)
				.attr('data-code', d.ArtCode);

			$('<span></span>').appendTo(frame)
				.css({
					display: 'inline-block',
					height: '100%',
					verticalAlign: 'middle',
				});

			$('<img>').appendTo(frame)
				.attr('src', imageUrl)
				.css({
					maxWidth: 200,
					maxHeight: 200,
					verticalAlign: 'middle',
				});
		});
		$('<div></div>').appendTo(browse).css({clear: 'both'});
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
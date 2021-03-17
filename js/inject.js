// 本程序将注入到【拍品详情】页面中执行，
// 该页面中引入的 jQuery 版本为 1.6，需注意 API 的使用。

function injectButtons() {
	// 注入【下载完整高清大图】功能按钮
	var btn = $('<button></button>').appendTo($('.imgShow'))
		.css({
			position: 'absolute',
			left: 400,
			top: '-2em',
			cursor: 'pointer',
		})
		.text('下载完整高清大图');

	var href = $('.enterHD').attr('href');
	if (href && href.indexOf('showbigpic') >= 0) {
		// 该拍品有高清大图
		btn.click(onButtonBigpic);
	} else {
		// 该拍品没有高清大图，或者当前没有登录
		btn.attr('disabled', 'true');
	}

	// 注入【打开半高清大图】功能按钮
	$('<button></button>').appendTo($('.imgShow'))
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
}
setTimeout(injectButtons, 0);

function onButtonBigpic() {
	// 获取大图信息
	$.ajax({
		url: 'https://hd-images.artron.net/auction/getImageOption',
		dataType: "jsonp",
		jsonp: "callback",
		data: {artCode: ArtWorkId},
		success: function(resp) {
			if (resp.code != 0) {
				alert(resp.msg);
				return;
			}
			// 加载所有碎片
			loadBigpic(resp.data);
		}
	});
}

function loadBigpic(data) {
	$(document.body).empty();
	var bigpic = $('<div></div>').appendTo($(document.body))
		.addClass('ad-bigpic')
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
}

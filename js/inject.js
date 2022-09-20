// 本程序将注入到【拍品详情】页面中执行，

function injectButtons() {
	// 注入【下载完整高清大图】功能按钮
	var btn = document.createElement('button')
	document.querySelector('.productTips').appendChild(btn)
	btn.innerText = '下载完整高清大图'
	if (document.querySelector('.vipDt') == null) {
		// 该拍品没有高清大图，或者当前没有登录
		btn.setAttribute('disabled', true)
	} else {
		// 该拍品有高清大图
		btn.addEventListener('click', onButtonBigpic)
	}

	// 注入【打开半高清大图】功能按钮
	var btn = document.createElement('button')
	document.querySelector('.productTips').appendChild(btn)
	btn.innerText = '打开半高清大图'
	btn.addEventListener('click', () => {
		var smallPic = document.querySelector('#smallPic').src
		window.open(smallPic)
	})
}
setTimeout(injectButtons, 0)

function onButtonBigpic() {
	// 提取出展品标识
	let m = window.location.href.match(/https\:\/\/auction\.artron\.net\/paimai-([0-9a-zA-Z]+)\/?/)
	if (!m || m.length != 2) return
	window.ArtWorkId = m[1]

	// 获取大图信息
	fetchJsonp(`https://hdimages.artron.net/auction/getImageOption?artCode=${ArtWorkId}`)
	.then(resp => {
		if (!resp.ok) {
			alert('网站已改版，本程序需重制。')
			return
		}
		return resp.json()
	})
	.then(json => {
		if (json.code != 0) {
			alert(json.msg)
			return
		}
		// 加载所有碎片
		loadBigpic(json.data)
	})
	.catch(() => {
		alert('网站已改版，本程序需重制。')
	})
}

function loadBigpic(data) {
	// 页面卷滚条复位到初始位置，否则有可能导致最终得到的图片缺失部分内容
	window.scrollTo(0,0)

	// 清空页面，再用碎片拼出高清大图
	document.body.innerHTML = ''
	var bigpic = document.createElement('div')
	document.body.appendChild(bigpic)
	bigpic.classList.add('ad-bigpic')
	bigpic.style.position = 'relative'
	bigpic.style.width = data.w + 'px'
	bigpic.style.height = data.h + 'px'

	var tasks = []
	for (var j=0; j * 256 < data.h; j++) {
		for (var i=0; i * 256 < data.w; i++) {
			tasks.push(new Promise(function(resolve, reject) {
				var img = document.createElement('img')
				bigpic.appendChild(img)
				img.setAttribute('src', 'https://hdimages.artron.net/auction/images/' + ArtWorkId + '/12/' + i + '_' + j + '.jpg')
				img.style.position = 'absolute'
				img.style.left = i * 256 + 'px'
				img.style.top = j * 256 + 'px'
				img.addEventListener('load', resolve)
				img.addEventListener('error', reject)
			}))
		}
	}
	Promise.all(tasks).then(function() {
		// 通知 puppeteer
		console.log('下载完成')
	}).catch(function() {
		alert('出错了！无法下载大图的某些局部内容。')
	})
}

//---- https://github.com/camsong/fetch-jsonp

const defaultOptions = {
	timeout: 5000,
	jsonpCallback: 'callback',
	jsonpCallbackFunction: null,
};

function generateCallbackFunction() {
	return `jsonp_${Date.now()}_${Math.ceil(Math.random() * 100000)}`;
}

function clearFunction(functionName) {
	// IE8 throws an exception when you try to delete a property on window
	// http://stackoverflow.com/a/1824228/751089
	try {
		delete window[functionName];
	} catch (e) {
		window[functionName] = undefined;
	}
}

function removeScript(scriptId) {
	const script = document.getElementById(scriptId);
	if (script) {
		document.getElementsByTagName('head')[0].removeChild(script);
	}
}

function fetchJsonp(_url, options = {}) {
	// to avoid param reassign
	let url = _url;
	const timeout = options.timeout || defaultOptions.timeout;
	const jsonpCallback = options.jsonpCallback || defaultOptions.jsonpCallback;

	let timeoutId;

	return new Promise((resolve, reject) => {
		const callbackFunction = options.jsonpCallbackFunction || generateCallbackFunction();
		const scriptId = `${jsonpCallback}_${callbackFunction}`;

		window[callbackFunction] = (response) => {
			resolve({
				ok: true,
				// keep consistent with fetch API
				json: () => Promise.resolve(response),
			});

			if (timeoutId) clearTimeout(timeoutId);

			removeScript(scriptId);

			clearFunction(callbackFunction);
		};

		// Check if the user set their own params, and if not add a ? to start a list of params
		url += (url.indexOf('?') === -1) ? '?' : '&';

		const jsonpScript = document.createElement('script');
		jsonpScript.setAttribute('src', `${url}${jsonpCallback}=${callbackFunction}`);
		if (options.charset) {
			jsonpScript.setAttribute('charset', options.charset);
		}
		if (options.nonce) {
			jsonpScript.setAttribute('nonce', options.nonce);
		}
		if (options.referrerPolicy) {
			jsonpScript.setAttribute('referrerPolicy', options.referrerPolicy);
		}
		jsonpScript.id = scriptId;
		document.getElementsByTagName('head')[0].appendChild(jsonpScript);

		timeoutId = setTimeout(() => {
			reject(new Error(`JSONP request to ${_url} timed out`));

			clearFunction(callbackFunction);
			removeScript(scriptId);
			window[callbackFunction] = () => {
				clearFunction(callbackFunction);
			};
		}, timeout);

		// Caught if got 404/500
		jsonpScript.onerror = () => {
			reject(new Error(`JSONP request to ${_url} failed`));

			clearFunction(callbackFunction);
			removeScript(scriptId);
			if (timeoutId) clearTimeout(timeoutId);
		};
	});
}

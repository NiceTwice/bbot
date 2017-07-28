	function getIdx(numbers, search){
		for (var i = 0; i < numbers.length; i++){
			if (numbers[i] == search)
				return i;
		}
		return -1;
	}
	function correctRecognition(ch){
		if (ch == 'O')
			return '0';
		else if (ch == 'Z')
			return '2';
		else if (ch == '’' || ch == "'")
			return '1';
		return ch;
	}
	function resolveExistingCaptcha(captchaContentSelector){
		var tmp = [
			{selector: $(captchaContentSelector +' > div > div').eq(1).find('div').eq(0)},
			{selector: $(captchaContentSelector +' > div > div').eq(1).find('div').eq(1)},
			{selector: $(captchaContentSelector +' > div > div').eq(1).find('div').eq(2)},
			{selector: $(captchaContentSelector +' > div > div').eq(1).find('div').eq(3)},
			{selector: $(captchaContentSelector +' > div > div').eq(1).find('div').eq(4)},
			{selector: $(captchaContentSelector +' > div > div').eq(1).find('div').eq(5)}
		];
		var tmp1 = tmp.map((item) => {
			return (item.selector.find('img').attr('src'))
		});
		var calls = [];
		var numbers = [];
		calls = tmp1.map(function(item, idx) {
			return (Tesseract.recognize(item))
		});
		var first = Promise.all(calls).then(result => {
			numbers = result.map(function (item) {
				return (correctRecognition(item.words[0].text[0]))
			});
			console.log('recognizing buttons done ! Buttons are : ', numbers);
		});

		var srcs = [];
		var toFill = [];
		var select = $(captchaContentSelector +' > div > div').eq(0).find('div').eq(0).find('div').eq(0).find('div').each(function(idx, val){
			srcs.push($(val).find('img').attr('src'));
		});
		var calls1 = srcs.map(function(item){
			return (Tesseract.recognize(item));
		});
		var second = Promise.all(calls1).then(result => {
			toFill = result.map(function(item){
				return (correctRecognition(item.words[0].text[0]))
			});
			console.log('recognizing numbers done ! Numbers are :', toFill);
		});

		console.log('Start recognition. please wait...');
		return Promise.all([first, second]).then(r => {
			console.log('Got needed information :)');
			toFill.map(function(item){
				const idx = getIdx(numbers, item);
				tmp[idx].selector.click();
			});
		});
	}

	/* parameters are element selector strings */
	function resolveCaptcha(initialButton, captchaContent, callback){
		$(initialButton).click();
		$(captchaContent + ' > div').waitUntilExists(() => {
			resolveExistingCaptcha(captchaContent).then(() => {
				callback();
			});
		});
	}

	function getFaucet(){
		$('#menu-left-faucet').click();
		resolveCaptcha('#captcha-faucet-bot input', '#captcha-faucet', () => {
			$('#btn-get-faucet').click();
		});
	}

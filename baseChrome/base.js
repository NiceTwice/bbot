function getIdx(numbers, search){
	for (var i = 0; i < numbers.length; i++)
		if (numbers[i] == search)
			return i;
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
	function resolveCaptcha(initialButton, captchaContent){
		return new Promise((resolve, reject) => {
			$(initialButton).click();
			$(captchaContent + ' > div').waitUntilExists(() => {
				resolveExistingCaptcha(captchaContent).then(() => {
					resolve();
				});
			}, true);			
		})
	}


	function getFaucet(){
		return new Promise((resolve, reject) => {
			$('#menu-left-faucet').get(0).click();
			resolveCaptcha('#captcha-faucet-bot input', '#captcha-faucet').then(() => {
				if (getBalance() > 0.0){
					reject('balance is not empty');
					return;
				}
				$('#btn-get-faucet').get(0).click();
				var listener = window.setInterval(() => {
					if (getBalance() > 0.0){
						window.clearInterval(listener);
						resolve($('#balances-lg p').html());
					}
				}, 100);
			})
		});
	}

	function logMeIn(username, password){
		$('a[data-target="#modal-login"]').get(0).click();
		$('#login-username').val(username);
		$('#login-password').val(password);
		return resolveCaptcha('#captcha-login-bot input', '#captcha-login').then(() => {
			$('#btn-login').click();
		});
	}

	function fillInput(input, value){
		input.get(0).focus();
		input.get(0).value = value;
		input.change();
		input.blur();
		input.blur();
	}

	function getBalance(){
		return Number($('#balances-lg p').html());
	}

	// parameters are strings, 'max' for amount to make an all in
	function makeBet(amount, chance){
		const rollBtn = $('#btn-bet-dice');
		const balance = getBalance();

		console.log('Making bet');
		console.log('Amount : ', amount);
		console.log('Chance : ', chance);
		amount === 'max' ? $('#game-options-bet-lg .btn-max').get(0).click() : fillInput($('#amount'), amount);
		$('#editable-chance').get(0).click();
		fillInput($('#editable-chance-field'), chance);
		rollBtn.click();
		rollBtn.click();
		return new Promise((resolve, reject) => {
			var listener = window.setInterval(() => {
				if (balance != getBalance()){
					resolve({oldBalance: balance, newBalance : getBalance()});
					window.clearInterval(listener);
				}
			}, 100);
		})
	}

	function getFaucetsAndRoll(amount, chance){
		return getFaucet().then((money) => {
			return makeBet(amount, chance);
		}).catch((err) => {
			console.log(err);
			throw err;
		});
	}

	function getFaucetsAndAllIn(chance){
		return getFaucet().then((money) => {
			return makeBet(money, chance);
		}).catch((err) => {
			console.log(err);
			throw err;
		});
	}

	function logMeOut(){
		$('a[onclick="logout(); return false"]').get(0).click();
	}

	function FaucetAllInRollAndLogout(chance){
		return getFaucetsAndAllIn(chance).then(() => {
			logMeOut();
		});
	}

	//extension stuff
	$('#container').append('<div class="my-button-set"><button id="getFaucetAndRoll"><img src="https://image.flaticon.com/icons/svg/138/138281.svg"/></button><button id="logoutButton"><img src="https://image.flaticon.com/icons/svg/483/483343.svg"/></button></div>')
	$('.my-button-set #getFaucetAndRoll').click((e) => {
		getFaucetsAndAllIn('1.41');
	});
		$('.my-button-set #logoutButton').click((e) => {
		logMeOut();
	});
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
			$('#menu-left-faucet').click();
			resolveCaptcha('#captcha-faucet-bot input', '#captcha-faucet').then(() => {
				$('#btn-get-faucet').click();
				var listener = window.setInterval(() => {
					if (Number($('#balances-lg p').html()) > 0.0){
						window.clearInterval(listener);
						resolve(Number($('#balances-lg p').html()));
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
		input.focus();
		input.val(value);
		input.change();
		input.blur();
	}

	function getBalance(){
		return Number($('#balances-lg p').html());
	}

	// parameters are strings, 'max' for amount to make an all in
	function makeBet(amount, chance){
		const amountInput = $('#amount');
		const chanceInput = $('#editable-chance-field');
		const rollBtn = $('#btn-bet-dice');
		const balance = getBalance();

		amount === 'max' ? $('#game-options-bet-lg .btn-max').click() : fillInput(amountInput, amount);
		fillInput(chanceInput, chance);
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
		});
	}

	function getFaucetsAndAllIn(chance){
		return getFaucet().then((money) => {
			return makeBet(money, chance);
		});
	}

	function logMeOut(){
		$('a[onclick="logout(); return false"]').click();
	}

	function FaucetAllInRollAndLogout(chance){
		return getFaucetsAndAllIn(chance).then(() => {
			logMeOut();
		});
	}
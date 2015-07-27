function extractData(cont) {
	var re1 = new RegExp('data\\.push\\(([\\S\\s]*?)\\);\\s*data\\.push\\(([\\S\\s]*?)\\);', 'm');
	return re1.test(cont) ? [RegExp.$1, RegExp.$2] : undefined;
}

function extractScale(cont) {
	var re2 = new RegExp('yaxis: { min: (\\d+), max: (\\d+),');
	return re2.test(cont) ? [RegExp.$1, RegExp.$2] : undefined;
}

function getAccountData(id) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'http://' + window.location.host + '/profile/' + id, false);
	xhr.send(null);
	if (xhr.status == 200) {
		return [extractData(xhr.responseText), extractScale(xhr.responseText)];
	}
	return undefined;
}

function updateGraph(input)
{
	if (input == null) return;
	var handle = window.location.href.match(/[^/]*$/);
	input = handle + ' ' + input;
	var accounts = input.split(' ');
	var check = {};
	data = new Array();
	datas = [];
	var mymin = 900, mymax = 2000;
	var idx = 0;
	for(var i = 0; i < accounts.length; ++i) {
		if(accounts[i] != '' && check[accounts[i]] == undefined) {
			check[accounts[i]] = 1;
			var d = getAccountData(accounts[i]);
			if(d != undefined && d[0] != undefined) {
				data.push(eval(d[0][0]));
				data.push(eval(d[0][1]));
				datas[2*idx] = { label: accounts[i], data: data[2*idx] };
				datas[2*idx+1] = { clickable: false, hoverable: false, color: "red", data: data[2*idx+1] };
				++idx;
				if(d[1] != undefined) {
					if(d[1][0] < mymin) mymin = d[1][0];
					if(d[1][1] > mymax) mymax = d[1][1];
				}
			} else {
				alert("Can't get information for account: " + accounts[i] + ".");
			}
		}
	}
	if(idx == 1) {
		options.legend.position = "ne";
	} else {
		options.legend.position = "se";
	}
	options.yaxis.min = mymin;
	options.yaxis.max = mymax;
	plot = $.plot($("#placeholder"), datas, options);
	$("#placeholder .legend").unbind("click");
	$("#placeholder .legend").bind("click", accountManage);
}

function accountManage()
{
	var handle = window.location.href.match(/[^/]*$/);
	var dialog = $('<div id="account-dialog"/>').css({
		position:'fixed',padding:'5px',width:'30em',zIndex:2000,left:'50%',top:'50%',marginTop:'-3.5em',marginLeft:'-15em',
		border:'1px solid', borderRadius:'5px',background:'rgb(255,255,255)',boxShadow:'rgb(64,64,64) 5px 5px 5px'
	}).html(
		'<p>Input space-separated accounts without this account.</p>' +
		'<form id="account-form"><p><input type="text" id="accounts" size="40" value="'+(handle !=  login_account ? login_account : '')+'"></p>' +
		'<p><input type="submit" id="ok" value="OK"> <input type="button" id="cancel" value="cancel"></p></form>'
	);
	$('p', dialog).css({margin:'1em'});
	$('#cancel', dialog).click(function() {
		$('#account-dialog').remove();
		$('#account-dialog-blocker').remove();
	});
	$('#account-form', dialog).submit(function() {
		var input = $('#accounts').val();
		$('#account-dialog').remove();
		$('#account-dialog-blocker').remove();
		updateGraph(input);
		return false;
	}).keydown(function(e) {
		if(e.keyCode == 27) {
			$('#cancel').click();
		}
	});
	var blocker = $('<div id="account-dialog-blocker"/>').css({
		position:'fixed',top:0,left:0,bottom:0,right:0,width:'100%',height:'100%',zIndex:15,
		background:'rgb(64,64,64)',opacity:0.75
	});
	$('body').append(blocker);
	$('body').append(dialog);
	$('#accounts').autocomplete("/data/handles", {
		delay: 200,
		width: 200,
		selectFirst: false,
		matchContains: true,
		multiple: true,
		multipleSeparator: ' ',
		minChars: 3,
		scroll: true,
	});
	$('#accounts').focus();
}

function addUnbind(cont)
{
	var marker = '$("#placeholder").bind("plothover"';
	return cont.replace(marker, '$("#placeholder").unbind("plothover");\n' + marker);
}

function getLoginAccount()
{
	var e = document.getElementById('header');
	var re3 = new RegExp('<a href="/profile/([^"]*)">[^<]*</a>[^<]*<a href="[^"]*/logout">');
	return re3.test(e.innerHTML) ? RegExp.$1 : undefined;
}

function disableDefaultPlot(cont)
{
	return cont.replace('var plot = $.plot($("#placeholder"), datas, options);', '').replace('var ctx = plot.getCanvas().getContext("2d");', '');
}

function addAccountManage(cont)
{
	var marker = 'var prev = -1;';
	var target = '';
	target += 'var extractData = ' + extractData + ';\n';
	target += 'var extractScale = ' + extractScale + ';\n';
	target += 'var getAccountData = ' + getAccountData + ';\n';
	var login_account = getLoginAccount();
	if(login_account != undefined) {
		target += 'var login_account = "' + getLoginAccount() + '";\n';
	} else {
		target += 'var login_account = "";\n';
	}
	target += 'options.legend = {};\n';
	target += 'var accountManage;\n';
	target += 'var updateGraph = ' + updateGraph + ';\n';
	target += 'accountManage = ' + accountManage + ';\n';
	target += 'updateGraph(login_account);\n';
	target += '$("#placeholder .legend").unbind("click");\n';
	target += '$("#placeholder .legend").bind("click", accountManage);\n';
// CAUTION FRAGILE: monkey patch for Autocompleter to handle multiple words correctly
	target += '$(function() {\n';
	target += 'var old = $.Autocompleter;\n';
	target += 'eval("$.Autocompleter = " + (""+$.Autocompleter).replace("currentValue == q", "lastWord(currentValue) == q"));\n';
	target += '$.Autocompleter.defaults = old.defaults;$.Autocompleter.Cache = old.Cache;$.Autocompleter.Select = old.Select;\n';
	target += '});\n';

	return cont.replace(marker, target + marker);
}

function getTargetScript()
{
	var e = document.getElementById('pageContent').getElementsByTagName('script');
	for(var i = 0; i < e.length; ++i) {
		if(e[i].textContent.match(/data\.push/) != null) {
			return e[i];
		}
	}
}

function runScript() {
	script = document.createElement('script');
	script.setAttribute("type", "application/javascript");
	script.textContent = disableDefaultPlot(addAccountManage(addUnbind(getTargetScript().textContent)));

	document.body.appendChild(script);
	document.body.removeChild(script);
}

getOption("multiGraph", function(option, result) {
	if (result) {
		runScript();
	}
});

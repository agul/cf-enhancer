var elements = document.getElementsByTagName("input");

for (var i = 0; i < elements.length; ++i) {
	var curElement = elements[i];
	if (curElement.type != "checkbox") {
		continue;
	}
	getOption(curElement.id, function (option, value) {
		document.getElementById(option).checked = value;
	});
	curElement.addEventListener("change", function() {
		setOption(this.id, this.checked);
	});
}
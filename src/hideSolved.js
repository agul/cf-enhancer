var toggleLink = document.createElement("a");

function toggle() {
	var items = document.getElementsByClassName("accepted-problem");
	if (items.length == 0) {
		return false;
	}
	var show = (items[0].style.display == "none");
	for (var i = 0; i < items.length; ++i) {
		items[i].style.display = (show ? "table-row" : "none");
	}
	toggleLink.innerHTML = (show ? "Hide" : "Show") + " solved problems";
};

function runScript() {
	toggleLink.innerHTML = "Hide solved problems";
	toggleLink.href = "#";
	toggleLink.addEventListener("click", toggle, false, true);

	var searchBlock = document.getElementsByClassName("closed")[0];
	searchBlock.parentNode.insertBefore(toggleLink, searchBlock);
}

getOption("hideSolved", function(option, result) {
	if (result) {
		runScript();
	}
});
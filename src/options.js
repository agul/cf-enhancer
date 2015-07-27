function setOption(option, value) {
  console.log(option + " " + value);
  var values = new Object();
  values[option] = value;
  chrome.storage.local.set(values);
}

function getOption(option, callback) {
  chrome.storage.local.get(option, function(result){
    var value = result[option];
    if (value == null) {
      setOption(option, true);
      value = true;
    }
    callback(option, value);
  });
}
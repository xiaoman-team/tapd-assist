var key = process.argv[2];
var file = process.argv[3];

let retrieveJSON = function (json, key) {
  var keys = key.split('.');
  var value = json;
  for (var i in keys) {
    var key = keys[i];
    value = value[key];
    if (value === undefined) {
      process.exit(1);
    }
  }
  return value;
}

if (key) {
  if (file) {
    var json = require(file);
    var value = retrieveJSON(json, key);
    console.log(value);
  } else {
    var json = '';
    process.stdin.on('data', function(buf) {
      json += buf.toString();
    });
    process.stdin.on('end', function() {
      json = JSON.parse(json);
      var value = retrieveJSON(json, key);
      console.log(value);
    });
  }
}

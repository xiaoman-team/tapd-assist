
// (function () {

var port = null;

var proxyHost = "com.tpad.tapdassist";

var domain = ".tapd.cn";

var skeyCookieName = 'pskey';

var curPskey = null;

var logmessage ="";


function updateIcon(status)
{
	var title = "disabled",
		image = "main_icon_off_16.png";

	if (status == 1)
	{
		title = "enabled";
		image = "main_icon_on_16.png";
	}
	else if (status == 2)
	{
		title = 'disabled';
		image = "main_icon_off_16.png";
	}

	console.log(status);

	// Update title

	chrome.browserAction.setTitle({
		// tabId: tabId,
		title: title
	});

	// Update image
	chrome.browserAction.setIcon({
		// tabId: tabId,
		path: image
	});
}


function getStatus(){
	var result =2;
	if(port == null){
		result =  2;
	}else{
		result = 1;
	}

	return result;
}

var cookieCallbock = function(cookies){
		if(cookies.length >0){
		  console.log(cookies.length);
		  pskey = cookies[0].value;
		  sendPskey(pskey);
		}
	}

function connect() {
  if(port ==null){
	console.log("Connecting to native messaging host <b>" + proxyHost + "</b>");
  	port = chrome.runtime.connectNative(proxyHost);
  	port.onMessage.addListener(onReceiveMessage);
  	port.onDisconnect.addListener(onDisconnected);

  	updateIcon(1);

  	chrome.cookies.getAll({domain:domain,path:'/',name:skeyCookieName}, cookieCallbock );
  }


}


function onReceiveMessage(message) {
	if(message.header.cmd =="LOG_PUSH"){
		var logs = message.body.logs;
		for (var i = logs.length - 1; i >= 0; i--) {
			console.log(logs[i]);
		}
	}

	logmessage = JSON.stringify(logs);
}

function onDisconnected() {
  console.log('Failed to connect: '+chrome.runtime.lastError.message);
  port = null;
  curPskey =null;
}

function sendPskey(pskey){

	if(curPskey == pskey){
		return ;
	}

	message = {
    	"header":{
        	"version": "1.0",
        	"magicString": "6C8F12A4",
        	"cmd": "UPDATE_PSKEY_REQ",
        	"seq": 0,
        	"code": 0,
			},
    	"body":{
    		"pskey": pskey
		},
	}
  	port.postMessage(message);
  	console.log('send: '+pskey);
  	curPskey = pskey;
}


chrome.cookies.onChanged.addListener(function(changeInfo) {
	if(!changeInfo.removed &&changeInfo.cookie.name==skeyCookieName && changeInfo.cookie.domain==domain){
		var pskey = changeInfo.cookie.value;
		console.log(pskey);
		sendPskey(pskey);
	}
});


chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  if (change.status == "complete") {

  	if(tab.url.indexOf(domain) != -1){
  		console.log(tab.url);
  		connect();
	}
  }
});
 
// chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {
//   chrome.tabs.get(tabId, function(tab){
//       connect(tab);
//   })
// });

chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");

    console.log(request);

    var cmd = request.header.cmd;

    if( cmd =='getStatus'){

			var status = getStatus();
		    message = {
    		"header":{
        		"version": "1.0",
        		"magicString": "6C8F12A4",
        		"cmd": cmd,
        		"seq": 0,
        		"code": 0,
			},
    		"body":{
    			"status" : status
			}
		}
	}else if(cmd == 'run_app'){
		connect();
		var status = getStatus();
		message = {
    		"header":{
        		"version": "1.0",
        		"magicString": "6C8F12A4",
        		"cmd": cmd,
        		"seq": 0,
        		"code": 0,
			},
    		"body":{
    			"status" : status
			}
		}
	}

	console.log(message);

    sendResponse(message);
  });

chrome.extension.onConnect.addListener(function(port) {
  console.assert(port.name == "knockknock");
  port.onMessage.addListener(function(msg) {
  	if(logmessage){
  		port.postMessage({question: logmessage});

  	}
  });
});



// }()) ;




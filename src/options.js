$(function() {
	var key = "tapd_ext";

	chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }, function(tabs)
	{
		message = {
    		"header":{
        		"version": "1.0",
        		"magicString": "6C8F12A4",
        		"cmd": "getStatus",
        		"seq": 0,
        		"code": 0,
			},
    		"body":{
    			"key" : key
			},
		}

		chrome.extension.sendRequest(
				message,
				function(response)
				{
					// Highlight the correct option
					console.log(response);
					if(response.body.status==1){
						console.log(111);
						$('#connect-button').hide();
					}else{
						console.log(111);
					}

					$("#connect-button").data("status",response.body.status);

				}
			);
	});

	$("#connect-button").on("click", function(eventObject) {
		var status = $(this).data("status");


		if(status ==2){
			message = {
    			"header":{
        			"version": "1.0",
        			"magicString": "6C8F12A4",
        			"cmd": "run_app",
        			"seq": 0,
        			"code": 0,
				},
    			"body":{
    				"key" : key
				},
			}

			chrome.extension.sendRequest(
				message,
				function(response)
				{
					console.log(response);
					if(response.body.status==1){
						$('#connect-button').hide();
					}else{
						$('#connect-button').show();

					}

					$("#connect-button").data("status",response.body.status);

				}
			);

		}

	});

	var port = chrome.extension.connect({name: "knockknock"});
    port.postMessage({joke: "Knock knock"});
    port.onMessage.addListener(function(msg) {
    	port.postMessage({answer: "Madame"});
    	console.log(msg);
	});
});

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
						$('#action_run').addClass("active");
						$('#action-run span').text("正在运行中");
					}else{
						$('#action-run span').text("请启动应用");

					}

					$('#action-run').data("status",response.body.status);

				}
			);
	});

	$("#action-run").on("click", function(eventObject) {
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
						$('#action_run').addClass("active");
						$('#action-run span').text("正在运行中");
					}else{
						$('#action-run span').text("请启动应用");

					}

					$('#action-run').attr("data-status",response.body.status);

				}
			);

		}

	});

	$("a").on("focus", function()
	{
		$(this).blur();
		$("a").off("focus");
	});
});

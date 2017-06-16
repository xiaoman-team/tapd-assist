
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
  switch (message.type) {
    case 'getTabId': {
      sendResponse({ tabId: sender.tab.id })
      break
    }
    case 'setTabIcon': {
      chrome.browserAction.setIcon({
        path: message.path,
        tabId: sender.tab.id
      })
      break
    }
    default: {
      console.log('[tapd_assist] unknown message', message.type, message)
      break
    }
  }
})

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  switch (request.cmd) {
    case 'readFile': {
      $.get(request.url, function (data) {
        sendResponse(data)
      })
      break
    }
    default: {
      console.log('[tapd_assist] unknown request', request.cmd, request)
      break
    }
  }
})

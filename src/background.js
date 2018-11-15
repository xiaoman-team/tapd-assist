
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
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

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
  switch (request.cmd) {
    case 'readFile': {
      $.get(request.url, function (data) {
        sendResponse(data)
      })
      break
    }
    case 'httpRequest': {
      let data = request.data
      $.ajax({
        type: data.type,
        url: data.url,
        data: JSON.stringify(data.data),
        dataType: data.dataType,
        contentType: data.contentType,
        success: function(response){
          sendResponse(response)
        }
      })
      break
    }
    case 'getTapdAccount': {
      getTapdAccount(function (tapdAccount) {
        sendResponse(tapdAccount)
      })
      break
    }
    case 'removeAllCookies': {
      removeAllCookies(function () {
        sendResponse(true)
      })
      break
    }
    case 'removeLoginAccount': {
      removeLoginAccount(request.uid, function () {
        sendResponse(true)
      })
      break
    }
    case 'applyLoginAccount': {
      applyLoginAccount(request.uid, function () {
        sendResponse(true)
      })
      break
    }

    default: {
      console.log('[tapd_assist] unknown request', request.cmd, request)
      break
    }
  }
})


const cookieUrl = 'https://tapd.cn/'
const cookieChangeQueue = []

function pushCookieChangeQueue (changeInfo) {
  if (cookieChangeQueue.length) {
    cookieChangeQueue.push(changeInfo)
    return
  }

  cookieChangeQueue.push(changeInfo)
  setTimeout(function () {
    processCookieChangeQueue();
  }, 1000)
}

function processCookieChangeQueue (callback) {
  let length = cookieChangeQueue.length
  if (length === 0) {
    if (callback) {
      callback();
    }
    return;
  }

  let batch = []
  for (let i = 0; i < length; i++) {
    let changeInfo = cookieChangeQueue[i]
    let index = batch.findIndex(ci => ci.cookie.name === changeInfo.cookie.name)
    if (index >= 0) {
      batch[index] = changeInfo
    } else {
      batch.push(changeInfo)
    }
  }
  let nextBatch = function () {
    cookieChangeQueue.splice(0, length)
    processCookieChangeQueue()
  }

  chrome.storage.local.get('tapdAccount', function (storage) {
    let tapdAccount = storage.tapdAccount || {}
    let accounts = tapdAccount.accounts
    if (!accounts) {
      accounts = []
      tapdAccount.accounts = accounts
    }

    chrome.cookies.get({
      url: cookieUrl,
      name: '_t_uid'
    }, function (uidCookie) {
      if (!uidCookie) {
        console.warn('cookie _t_uid not found')
        nextBatch()
        return
      }
      let uid = uidCookie.value;

      chrome.cookies.get({
        url: cookieUrl,
        name: 't_cloud_login'
      }, function (nameCookie) {
        let name = nameCookie ? unescape(nameCookie.value) : 'UNKNOWN'
        
        for (let changeInfo of batch) {
          let account = accounts.find(a => a.uid === uid)
          if (!account) {
            if (changeInfo.removed) {
              // ignore
              continue
            }
            // create new
            console.log('add login cookie', uid, changeInfo.cookie.name, changeInfo.cookie.value)
            account = {
              uid: uid,
              name: name,
              cookies: [changeInfo.cookie]
            }
            accounts.push(account)
            continue
          }
          account.name = name
          let index = account.cookies.findIndex(c => c.name === changeInfo.cookie.name)
          if (index < 0) {
            if (changeInfo.removed) {
              continue
            }
            console.log('add login cookie', uid, changeInfo.cookie.name, changeInfo.cookie.value)
            account.cookies.push(changeInfo.cookie)
            continue
          }
          if (changeInfo.removed) {
            console.log('remove login cookie', uid, changeInfo.cookie.name, changeInfo.cookie.value)
            account.cookies.splice(index, 1)
          } else {
            console.log('update login cookie', uid, changeInfo.cookie.name, changeInfo.cookie.value)
            account.cookies[index] = changeInfo.cookie
          }
        }

        accounts.sort(function (a, b) {
          if (a.uid < b.uid) {
            return -1
          }
          if (a.uid > b.uid) {
            return 1
          }
          return 0
        })

        chrome.storage.local.set({tapdAccount: tapdAccount}, function () {
          nextBatch()
        })
      })
    })
  })
}

function getTapdAccount(callback) {
  chrome.storage.local.get('tapdAccount', function (storage) {
    let tapdAccount = storage.tapdAccount || {}
    let accounts = tapdAccount.accounts
    if (!accounts) {
      accounts = []
      tapdAccount = accounts
    }
    chrome.cookies.get({
      url: cookieUrl,
      name: '_t_uid'
    }, function (uidCookie) {
      tapdAccount.currentAccount = uidCookie ? uidCookie.value : undefined
      if (callback) {
        callback(tapdAccount)
      }
    })
  })
}

function applyLoginAccount (uid, callback) {
  console.log('apply account', uid);
  removeAllCookies(function () {
    chrome.storage.local.get('tapdAccount', function (storage) {
      let tapdAccount = storage.tapdAccount || {}
      let accounts = tapdAccount.accounts
      if (!accounts) {
        accounts = []
        tapdAccount.accounts = accounts
      }

      let account = tapdAccount.accounts.find(a => a.uid === uid)
      if (!account) {
        console.warn('account not found', uid)
        if (callback) {
          callback(false)
        }
        return
      }

      let cookies = account.cookies.concat()
      let setCookie = function () {
        let cookie = cookies.pop()
        if (!cookie) {
          if (callback) {
            callback(true)
          }
          return
        }
        if (cookie.expirationDate && cookie.expirationDate * 1000 < Date.now()) {
          setCookie()
          return
        }

        let domain = cookie.domain
        if (domain.startsWith('.')) {
          domain = domain.substring(1)
        }
        let newCookie = Object.assign({
          url: 'https://' + domain,
        }, cookie)
        delete newCookie.hostOnly
        delete newCookie.session
        console.log('set cookie', newCookie)
        chrome.cookies.set(newCookie, function (resultCookie) {
          if (!resultCookie) {
            console.error('set cookie error', resultCookie, chrome.runtime.lastError);
          }
          setCookie()
        })
      }
      setCookie()
    })
  })
}

function removeLoginAccount (uid, callback) {
  let removeLoginAccountByUID = function (uid, callback) {
    chrome.storage.local.get('tapdAccount', function (storage) {
      let tapdAccount = storage.tapdAccount || {}
      let accounts = tapdAccount.accounts
      if (!accounts) {
        accounts = []
        tapdAccount.accounts = accounts
      }

      let index = tapdAccount.accounts.findIndex(a => a.uid === uid)
      if (index >= 0) {
        tapdAccount.accounts.splice(index, 1)
      }

      chrome.storage.local.set({ tapdAccount: tapdAccount }, function () {
        if (callback) {
          callback(true);
        }
      })
    })
  }
  if (uid) {
    removeLoginAccountByUID(uid, callback)
    return
  }
  chrome.cookies.get({
    url: cookieUrl,
    name: '_t_uid'
  }, function (uidCookie) {
    if (!uidCookie) {
      console.warn('cookie _t_uid not found')
      if (callback) {
        callback(false)
      }
      return
    }
    let uid = uidCookie.value
    removeLoginAccountByUID(uid, callback)
  })
}

function removeAllCookies(callback) {
  chrome.cookies.getAll({url: cookieUrl}, function (cookies) {
    let remove = function () {
      let cookie = cookies.pop()
      if (!cookie) {
        if (callback) {
          callback()
        }
        return
      }
      chrome.cookies.remove({
        url: cookieUrl,
        name: cookie.name
      }, function () {
        remove()
      })
    }
    remove()
  })
}

chrome.cookies.onChanged.addListener(function (changeInfo) {
  pushCookieChangeQueue(changeInfo)
})

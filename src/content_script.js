
let PROJECT_SHORTCUTS = tapdAssistUtils.patchProjectList()

let bodyDOMObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.target.id === 'General_div' && mutation.addedNodes.length) {
      let root = document.getElementById('description_div')
      if (root) {
        tapdAssistUtils.patchURLLink(root)
      } else {
        console.warn('[tapd_assist] #description_div not found')
      }
      tapdAssistUtils.patchProjectList()
    } else if (mutation.target.id === 'myprojects-list' && mutation.addedNodes.length) {
      tapdAssistUtils.patchProjectList()
    }
  })
})

bodyDOMObserver.observe(document.body, {
  childList: true,
  subtree: true
})

$('.comment_con_main').toArray().forEach(tapdAssistUtils.patchURLLink)

let dialog
chrome.extension.sendRequest({
  cmd: 'readFile',
  url: chrome.extension.getURL('tpls/help_panel.tpl'),
}, function (data) {
  let div = $('<div />')
  div.html(data)       
  dialog = div.find('#tapdAssistHelpPanel')
  dialog.hide()
  dialog.on('click.closeModal', '[data-dismiss="modal"]', function () {
    dialog.hide()
  })
  $('body').append(dialog)
})

let menuLock = false
let altDownAt
let leftTreeClose
const SHORTCUTS = {
  'Alt+Escape': function () {
    if (!$('body').hasClass('.left-tree-close')) {
      menuLock = true
    }
  },
  'Alt+C': '#create-project',
  'Alt+W': '#top_nav_worktable',
  'Alt+N': '#top_nav_worktable_msg',
  'Alt+M': function () {
    let projectId = tapdAssistUtils.getProjectId()
    if (!projectId) {
      tapdAssistUtils.showFlash('【小满助手】当前不是项目页面')
      return
    }

    tapdAssistUtils.showFlash('【小满助手】正在跳转团队成员...')
    window.location.href = tapdAssistUtils.getProjectUrl('/settings/team')
  },
  'Alt+R': function () {
    let projectId = tapdAssistUtils.getProjectId()
    if (!projectId) {
      tapdAssistUtils.showFlash('【小满助手】当前不是项目页面')
      return
    }

    tapdAssistUtils.showFlash('【小满助手】正在跳转需求统计报表...')
    let defaultAnchor = tapdAssistUtils.getProjectUrl('/prong/stories/stats_charts')
    tapdAssistUtils.ajax({
      url: tapdAssistUtils.getProjectUrl('/prong/stories/stats_charts')
    }).then(function (data) {
      let htmlDoc = $.parseHTML(data)
      let hrefs = $(htmlDoc)
        .find('#custom-statistics ul.custom-statistic-list li a')
        .toArray()
        .map(a => a.getAttribute('href'))
      let anchor = hrefs[0]
      if (anchor) {
        window.location.href = anchor
      } else {
        window.location.href = defaultAnchor
      }
    }, function (err) {
      window.location.href = defaultAnchor
    })
  },
  'Alt+B': function () {
    let projectId = tapdAssistUtils.getProjectId()
    if (!projectId) {
      tapdAssistUtils.showFlash('【小满助手】当前不是项目页面')
      return
    }

    tapdAssistUtils.showFlash('【小满助手】正在跳转缺陷统计报表...')
    let defaultAnchor = tapdAssistUtils.getProjectUrl('/bugtrace/bugreports/stat_general/general/systemreport-1000000000000000008')
    tapdAssistUtils.ajax({
      url: tapdAssistUtils.getProjectUrl('/bugtrace/bugreports/index_simple')
    }).then(function (data) {
      let htmlDoc = $.parseHTML(data)
      let hrefs = $(htmlDoc)
        .find('.tbox-content ul li a')
        .toArray()
        .map(a => a.getAttribute('href'))
        .filter(href => href.indexOf('/bugtrace/bugreports/stat_general/general/customreport-') >= 0)
      let anchor = hrefs[0]
      if (anchor) {
        window.location.href = anchor
      } else {
        window.location.href = defaultAnchor
      }
    }, function (err) {
      window.location.href = defaultAnchor
    })
  },
  'Alt+H|Alt+ArrowLeft': function () {
    let element = $('.page-btn.page-prev')
    let anchor = element.children('a')
    if (anchor.length) {
      element = anchor
    }
    let element1 = element[0]
    if (element1) {
      element1.click()
    }
  },
  'Alt+L|Alt+ArrowRight': function () {
    let element = $('.page-btn.page-next')
    let anchor = element.children('a')
    if (anchor.length) {
      element = anchor
    }
    let element1 = element[0]
    if (element1) {
      element1.click()
    }
  },
  'Alt+F': function (e) {
    e.preventDefault()
    $('#search-keyword').focus().select()
  },
  'Shift+Slash': function () {
    dialog.show()
  },
  'Alt': function () {
    altDownAt = Date.now()
    dialog.show()
    leftTreeClose = $('body').hasClass('left-tree-close')
    $('body').removeClass('left-tree-close')
  },
  'Alt+K': function () {
    chrome.storage.sync.get('shortcut', function (val) {
      console.log(val)
    })
  },
  'Ctrl+C|Meta+C': function (e, keys) {
    window.postMessage({
      type: "tryCopyTitle",
      data: ""
    }, "*");
  }
}

let executeShortcuts = function (shortcuts, e) {
  let fnKeys = ['alt', 'ctrl', 'meta', 'shift']
  let downFnKeys = fnKeys.filter(function (f) {
    return e[f + 'Key']
  })

  let code = e.code.toLowerCase().replace(/^(key|digit)/, '')
  let isFnKeys = ['alt', 'control', 'meta', 'shift'].some(function (f) {
    return code.startsWith(f)
  })

  let shortcutMap = {}
  for (let key in shortcuts) {
    let handler = shortcuts[key]
    let keys = key.split('|')
    keys.forEach(function (k) {
      let splits = k.toLowerCase().split('+').map(function (split) {
        return split.trim()
      }).sort().join('+')
      shortcutMap[splits] = handler
    })
  }

  let downKeys = downFnKeys
  if (!isFnKeys) {
    downKeys = downKeys.concat(code)
  }
  downKeys = downKeys.slice().sort().join('+')

  // console.log('downKeys', downKeys)

  let handler = shortcutMap[downKeys]
  if (!handler) {
    return
  }

  if (typeof handler === 'string') {
    let element = $(handler)[0]
    if (element) {
      element.click()
    } else {
      console.warn('Invalid shortcut handler: document.getElementById empty', handler)
    }
  } else if (typeof handler === 'function') {
    handler(e, downKeys)
  } else {
    console.warn('Invalid shortcut handler', typeof handler, handler)
  }
}

document.addEventListener('keydown', function (e) {
  executeShortcuts(SHORTCUTS, e)
  executeShortcuts(PROJECT_SHORTCUTS, e)
})

document.addEventListener('keyup', function (e) {
  if (e.key === 'Alt') {
    dialog.hide()

    const QUICK_CLICK_THRESHOLD = 400
    let quickAlt = altDownAt && Date.now() - altDownAt < QUICK_CLICK_THRESHOLD
    if (quickAlt) {
      $('body').toggleClass('left-tree-close minimenu', !leftTreeClose)
    } else if (menuLock) {
    } else {
      $('body').addClass('left-tree-close minimenu')
    }
  }
})

// bodyDOMObserver.disconnect()

chrome.extension.sendMessage({
  type: 'setTabIcon',
  path: {
    "16": "image/main_icon_16.png",
    "24": "image/main_icon_24.png",
    "32": "image/main_icon_32.png"
  }
})

let scripts = [
  'utils.js',
  'page_inject.js'
]
scripts.forEach(script => {
  tapdAssistUtils.injectScript(chrome.extension.getURL('/' + script))
})


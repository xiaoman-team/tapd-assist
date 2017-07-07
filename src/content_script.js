
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
      PROJECT_SHORTCUTS = tapdAssistUtils.patchProjectList()
    } else if (mutation.target.id === 'myprojects-list' && mutation.addedNodes.length) {
      PROJECT_SHORTCUTS = tapdAssistUtils.patchProjectList()
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
let altDownTimeoutId
let leftTreeClose
let clearAltDownTimeout = () => {
  if (altDownTimeoutId) {
    clearTimeout(altDownTimeoutId)
    altDownTimeoutId = undefined
  }
}
const SHORTCUTS = {
  'Alt+Escape': function () {
    if (!$('body').hasClass('.left-tree-close')) {
      menuLock = true
    }
  },
  'Alt+C': {
    target: '#create-project',
    description: '创建项目...'
  },
  'Alt+W': {
    target: '#top_nav_worktable',
    description: '正在跳转工作台...'
  },
  'Alt+N': {
    target: '#top_nav_worktable_msg',
    description: '正在跳转消息页面...'
  },
  'Alt+M': function () {
    let projectId = tapdAssistUtils.getProjectId()
    if (!projectId) {
      tapdAssistUtils.showFlash('❌ 当前不是项目页面')
      return
    }

    tapdAssistUtils.showFlash('正在跳转团队成员...')
    window.location.href = tapdAssistUtils.getProjectUrl('/settings/team')
  },
  'Alt+R': function () {
    let projectId = tapdAssistUtils.getProjectId()
    if (!projectId) {
      tapdAssistUtils.showFlash('❌ 当前不是项目页面')
      return
    }

    tapdAssistUtils.showFlash('正在跳转需求统计报表...')
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
      tapdAssistUtils.showFlash('❌ 当前不是项目页面')
      return
    }

    tapdAssistUtils.showFlash('正在跳转缺陷统计报表...')
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
      tapdAssistUtils.showFlash('⬅ 跳转到上一页️...')
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
      tapdAssistUtils.showFlash('跳转到下一页️➡ ...')
      element1.click()
    }
  },
  'Alt+F': function (e) {
    e.preventDefault()
    $('#search-keyword').focus().select()
  },
  'Shift+Slash': function () {
    let element = document.activeElement
    let isTextarea = element.tagName === 'TEXTAREA'
    let isInput = element.tagName === 'INPUT' && ['text', 'password', 'search', 'url'].indexOf(element.type) >= 0
    let isEditable = element.contentEditable === 'true'
    if (isTextarea || isInput ||isEditable) {
      return
    }
    dialog.toggle()
  },
  'Alt': function () {
    altDownAt = Date.now()
    clearAltDownTimeout()
    altDownTimeoutId = setTimeout(function () {
      clearAltDownTimeout()
      dialog.show()
    }, 1000)
    leftTreeClose = $('body').hasClass('left-tree-close')
    $('body').removeClass('left-tree-close')
    return 'alt-down'
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
    return {
      match: false
    }
  }

  if (typeof handler === 'function') {
    let result = handler(e, downKeys)
    return {
      match: true,
      result
    }
  }
  let target
  let description
  if (typeof handler === 'string') {
    target = handler
    description = undefined
  } else {
    target = handler.target
    description = handler.description
  }
  let element = $(target)[0]
  if (!element) {
    console.warn('Invalid shortcut handler: document.getElementById empty', handler)
    return {
      match: true
    }
  }
  element.click()
  if (description) {
    tapdAssistUtils.showFlash(description)
  }
  return {
    match: true,
    result: true
  }
}

document.addEventListener('keydown', function (e) {
  let result = executeShortcuts(SHORTCUTS, e)
  let projectResult = executeShortcuts(PROJECT_SHORTCUTS, e)
  if (result.match && result.result !== 'alt-down' || projectResult.match && projectResult.result !== 'alt-down') {
    clearAltDownTimeout()
  }
})

document.addEventListener('keyup', function (e) {
  if (e.key === 'Alt') {
    dialog.hide()
    clearAltDownTimeout()

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


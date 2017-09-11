tapdAssistUtils.watchFullscreen()
tapdAssistUtils.patchComments()
tapdAssistUtils.patchFullscreenEditButton()
tapdAssistUtils.patchFullscreenButton()
tapdAssistUtils.patchEditButton()

let PROJECT_SHORTCUTS = tapdAssistUtils.patchProjectList()

let bodyDOMObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.target.id === 'General_div' && mutation.addedNodes.length) {
      tapdAssistUtils.patchFullscreenButton()
      let content = $('#description_div')[0]
      if (content) {
        tapdAssistUtils.patchURLLink(content)
      } else {
        console.warn('[tapd_assist] #description_div not found')
      }
      let shortcuts = tapdAssistUtils.patchProjectList()
      if (shortcuts) {
        PROJECT_SHORTCUTS = shortcuts
      }
    } else if (mutation.target.id === 'myprojects-list' && mutation.addedNodes.length) {
      let shortcuts = tapdAssistUtils.patchProjectList()
      if (shortcuts) {
        PROJECT_SHORTCUTS = shortcuts
      }
    } else if (mutation.target.id === 'StoryDescriptionDiv' && mutation.addedNodes.length) {
      tapdAssistUtils.patchFullscreenButton()
      ensureListenDocumentKeyEvents()
    } else if (mutation.target.id === 'BugDescriptionDiv' && mutation.addedNodes.length) {
      tapdAssistUtils.patchFullscreenButton()
      ensureListenDocumentKeyEvents()
    } else if (mutation.target.id === 'member_list_content' && mutation.addedNodes.length) {
      markingLeaveMember()
    }
  })
})

bodyDOMObserver.observe(document.body, {
  childList: true,
  subtree: true
})

$('.comment_con_main').toArray().forEach(tapdAssistUtils.patchURLLink)

let loadHelpPanel = function(result, callback){
  let data = $(result)
  tapdAssistOption.getShortcuts().then(function(shortcuts){
    let titleDive = data.find('.modal-title')
    let modalDiv = $('<div />').addClass('modal-body')
    for(let key of shortcuts.keys()) {
      if(key === 'external_api' || key === 'project_list_order') continue

      let value
      let description
      if(key === 'driver' || key === 'project_driver') {
        for (let item of tapdDefaultOptions) {
          if(item.id === key) {
            for(let option of item.options) {
              if (option.value ===shortcuts.get(key)) {
                value = option.text
                description = option.description
              }
            }
          }
        }
      } else {
        value = shortcuts.get(key)
        for (let item of tapdDefaultShortcuts) {
          if(item.key === key) {
            description = item.title
          }
        }

      }

      let secDiv = $('<div />').addClass('quickhelp')
      let keySpan = $('<span />').addClass('shortcut-key')
      console.log('key: ' + key)
      console.log('value: ' + value)
      let kbd = $('<kbd />').text(value)
      keySpan.append(kbd)
      secDiv.append(keySpan)
      let descSpan = $('<span />').addClass('shortcut-description').text(description)
      secDiv.append(descSpan)
      modalDiv.append(secDiv)
    }
    modalDiv.insertAfter(titleDive)
    callback(data)
  })
}

let dialog
chrome.extension.sendRequest({
  cmd: 'readFile',
  url: chrome.extension.getURL('tpls/help_panel.tpl'),
}, function (result) {
  let div = $('<div />')
  loadHelpPanel(result, function(modifiedData){
      div.html(modifiedData)
      dialog = div.find('#tapdAssistHelpPanel')
      dialog.hide()
      dialog.on('click.closeModal', '[data-dismiss="modal"]', function () {
        dialog.hide()
      })
      $('body').append(dialog)
  })

})

let menuLock = false
let driverDownAt
let driverDownTimeoutId
let leftTreeClose
let clearDriverDownTimeout = function () {
  if (driverDownTimeoutId) {
    clearTimeout(driverDownTimeoutId)
    driverDownTimeoutId = undefined
  }
}
let transform = (key) => {
  // TODO @nie
  return key.split('+').map(function (split) {
    let charMap = {
      '?': 'Slash',
      '+': 'Equal',
      '-': 'Minus'
    }
    return charMap[split] || split
  }).sort().join('+')
}
let SHORTCUTS
tapdAssistOption.getShortcuts().then(function (data) {
  let driver = data.get('driver')
  let workBench = data.get('open_workbench')
  let message = data.get('open_message')
  let memberList = data.get('member_list')
  let editStoryBug = data.get('edit_story')
  let requireReport = data.get('recent_require_report')
  let bugReport = data.get('recent_bug_report')
  let prevPage = data.get('prev_page')
  let nextPage = data.get('next_page')
  let search = data.get('search')
  // let createProject = data.get('create_project')
  let fullScreen = data.get('full_screen')
  let copyTitleLink = data.get('copy_title_link')
  let copyTitle = data.get('copy_title')
  let help = transform(data.get('help'))
  let zoomIn = transform(data.get('zoom_in'))
  let zoomOut = transform(data.get('zoom_out'))

  SHORTCUTS = {
    [workBench]: {
      target: '#top_nav_worktable',
      description: '正在跳转工作台...'
    },
    [message]: {
      target: '#top_nav_worktable_msg',
      description: '正在跳转消息页面...'
    },
    [memberList]: function () {
      let projectId = tapdAssistUtils.getProjectId()
      if (!projectId) {
        tapdAssistUtils.showFlash('❌ 当前不是项目页面')
        return
      }

      tapdAssistUtils.showFlash('正在跳转团队成员...')
      window.location.href = tapdAssistUtils.getProjectUrl('/settings/team')
    },
    [editStoryBug]: function (e) {
      let buttons = {
        '#edit_story_btn': '正在跳转需求编辑...',
        '#edit_bug': '正在跳转缺陷编辑...',
        '#btn_cancel_edit': '正在退出需求编辑...',
        '#id-tapd-toolbar #cancle': '正在退出缺陷编辑...'
      }
      for (let key in buttons) {
        let text = buttons[key]
        let ele = $(key)[0]
        if (ele) {
          tapdAssistUtils.showFlash(text)
          ele.click()
          return
        }
      }
    },
    [requireReport]: function () {
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
          .map(function (a) {
            return a.getAttribute('href')
          })
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
    [bugReport]: function () {
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
          .map(function (a) {
            return a.getAttribute('href')
          })
          .filter(function (href) {
            return href.indexOf('/bugtrace/bugreports/stat_general/general/customreport-') >= 0
          })
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
    [prevPage]: function () {
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
    [nextPage]: function () {
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
    [search]: function (e) {
      e.preventDefault()
      $('#search-keyword').focus().select()
    },
    [fullScreen]: function (e) {
      let btn = $('.editor-btn[data-name=fullscreen]')[0]
      if (btn) {
        e.preventDefault()
        btn.click()
        return
      }
      if (tapdAssistUtils.toggleFullscreen($('#General_div')[0])) {
        e.preventDefault()
      }
    },
    [help]: function () {
      let element = document.activeElement
      let isTextarea = element.tagName === 'TEXTAREA'
      let isInput = element.tagName === 'INPUT' && ['text', 'password', 'search', 'url'].indexOf(element.type) >= 0
      let isEditable = element.contentEditable === 'true'
      if (isTextarea || isInput || isEditable) {
        return
      }
      dialog.toggle()
    },
    [driver]: function () {
      driverDownAt = Date.now()
      clearDriverDownTimeout()
      driverDownTimeoutId = setTimeout(function () {
        clearDriverDownTimeout()
        dialog.show()
      }, 1000)
      leftTreeClose = $('body').hasClass('left-tree-close')
      $('body').removeClass('left-tree-close')
      return driver + '-down'
    },
    [copyTitleLink]: function (e, keys) {
      window.postMessage({
        type: "tapdAssistTryCopyTitle",
        data: ""
      }, "*")
    },
    [copyTitle]: function (e, keys) {
      window.postMessage({
        type: "tapdAssistTryCopyTitle2",
        data: ""
      }, "*")
    },
    [zoomIn]: function (e, keys) {
      let ele = document.webkitFullscreenElement
      if (!$(ele).hasClass('tapd-assist-fullscreen-element')) {
        ele = undefined
      }
      tapdAssistUtils.changeFullscreenZoom(-1, ele)
    },
    [zoomOut]: function (e, keys) {
      let ele = document.webkitFullscreenElement
      if (!$(ele).hasClass('tapd-assist-fullscreen-element')) {
        ele = undefined
      }
      tapdAssistUtils.changeFullscreenZoom(1, ele)
    },
  }
  console.log(SHORTCUTS)
})


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
    console.warn('Invalid shortcut handler: document.getElementById empty', target, handler)
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

let ensureListenDocumentKeyEvents = function () {
  let ensure = function (win, doc, options = {}) {
    if (doc.body.getAttribute('tapdAssistInitialized')) {
      return
    }
    doc.body.setAttribute('tapdAssistInitialized', 'yes')

    tapdAssistOption.getShortcuts().then(function (data) {
      let driver = data.get('driver')
      let projectDriver = data.get('project_driver')
      let listen = function () {
        doc.addEventListener('keydown', function (e) {
          let result = executeShortcuts(SHORTCUTS, e)
          let projectResult = executeShortcuts(PROJECT_SHORTCUTS, e)
          if (result.match && result.result !== driver + '-down' || projectResult.match && projectResult.result !== projectDriver + '-down') {
            clearDriverDownTimeout()
          }
        })

        doc.addEventListener('keyup', function (e) {
          let key = e.key.toLowerCase()
          if (key === driver || (key === 'control' && driver === 'ctrl')) {
            dialog.hide()
            clearDriverDownTimeout()

            const QUICK_CLICK_THRESHOLD = 400
            let quickAlt = driverDownAt && Date.now() - driverDownAt < QUICK_CLICK_THRESHOLD
            if (quickAlt) {
              $('body').toggleClass('left-tree-close minimenu', !leftTreeClose)
            } else if (menuLock) {
            } else {
              $('body').addClass('left-tree-close minimenu')
            }
          }
        })
      }
      if (!doc.body.childElementCount && options.waitContent) {
        let id = setInterval(function () {
          if (doc.body.childElementCount) {
            clearInterval(id)
            listen()
          }
        }, 200)
      }
      listen()
    })
  }
  ensure(window, document)
  $('iframe').toArray().forEach(function (iframe) {
    ensure(iframe.contentWindow, iframe.contentDocument, {waitContent: true})
  })
}

ensureListenDocumentKeyEvents()

// bodyDOMObserver.disconnect()

let markingLeaveMember = function() {
  let row = $('.list-action-table tbody tr')
  tapdAssistOption.getShortcuts().then(function(data){
    let url = data.get('external_api')
    if(!url) {
      console.log('external API url not set')
      return
    }

    let rows = $('.list-action-table tbody tr')
    let users = rows.toArray().map(row => {
      row = $(row)
      return {
        nick: row.find('.member-user-nick').text().trim(),
        name: row.find('.member-name-div span').text().trim(),
        email: row.find('.member-email-div').text().trim(),
        department: row.find('.dept-name').text().trim(),
        group: row.find('.member-role-div span').text().trim(),
        status: row.find('.end-col-table').prev().text().trim()
      }
    })

    let postJson = {
      api: 'user-info',
      data: {
        users
      }
    }

    chrome.extension.sendRequest({
      cmd: 'httpRequest',
      data: {
        type: 'POST',
        url: url,
        data: postJson,
        dataType: 'json',
        contentType: 'application/json'
      }
    }, function (response) {
      let {
        code,
        data: {
          users
        }
      } = response
      if (code !== 0) {
        console.error('server response error code', code, response)
        return
      }
      if (!users) {
        console.error('invalid data', users, response)
        return
      }
      rows.each(function(){
        let row = $(this)
        let eleNick = row.find('.member-user-nick')
        let nickText = eleNick.text().trim()

        let user = users.find(user => user.nick === nickText)
        if (!user) {
          console.warn('user not found', nickText)
          return
        }
        let {
          tags = []
        } = user
        for(let tag of tags) {
          let {
            name,
            style,
            rowStyle
          } = tag

          let eleTag = $('<span></span>')
          eleTag.css({
            fontSize: '10px',
            padding: '2px 5px',
            marginLeft: '5px'
          })
          if (style) {
            eleTag.css(style)
          }
          eleTag.text(name)
          eleNick.append(eleTag)

          if (rowStyle) {
            row.css(rowStyle)
          }
        }
      })
    })
  })
}

let requestPermission = function() {

}

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
  'page_inject.js',
  'tapdOptions.js'
]
scripts.forEach(function (script) {
  tapdAssistUtils.injectScript({
    url: chrome.extension.getURL('/' + script)
  })
})




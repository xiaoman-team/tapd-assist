const randomStringChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

let tapdAssistUtils = {
  isInsideExtension: function () {
    return typeof chrome.extension !== 'undefined'
  },
  generateRandomString: function (len = 8) {
    let chars = []
    for (let i = 0; i < len; i++) {
      let index = Math.floor(Math.random() * randomStringChars.length)
      let c = randomStringChars.charAt(index)
      chars.push(c)
    }
    return chars.join('')
  },
  getProjectId: function getProjectId(url) {
    if (url === undefined) {
      url = window.location.href
    }
    let re = new RegExp('^https://www\\.tapd\\.cn//?([0-9]+)/.*$')
    let m = re.exec(url)
    if (m) {
      return m[1]
    }
  },
  getProjectUrl: function (path) {
    let projectId = tapdAssistUtils.getProjectId()
    if (projectId) {
      return 'https://www.tapd.cn/' + projectId + path
    }
  },
  ajax: function (options) {
    return $.ajax(Object.assign({
      xhr: function () {
        let xhr = jQuery.ajaxSettings.xhr()
        let setRequestHeader = xhr.setRequestHeader
        xhr.setRequestHeader = function (name, value) {
          if (name == 'X-Requested-With') return
          setRequestHeader.call(this, name, value)
        }
        return xhr
      },
    }, options))
  },
  showFlash: function (data) { // {text, keep, delay} or 'text'
    if (tapdAssistUtils.isInsideExtension()) {
      window.postMessage({
        type: "tapdAssistShowFlash",
        data: data
      }, "*")
      return
    }
    let text
    let keep = true
    let delay = 3000
    let prefix = '【TAPD助手】'
    if (typeof data === 'string') {
      text = data
    } else {
      keep = data.keep
      if ('delay' in data) {
        delay = data.delay
      }
      if ('prefix' in data) {
        prefix = data.prefix
      }
    }
    window.TFL.tips.showFlash(prefix + text, keep, delay)
  },
  injectScript: function (options = {}) {
    let {
      url,
      content,
      doc = document,
      parent = doc.body
    } = options
    let script = doc.createElement('script')
    script.setAttribute('type', 'text/javascript')
    if (url) {
      script.setAttribute('src', url)
    }
    if (content) {
      script.textContent = content
    }
    parent.appendChild(script)
  },
  toggleFullscreen: function (ele0) {
    let ele = document.webkitFullscreenElement
    if (ele) {
      document.webkitExitFullscreen()
      $(ele).removeClass('tapd-assist-fullscreen-element')
      return true
    }
    ele = ele0
    if (!ele) {
      console.warn('No element need to request fullscreen')
      return
    }
    ele.webkitRequestFullscreen()
    $(ele).addClass('tapd-assist-fullscreen-element')
    return true
  },
  watchFullscreen: function () {
    document.addEventListener("webkitfullscreenchange", function( event ) {
      if (!document.webkitIsFullScreen ) {
        let ele = event.target
        if (ele) {
          $(ele).removeClass('tapd-assist-fullscreen-element')
        }
      }
    });
  },
  replaceLinkInText: function (node) {
    let text = node.data
    let splits = text.split(/[ \t\r\n]+/)

    let children = []
    let index0 = 0
    splits.forEach(function (split) {
      let index = text.indexOf(split, index0)
      if (index < 0) { // should not
        console.error('[tapd_assist] find sub string failed', text, split)
        return
      }
      let url
      try {
        url = new URL(split)
      } catch (err) {
        return
      }
      if (url.origin === split || url.protocol === split) {
        return
      }

      if (index > index0) {
        let str = text.substring(index0, index)
        children.push(document.createTextNode(str))
      }

      let a = document.createElement('a')
      a.href = split
      a.textContent = decodeURIComponent(split)
      if (['https:', 'http:'].indexOf(a.protocol) < 0) {
        a.title = '点击打开' + a.protocol + '//协议'
      }
      children.push(a)

      index0 = index + split.length
    })

    if (children.length === 0) {
      return // no matched url
    }

    let span = document.createElement('span')
    children.forEach(function (child) {
      span.appendChild(child)
    })

    if (text.length > index0) {
      let str = text.substring(index0)
      span.appendChild(document.createTextNode(str))
    }
    return span
  },
  patchURLLink: function (root) {
    let detectAndReplaceLink = function (parent) {
      let childNodes = parent.childNodes
      childNodes.forEach(function (node) {
        detectAndReplaceLink(node)

        const patchExcludes = ['a', 'style']
        let parentNodeName = parent.nodeName.toLowerCase()
        let nodeName = node.nodeName.toLowerCase()
        if (patchExcludes.indexOf(parentNodeName) < 0 && nodeName === '#text') {
          let newNode = tapdAssistUtils.replaceLinkInText(node)
          if (newNode) {
            parent.insertBefore(newNode, node)
            parent.removeChild(node)
          }
        }
      })
    }

    detectAndReplaceLink(root)
  },
  patchProjectList: function () {
    let root = document.getElementById('myprojects-list')
    if (!root) {
      console.warn('[tapd_assist] #myprojects-list not found')
      return
    }
    if (root.getAttribute('tapdAssistInitialized')) {
      return
    }

    let getProjectId = function (li) {
      let a = $(li).find('a')[0]
      if (a) {
        return parseInt(tapdAssistUtils.getProjectId(a.href))
      }
      return 0
    }
    let projects = $(root).children('li').toArray().filter(function (li) {
      return getProjectId(li)
    }).sort(function (a, b) {
      return getProjectId(b) - getProjectId(a)
    })
    if (projects.length) {
      root.setAttribute('tapdAssistInitialized', 'yes')
    }

    projects.concat().reverse().forEach(function (ele) {
      root.prepend(ele)
    })

    let shortcuts = {}
    for (let i = 0; i < projects.length; i++) {
      let index = i + 1
      let li = projects[i]
      if ($(li).hasClass('iamloaded')) {
        continue
      }
      li.style.position = 'relative'

      let span = document.createElement('span')
      span.className = 'assist-project-index'
      span.textContent = index
      li.appendChild(span)

      let anchor = $(li).children('a')[0]
      if (anchor) {
        let name = anchor.title
        anchor.setAttribute('project-index', i + 1)
        shortcuts['Alt+' + index] = function () {
          if (name) {
            tapdAssistUtils.showFlash('正在跳转到' + name + '...')
          }
          anchor.click()
          span.textContent = '\u2713'
          li.style.backgroundColor = '#303236'
        }
      }
    }
    return shortcuts
  },
  patchComments: function () {
    let root = document.getElementById('comments')
    if (!root) {
      return
    }

    let ele = $(root).find('.title span:last').append(`
  <a class="fullscreen link-ico f12" title="【TAPD助手】全屏" style="margin-left: 12px">
    <i class="font-editor font-editor-fullscreen"></i>
  </a>
`)
    $(root).find('.fullscreen').click(function () {
      tapdAssistUtils.toggleFullscreen(root)
    })
    $(root).find('.comment_content').toArray().forEach(function (comment) {
      let parent = $(comment).find('.comment-info span:last')
        parent.append(`
<a title="【TAPD助手】全屏" class="fullscreen link-ico">
  <i class="font-editor font-editor-fullscreen"></i>
</a>
`)
        parent.find('.fullscreen').click(function () {
          tapdAssistUtils.toggleFullscreen(comment)
        })
    })
  },
  patchFullscreenButton: function () {
    let ele = $('[data-name=fullscreen]')[0]
    if (ele) {
      ele.title = "全屏编辑(Alt+F)"
    }
  }
}
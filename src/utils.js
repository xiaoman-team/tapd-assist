let tapdAssistUtils = {
  isInsideExtension: function () {
    return typeof chrome.extension !== 'undefined'
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
        type: "showFlash",
        data: data
      }, "*")
      return
    }
    let text
    let keep = true
    let delay = 3000
    if (typeof data === 'string') {
      text = data
    } else {
      keep = data.keep
      if (data.delay) {
        delay = data.delay
      }
    }
    window.TFL.tips.showFlash(text, keep, delay)
  },
  injectScript: function (file) {
    let script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', file)
    document.body.appendChild(script)
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

      if (index > index0) {
        let str = text.substring(index0, index)
        children.push(document.createTextNode(str))
      }

      let a = document.createElement('a')
      a.href = split
      a.textContent = decodeURIComponent(split)
      if (['https:', 'http:'].indexOf(a.protocol)) {
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

    let projects = $(root).children('li')
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
        anchor.setAttribute('project-index', i + 1)
        shortcuts['Alt+' + index] = function () {
          anchor.click()
          span.textContent = '\u2713'
          li.style.backgroundColor = '#303236'
        }
      }
    }
    return shortcuts
  }
}
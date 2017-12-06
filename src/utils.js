const randomStringChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

let tapdAssistUtils = {
  namePrefix: '【TAPD助手】',
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
    let prefix = tapdAssistUtils.namePrefix
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
    tapdAssistUtils.patchZoom(ele)
    tapdAssistUtils.patchFullscreenImage(ele)
    ele.webkitRequestFullscreen()
    $(ele).addClass('tapd-assist-fullscreen-element')
    return true
  },
  watchFullscreen: function () {
    document.addEventListener("webkitfullscreenchange", function ( event ) {
      let ele = event.target
      if (document.webkitIsFullScreen ) {
        if ($(ele).hasClass('tapd-assist-fullscreen-element')) {
          chrome.storage.local.get('fullscreen-zoom', function (data) {
            let {'fullscreen-zoom': value} = data
            tapdAssistUtils.setFullscreenZoom(ele, parseFloat(value) || 1)
          })
        }
      } else {
        if (ele) {
          $(ele).removeClass('tapd-assist-fullscreen-element')
          $(ele).css('zoom', 1)
        }
      }
    })
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
  patchZoom: function (ele) {
    if (ele.getAttribute('tapd-assist-zoom')) {
      return
    }
    $(ele).prepend(`
<div class="tapd-assist-zoom">
  <a title="${tapdAssistUtils.namePrefix}放大(Alt+)" class="tapd-assist-zoom-in"
    style="float: right; margin-left: 12px; margin-top: 2px">
    <i class="ico-plus-b"></i>
  </a>
  <a title="${tapdAssistUtils.namePrefix}缩小(Alt-)" class="tapd-assist-zoom-out"
    style="float: right; margin-left: 12px; margin-top: 2px">
    <i class="ico-minus-b"></i>
  </a>
</div>
`)
    $(ele).find('.tapd-assist-zoom-in').click(function () {
      tapdAssistUtils.changeFullscreenZoom(1, ele)
    })
    $(ele).find('.tapd-assist-zoom-out').click(function () {
      tapdAssistUtils.changeFullscreenZoom(-1, ele)
    })
    ele.setAttribute('tapd-assist-zoom', 'yes')
  },
  patchFullscreenImage: function (root) {
    let images = $(root).find('img[original_src]')
    images.toArray().forEach(function (img) {
      if (img.getAttribute('tapd-assist-image-original-mirror')) {
        return
      }
      let src = img.getAttribute('original_src')
      if (!src) {
        console.warn('image original src not found', img)
        return
      }
      let img1 = document.createElement('img')
      img1.setAttribute('class', 'tapd-assist-original')
      img1.setAttribute('src', src)
      $(img).after(img1)
      img.setAttribute('tapd-assist-image-original-mirror', 'yes')
    })
  },
  patchProjectList: function () {
    let root = $('#myprojects-list')[0]
    if (!root) {
      console.warn('[tapd_assist] #myprojects-list not found')
      return
    }
    if (root.getAttribute('tapdAssistInitialized')) {
      return
    }
    // console.info('[tapd_assist] #myprojects-list patched')

    let getProjectId = function (li) {
      let a = $(li).find('a')[0]
      if (a) {
        return parseInt(tapdAssistUtils.getProjectId(a.href))
      }
      return 0
    }
    let projects = $(root).children('li').toArray().filter(function (li) {
      return getProjectId(li)
    })
    if (projects.length) {
      root.setAttribute('tapdAssistInitialized', 'yes')
    }

    let shortcuts = {}
    tapdAssistOption.getShortcuts().then(function(data){
      let projectDriver = data.get('project_driver')
      let projectListOrder = data.get('project_list_order')

      if (projectListOrder === 'id_desc') {
        projects = projects.sort(function (a, b) {
          return getProjectId(b) - getProjectId(a)
        })
        projects.concat().reverse().forEach(function (ele) {
          root.prepend(ele)
        })
      }

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

          shortcuts[projectDriver + '+' + index] = function () {
            if (name) {
              tapdAssistUtils.showFlash('正在跳转到' + name + '...')
            }
            anchor.click()
            span.textContent = '\u2713'
            li.style.backgroundColor = '#303236'
          }
        }
      }
    })
    return shortcuts
  },
  patchComments: function () {
    let root = $('#comments')[0]
    if (!root) {
      return
    }

    let ele = $(root).find('.title span:last').append(`
  <a class="fullscreen link-ico f12" title="${tapdAssistUtils.namePrefix}全屏" style="margin-left: 12px">
    <i class="font-editor font-editor-fullscreen"></i>
  </a>
`)
    $(root).find('.fullscreen').click(function () {
      tapdAssistUtils.toggleFullscreen(root)
    })
    $(root).find('.comment_content').toArray().forEach(function (comment) {
      let parent = $(comment).find('.comment-info span:last')
        parent.append(`
<a title="${tapdAssistUtils.namePrefix}全屏" class="fullscreen link-ico">
  <i class="font-editor font-editor-fullscreen"></i>
</a>
`)
        parent.find('.fullscreen').click(function () {
          tapdAssistUtils.toggleFullscreen(comment)
        })
    })
  },
  patchEditButton: function () {
    let buttons = {
      '#edit_story_btn': '编辑需求',
      '#edit_bug': '编辑缺陷',
      '#edit_task': '编辑任务',
      '#btn_cancel_edit': '退出需求编辑',
      '#id-tapd-toolbar #cancle': '退出缺陷编辑',
      '#id-tapd-toolbar a.btn:contains(取消)': '退出任务编辑'
    }
    for (let key in buttons) {
      let text = buttons[key]
      $(key).prop('title', `${tapdAssistUtils.namePrefix}${text}(Alt+E)`)
    }
  },
  patchUserLink: function (root) {
    tapdAssistOption.getShortcuts().then(function(data) {
      let userLink = data.get('user_link')
      if (!userLink) {
        console.warn('昵称链接没有设置')
        return
      }

      let patchSingle = function (ele) {
        ele = $(ele)
        if (!ele.length) {
          return
        }
        ele = ele.children('.editable-value')
        if (ele.children().length) {
          return // already patched
        }
        let text = ele.text()
        if (!text) {
          return // empty
        }
        ele.text('')

        let children = text.split(';').map(function (split, index, splits) {
          split = split.trim()
          let url = userLink.replace('{{user}}', split)

          let a0 = document.createElement('a')
          a0.textContent= split
          a0.href = url
          a0.style.display = 'none'

          let a1 = document.createElement('a')
          a1.textContent= split
          a1.href = url
          a1.addEventListener('click', function (e) {
            e.preventDefault()
            a0.click()
          })

          let elements = [a0, a1]
          if (index < splits.length - 1) {
            elements.push(';')
          }

          return elements
        })

        children = [].concat.apply([], children);
        ele.append(children)
      }

      if (root) {
        root = $(root)
        let choosers = root.children('[data-editable=pinyinuserchooser]')
        if (!choosers.length) {
          choosers = root
        }
        choosers.toArray().forEach(patchSingle)
        return
      }

      let choosers = $('[data-editable=pinyinuserchooser]')
      choosers.toArray().forEach(patchSingle)

      patchSingle($('#ContentCreatedBy'))
      patchSingle($('#ContentCreator'))
    })
  },
  patchFullscreenEditButton: function () {
    let ele = $('[data-name=fullscreen]')[0]
    if (ele) {
      ele.title = "全屏编辑(Alt+F)"
    }
  },
  patchFullscreenButton: function () {
    let tapdBase = $('#General_div .tapd-base')
    if (tapdBase.length && tapdBase.find('.fullscreen').length === 0) {
      tapdBase.prepend(`
<a title="${tapdAssistUtils.namePrefix}全屏(Alt+F)" class="fullscreen link-ico"
  style="float: right; margin-left: 12px; margin-top: 2px">
  <i class="font-editor font-editor-fullscreen"></i>
</a>
`)
      tapdBase.find('.fullscreen').click(function () {
        tapdAssistUtils.toggleFullscreen($('#General_div')[0])
      })
    }
  },
  setFullscreenZoom: function (ele, zoom) {
    const buttonScale = 1.5
    $(ele).css('zoom', zoom)
    $(ele).find('.tapd-assist-zoom').css('zoom', buttonScale/zoom)
  },
  changeFullscreenZoom: function (delta, ele) {
    const zooms = [
      '0.25',
      '0.33',
      '0.5',
      '0.67',
      '0.75',
      '0.8',
      '0.9',
      '1.1',
      '1.25',
      '1.5',
      '1.75',
      '2'
      // '2.5',
      // '3',
      // '4',
      // '5'
    ]
    chrome.storage.local.get('fullscreen-zoom', function (data) {
      let {'fullscreen-zoom': value} = data
      let index = zooms.indexOf(value)
      if (index < 0) {
        index = 0
      }
      index += delta
      if (index < 0) {
        tapdAssistUtils.showFlash('已达最小尺寸')
        return
      }
      if (index >= zooms.length) {
        tapdAssistUtils.showFlash('已达最大尺寸')
        return
      }
      let zoom = zooms[index]
      chrome.storage.local.set({'fullscreen-zoom': zoom}, function () {
        let zoomValue = parseFloat(zoom)
        if (ele) {
          tapdAssistUtils.setFullscreenZoom(ele, zoomValue)
        }
        tapdAssistUtils.showFlash(`${Math.round(zoomValue * 100)}%`)
      })
    })
  }
}

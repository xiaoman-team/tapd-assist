
$(function (e) {
  // 模拟鼠标移入，触发标题的clipboard初始化
  $('.subject_title').mouseover()

  let ensureClipboard = function (ele, callback) {
    if ($(ele).closest('[data-clipboard-init=1]').length) {
      callback()
      return
    }

    $(ele).mouseover()
    setTimeout(callback, 300)
  }

  let copyTitle2 = function (options) {
    options = options || {}
    let titleEle = $('.subject_title,.worktable-preview__head')
    let id = titleEle.find('.title-id,.story-title-id,.bug-title-id,.task-title-id').text()
    let id1 = id.match(/\d+/)
    if (id1) {
      id = id1[0]
    }
    let title = titleEle.find('.editable-value').text().trim()
    let text = `#${id} ${title}`
    if (options.link) {
      let link = titleEle.find('a:contains(\'详情\')')[0]
      text = `${text}\n${link ? link.href : window.location.href}`
    }

    let btn = titleEle.find('.tapdAssistTryCopyTitle2')[0]
    if (!btn) {
      titleEle.find('.dropdown-menu').append(`
<div class="clipboard-btn tapdAssistTryCopyTitle2" data-clipboard-text="???">
</div>`)
      btn = titleEle.find('.tapdAssistTryCopyTitle2')[0]
    }
    btn.setAttribute('data-clipboard-text', text)
    ensureClipboard(btn, function () {
      btn.click()
    })

    return text
  }

  window.addEventListener('message', function (e) {
    if (!e.data) {
      return
    }

    let {type, data} = e.data
    switch (type) {
      case 'tapdAssistTryCopyTitle': {
        let selection = window.getSelection()
        let nothingSelected = !selection.toString()
        if (nothingSelected) {
          let btn = $('#title-copy-btn')
          if (btn.length) {
            ensureClipboard(btn, function () {
              btn[0].click()
              if (btn.length) {
                tapdAssistUtils.showFlash('标题与链接已复制')
              }
            })
            break
          }

          copyTitle2({link: true})
        }
        break
      }
      case 'tapdAssistTryCopyTitle2': {
        let selection = window.getSelection()
        let nothingSelected = !selection.toString()
        if (nothingSelected) {
          let text = copyTitle2()
          tapdAssistUtils.showFlash('已复制标题：' + text)
        }
        break
      }
      case 'tapdAssistShowFlash': {
        tapdAssistUtils.showFlash(data)
        break
      }
    }
  })
})



$(function (e) {
  // 模拟鼠标移入，触发标题的clipboard初始化
  $('.subject_title').mouseover()

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
          btn.click()
          if (btn.length) {
            tapdAssistUtils.showFlash('标题与链接已复制')
          }
        }
        break
      }
      case 'tapdAssistTryCopyTitle2': {
        let selection = window.getSelection()
        let nothingSelected = !selection.toString()
        if (nothingSelected) {
          let title = $('.subject_title')
          let text = '#' + title.find('.title-id').text() + ' ' + title.find('.editable-value').text()
          let btn = title.find('.tapdAssistTryCopyTitle2')[0]
          if (!btn) {
            title.append(`
<div class="clipboard-btn tapdAssistTryCopyTitle2" data-clipboard-text="???">
</div>`)
            btn = title.find('.tapdAssistTryCopyTitle2')[0]
          }
          btn.setAttribute('data-clipboard-text', text)
          btn.click()
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


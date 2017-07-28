
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
          let titleEle = $('.subject_title')
          let id = titleEle.find('.title-id').text().trim()
          let title = titleEle.find('.editable-value').text().trim()
          let text = `#${id} ${title}`
          let btn = titleEle.find('.tapdAssistTryCopyTitle2')[0]
          if (!btn) {
            titleEle.append(`
<div class="clipboard-btn tapdAssistTryCopyTitle2" data-clipboard-text="???">
</div>`)
            btn = titleEle.find('.tapdAssistTryCopyTitle2')[0]
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


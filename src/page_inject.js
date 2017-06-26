
$(function (e) {
  // 模拟鼠标移入，触发标题的clipboard初始化
  $('.subject_title').mouseover()

  window.addEventListener('message', function (e) {
    if (!e.data) {
      return
    }

    let {type, data} = e.data
    switch (type) {
      case 'tryCopyTitle': {
        let selection = window.getSelection()
        let nothingSelected = !selection.toString()
        if (nothingSelected) {
          let btn = $('#title-copy-btn')
          btn.click()
          if (btn.length) {
            tapdAssistUtils.showFlash('标题与链接已复制到剪贴板中')
          }
        }
        break
      }
      case 'showFlash': {
        tapdAssistUtils.showFlash(data)
        break
      }
    }
  })
})


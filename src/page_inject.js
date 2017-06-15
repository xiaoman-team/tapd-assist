
$(function (e) {
  // 模拟鼠标移入，触发标题的clipboard初始化
  $('.subject_title').mouseover();

  $(document).on('try:copy:title', function (e) {
    let selection = window.getSelection();
    let nothingSelected = !selection.toString();
    if (nothingSelected) {
      let btn = $('#title-copy-btn')
      btn.click();
      if (btn.length) {
        window.TFL.tips.showFlash('【TAPD助手】标题与链接已复制到剪贴板中');
      }
    }
  });
});


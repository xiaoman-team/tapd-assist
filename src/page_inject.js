
$(function (e) {
  // 模拟鼠标移入，触发标题的clipboard初始化
  $('.subject_title').mouseover();
  $(document).on('try:copy:title', function (e) {
    let selection = window.getSelection();
    if (selection.type !== 'Range') {
      $('#title-copy-btn').click();
      window.TFL.tips.showFlash('【小满助手】标题与链接已复制到剪贴板中')
      console.log('xxxxxxx bbb', e)
    }
  });
});


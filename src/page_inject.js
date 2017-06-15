
$(function (e) {
  // 模拟鼠标移入，触发标题的clipboard初始化
  $('.subject_title').mouseover();
  $(document).on('try:copy:title', function () {
    let selection = window.getSelection();
    if (selection.type !== 'Range') {
      $('#title-copy-btn').click();
    }
  });
});


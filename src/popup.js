$(function () {
  $('.ta-popup .ta-about').click(function () {
    chrome.tabs.create({
        url: "about.html",
        active: true
    })
  })
  $('#shortcutsSelect').on('change', function () {
    let key = $(this).val()

    chrome.storage.sync.set({
      'shortcut': key
    }, function (val) {
      console.log('设置成功', val)
    })
  })
})

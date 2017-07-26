$(function () {
  $('.ta-popup .ta-website').click(function () {
    chrome.tabs.create({
      url: "https://www.tapd.cn/",
      active: true
    })
  })
  $('.ta-popup .ta-options').click(function () {
    chrome.tabs.create({
      url: "options.html",
      active: true
    })
  })
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

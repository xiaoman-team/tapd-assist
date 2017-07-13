window.addEventListener('load', function () {
  window.postMessage({
    type: "tapdAssistPageLoaded",
    data: Math.random().toString()
  }, "*")
})

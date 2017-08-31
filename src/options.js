
let defaultOptions = tapdDefaultOptions
let defaultShortcuts = tapdDefaultShortcuts

let options = {
  changeKey: function (ele) {
    let id = ele.attr('id')
    let val = ele.find('option:selected').val()
    let select = defaultOptions.find(item => item.id === id)
    if (!select) {
      console.warn(`select ${id} not found`)
      return
    }
    let option = select.options.find(item => item.value === val)
    if (!option) {
      console.warn(`select ${id} option ${val} not found`)
      return
    }
    ele.next().text(option.description)
  },
  changeShortcuts: function (event) {
    let key = ''
    event.preventDefault()
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      if (event.ctrlKey) {
        key = 'Ctrl'
      } else if (event.altKey) {
        key = 'Alt'
      } else if (event.metaKey) {
        key = 'Meta'
      } else if (event.shiftKey) {
        key = 'Shift'
      }
      $(this).val(key + '+' + String.fromCharCode(event.keyCode))
    } else if (event.keyCode) {
      let textKey = String.fromCharCode(event.keyCode)
      $(this).val(textKey)
    }
  }
}

let save_options = () => {
  let select = $('select')
  let eleShortcuts = $('tbody input')
  let options = {}
  let objShortcuts = {}

  for (let i = 0; i < select.length; i++) {
    let id = select.eq(i).attr('id')
    options[id] = select.eq(i).val()
  }

  for (let shortcut of eleShortcuts) {
    objShortcuts[shortcut.getAttribute('class')] = shortcut.value
  }
  options.shortcuts = objShortcuts

  chrome.storage.local.set({
    localOptions: options
  }, function () {
    let status = document.getElementById('status')
    status.textContent = 'Updated'
    status.style.background = '#39a1f4'
    setTimeout(function () {
      status.textContent = ''
      status.style.background = '#fff'
    }, 750)
  })
}

let restore_options = () => {

  chrome.storage.local.get('localOptions', function (result) {
    let local = result.localOptions

    for (let item of defaultOptions) {
      let id = item.id
      let eleOptionDiv = $('<div></div>').attr('class', 'option')

      let eleTitle = $('<span></span>').text(item.title)
      eleOptionDiv.append(eleTitle)

      let eleSelect = $('<select></select>').attr('id', id)
      for (let option of item.options) {
        let eleOption = $('<option></option>').val(option.value).text(option.text)
        eleSelect.append(eleOption)
      }
      //下拉框的value
      let val = (local && local[id]) || item.options[0].value
      eleSelect.val(val)
      eleOptionDiv.append(eleSelect)

      let eleDescDiv = $('<div></div>').attr('class', 'desc')
      //根据value展示对应的描述
      let option = item.options.find(item => item.value === val)
      let description = option && option.description
      eleDescDiv.text(description)
      eleOptionDiv.append(eleDescDiv)

      $('.options').append(eleOptionDiv)
    }

    for (let item of defaultShortcuts) {
      let tr = $('<tr></tr>')
      for (let j = 0; j < 3; j++) {
        let td = $('<td></td>')
        switch (j) {
          case 0:
            td.text(item.title)
            break
          case 1:
            let input = $('<input>').addClass(item.key)
            let text = (local && local.shortcuts[item.key]) || item.value
            input.val(text)
            td.append(input)
            break
          case 2:
            td.text(item.description)
            break
          default: {
          }
        }
        tr.append(td)
      }
      $('tbody').append(tr)
    }
  })
}


let reset = () => {
  let selects = $('select')
  for (let ele of selects.toArray()) {
    let id = ele.attr('id')
    let select = defaultOptions.find(option => option.id === id)
    if (select) {
      let option = select.options[0]
      ele.val(option.value)
      ele.next('.desc').text(option.description)
    } else {
      console.warn('option not found', id)
    }
  }

  let inputs = $('tbody input')
  for (let ele of inputs.toArray()) {
    let key = ele.attr('class')

    let shortcut = defaultShortcuts.find(shortcut => shortcut.key === key)
    if (shortcut) {
      ele.val(shortcut.value)
    } else {
      console.warn('shortcut not found', key)
    }
  }
  save_options()
}

$(function () {
  $(document).ready(restore_options())
  $('tbody').on('keydown', 'input', options.changeShortcuts)
  $('div.options').on('change', 'select', function () {
      options.changeKey($(this))
    }
  )
  document.getElementById('save').addEventListener('click', save_options)
  document.getElementById('reset').addEventListener('click', reset)
})

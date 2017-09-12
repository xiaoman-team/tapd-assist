
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
    event.preventDefault()

    let keyMap = {
      'metaKey': 'Meta',
      'ctrlKey': 'Ctrl',
      'altKey': 'Alt',
      'shiftKey': 'Shift'
    }

    let keys = []
    for (let key in keyMap) {
      if (event[key]) {
        keys.push(keyMap[key])
      }
    }
    if (keys.length === 0) {
      return
    }

    let char = String.fromCharCode(event.keyCode)
    keys.push(char)
    $(this).val(keys.join('+'))
  }
}

let getLocalApi = function(){
  return new Promise(function(resolve,reject){
    chrome.storage.local.get('localOptions', resolve)
  }).then(function(result){
      let map = new Map()
      let local = result.localOptions
      map.set('api', local['external_api'])
      return map;
    })
}

let saveOptions = (opts = {}) => {
  let {
    start = '保存中...',
    end = '保存完毕'
  } = opts

  let status = $('#status')
  status.text(start).show()

  let eleOptionValue = $('select')
  let eleShortcuts = $('tbody input')
  let options = {}
  let objShortcuts = {}

  for (let i = 0; i < eleOptionValue.length; i++) {
    let id = eleOptionValue.eq(i).attr('id')
    options[id] = eleOptionValue.eq(i).val()
  }

  let api = $('#external_api').val()

  console.log('save')

  for (let shortcut of eleShortcuts) {
    objShortcuts[shortcut.getAttribute('class')] = shortcut.value
  }
  options.shortcuts = objShortcuts

  if(!api) {
    getLocalApi().then(function(data){
      let localApi = data.get('api')
      if(localApi) {
        console.log('api value is not exsit，but have local api')
        console.log('local: ' + localApi)
        removePermission(localApi)
      }
      chrome.storage.local.set({
        localOptions: options
      }, function () {
        status.text(end)
        status.fadeOut(800)
      })
    })
  } else {
    console.log('api value is exist')
    setPermission(api, function(flag){
      if(flag === 1) {
        options['external_api'] = api

        chrome.storage.local.set({
          localOptions: options
        }, function () {
          status.text(end)
          status.fadeOut(800)
        })
      }
    })

  }
}

let restore_options = () => {
  chrome.storage.local.get('localOptions', function (result) {
    let local = result.localOptions
    console.log(local)

    for (let item of defaultOptions) {
      let id = item.id
      let eleOptionDiv = $('<div></div>').attr('class', 'option')

      let eleTitle = $('<span></span>').text(item.title)
      eleOptionDiv.append(eleTitle)

      let type = item.type
      if(type === 'select') {
        let eleSelect = $('<select></select>').attr('id', id).attr('class', 'option_value')
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

      } else if(type === 'text_box') {
        let value = (local && local[id]) || item.value
        let textBox = $('<input>').attr({id: id, class: 'option_value'}).val(value)
        eleOptionDiv.append(textBox)

        let link =  item.detailLink;
        if(link) {
          let eleLink = $('<a></a>').attr({href: link, target: '_blank', class: 'explain_links'}).text('了解更多')
          eleLink.insertAfter(textBox)
        }

        let description = item.description
        let eleDescDiv = $('<div></div>').attr('class', 'desc').text(description)
        eleOptionDiv.append(eleDescDiv)

      }
      $('.options').append(eleOptionDiv)
    }

    for (let item of defaultShortcuts) {
      let tr = $('<tr></tr>')
      for (let j = 0; j < 3; j++) {
        let td = $('<td></td>')
        switch (j) {
          case 0:
            td.text(item.title)
              .addClass('title')
            break
          case 1:
            let input = $('<input>').addClass(item.key)
            let text = (local && local.shortcuts && local.shortcuts[item.key]) || item.value
            input.val(text)
            td.append(input)
              .addClass('shortcut')
            break
          case 2:
            td.text(item.description)
              .addClass('description')
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
  for (let ele of selects) {
    ele = $(ele)
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

  $('#external_api').val('')
  removePermission()

  let inputs = $('tbody input')
  for (let ele of inputs) {
    ele = $(ele)
    let key = ele.attr('class')

    let shortcut = defaultShortcuts.find(shortcut => shortcut.key === key)
    if (shortcut) {
      ele.val(shortcut.value)
    } else {
      console.warn('shortcut not found', key)
    }
  }
  saveOptions({
    start: '正在重置...',
    end: '重置完毕',
  })
}

let setPermission = function(api, callback) {
  let flag
  chrome.permissions.request({
    permissions: [],
    origins: [api]
  }, function(granted) {
    if (granted) {
      console.log('grated')
      checkPermission(api)
      flag = 1
      callback(flag)
    } else {
      console.log('granted failed')
      $('#external_api').val('')
      flag = 0
      callback(flag)
    }
  });
}

let removePermission = function() {
  getLocalApi().then(function(data){
    let localApi = data.get('api')
    if(localApi) {
      chrome.permissions.remove({
        permissions: [],
        origins: [localApi]
      }, function(removed) {
        if (removed) {
          // The permissions have been removed.
          $('#external_api').val('')
          console.log('removed')
          checkPermission(localApi)
        } else {
          flag = 0
          console.log('remove failed')
        }
      })
    }
  })

}

let checkPermission = function(localApi) {

  chrome.permissions.contains({
    permissions: ['tabs'],
    origins: [localApi]
  }, function(result) {
    if (result) {
      // The extension has the permissions.
      console.log('has the permissions')
    } else {
      // The extension doesn't have the permissions.
      console.log('doesn\'t have the permissions')
    }
  });
}

$(function () {
  $(document).ready(restore_options())
  $('tbody').on('keydown', 'input', options.changeShortcuts)
  $('div.options').on('change', 'select', function () {
      options.changeKey($(this))
    }
  )
  //document.querySelector('#save').addEventListener('click', setPermission);
  document.getElementById('save').addEventListener('click', saveOptions)
  document.getElementById('reset').addEventListener('click', reset)
})

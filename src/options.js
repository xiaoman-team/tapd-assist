
let defaultOptions = tapdDefaultOptions
let defaultShortcuts = tapdDefaultShortcuts

let options = {
  changeKey: function (ele) {
    let id = ele.attr('id');
    let val = ele.find('option:selected').val();
    let text;
    for (let i = 0; i < defaultOptions.length; i++) {
      let item = defaultOptions[i];
      if (item.id == id) {
        item.options.forEach(function (e) {
          if (e.value == val) {
            text = e.description;
          }
        });
      }

    }
    ele.next().text(text);
  },
  changeShortcuts: function (event) {
    let key = '';
    event.preventDefault();
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      if (event.ctrlKey) {
        key = 'Ctrl';
      } else if (event.altKey) {
        key = 'Alt';
      } else if (event.metaKey) {
        key = 'Meta';
      } else if (event.shiftKey) {
        key = 'Shift';
      }
      $(this).val(key + '+' + String.fromCharCode(event.keyCode));
    } else if (event.keyCode) {
      let textKey = String.fromCharCode(event.keyCode);
      $(this).val(textKey);
    }
  }
}

let save_options = () => {

  let select = $('select');
  let eleShortcuts = $('tbody input');
  let options = {};
  let objShortcuts = {};

  for (let i = 0; i < select.length; i++) {
    let id = select.eq(i).attr('id');
    options[id] = select.eq(i).val();
  }

  for (let i = 0; i < eleShortcuts.size(); i++) {
    objShortcuts[eleShortcuts[i].getAttribute('class')] = eleShortcuts[i].value;
  }
  options.shortcuts = objShortcuts;

  chrome.storage.local.set({
    localOptions: options
  }, function () {
    let status = document.getElementById('status');
    status.textContent = 'Updated';
    status.style.background = '#39a1f4';
    setTimeout(function () {
      status.textContent = '';
      status.style.background = '#fff';
    }, 750);
  });
}

let restore_options = () => {

  chrome.storage.local.get('localOptions', function (result) {
    let local = result.localOptions;

    for (let i = 0; i < defaultOptions.length; i++) {
      let item = defaultOptions[i];
      let id = item.id;
      let eleOptionDiv = $('<div></div>').attr('class', 'option');
      let eleTitle = $('<span></span>').text(item.title);
      let eleSelect = $('<select></select>').attr('id', id);
      let eleDescDiv = $('<div></div>').attr('class', 'desc')

      $('.options').append(eleOptionDiv);
      eleOptionDiv.append(eleTitle);
      eleOptionDiv.append(eleSelect);
      for (let k = 0; k < item.options.length; k++) {
        let eleOption = $('<option></option>').val(item.options[k].value).text(item.options[k].text);
        eleSelect.append(eleOption);
      }

      //下拉框的value
      let key;
      if (typeof(local) == 'undefined') {
        key = item.options[0].value;
        eleSelect.val(key);
      } else {
        key = local[id];
        if (typeof(key) != 'undefined') {
          eleSelect.val(key);
        } else {
          eleSelect.val(item.options[0].value);
          key = item.options[0].value;
        }
      }

      //根据value展示对应的描述
      let description;
      for (let j = 0; j < item.options.length; j++) {
        if (item.options[j].value == key) {
          description = item.options[j].description;
        }
      }

      eleDescDiv.text(description);
      eleOptionDiv.append(eleDescDiv);
    }

    for (let i = 0; i < defaultShortcuts.length; i++) {
      let item = defaultShortcuts[i];
      let tr = $('<tr></tr>');
      $('tbody').append(tr);
      for (let j = 0; j < 3; j++) {
        let td = $('<td></td>');
        switch (j) {
          case 0:
            td.text(item.title);
            break;
          case 1:
            let input = $('<input>').addClass(item.key);
            if (typeof(local) == 'undefined') {
              input.val(item.value);
            } else {
              if (typeof(local.shortcuts[item.key]) == 'undefined') {
                input.val(item.value);
              } else {
                input.val(local.shortcuts[item.key]);
              }
            }
            td.append(input);
            break;
          case 2:
            td.text(item.description);
            break;
          default :

        }
        tr.append(td);
      }
    }
  });
}


let reset = () => {
  let select = $('select');
  for (let i = 0; i < select.length; i++) {
    let ele = select.eq(i);
    let id = ele.attr('id');
    defaultOptions.forEach(function (e) {
      if (e.id == id) {
        ele.val(e.options[0].value);
        ele.next('.desc').text(e.options[0].description);
      }
    });
  }

  let input = $('tbody input');
  for (let i = 0; i < input.length; i++) {
    let ele = input.eq(i);
    let key = ele.attr('class');

    for (let j = 0; j < defaultShortcuts.length; j++) {
      let arr = defaultShortcuts[j];
      if (arr.key == key) {
        ele.val(arr.value);
        break;
      }
    }
  }
  save_options();
}

let changeKey = (ele) => {
  let id = ele.attr('id');
  let val = ele.find('option:selected').val();
  let text;
  for (let i = 0; i < defaultOptions.length; i++) {
    let item = defaultOptions[i];
    if (item.id == id) {
      item.options.forEach(function (e) {
        if (e.value == val) {
          text = e.description;
        }
      });
    }

  }
  ele.next().text(text);
}

$(function () {
  $(document).ready(restore_options());
  $('tbody').on('keydown', 'input', options.changeShortcuts);
  $('div.options').on('change', 'select', function () {
      options.changeKey($(this))
    }
  );
  document.getElementById('save').addEventListener('click', save_options);
  document.getElementById('reset').addEventListener('click', reset);
})


let defaultOptions = [
    {
        title: '驱动键',
        id: 'driver',
        options: [
            {
                value: 'alt',
                text: 'Alt',
                description: '按下和弹起Alt切换左侧项目列表，或者快击。长按切出帮助页面。'
            }, {
                value: 'ctrl',
                text: 'Ctrl',
                description: '按下和弹起Ctrl切换左侧项目列表，或者快击。长按切出帮助页面。'
            }, {
                value: 'meta',
                text: 'Meta',
                description: '按下和弹起Meta切换左侧项目列表，或者快击。长按切出帮助页面。'
            }
        ]
    }, {
        title: '项目跳转驱动键',
        id: 'projectDriver',
        options: [
            {
                value: 'alt',
                text: 'Alt',
                description: '按下Alt+Num，跳转到指定项目'
            }, {
                value: 'ctrl',
                text: 'Ctrl',
                description: '按下Ctrl+Num，跳转到指定项目'
            }, {
                value: 'meta',
                text: 'Meta',
                description: '按下Meta+Num，跳转到指定项目'
            }
        ]
    }, {
        title: '项目列表排序',
        id: 'sort',
        options: [
            {
                value: 'default',
                text: '原生',
                description: '保持原生的项目列表顺序'
            },{
                value: 'id_desc',
                text: '按照ID倒叙排序',
                description: '按照项目ID倒序重新排列项目列表'
            }
        ]
    }
];

let defaultShortcuts = [
    {
        title: '编辑需求或缺陷',
        key: 'edit_require',
        value: 'Alt+E',
        description: 'test'
    },{
        title: '快速定位到搜索框',
        key: 'search',
        value: 'Alt+S',
        description: ''
    },{
        title: '需求和缺陷切换全屏',
        key: 'full_screen',
        value: 'Alt+F',
        description: ''
    },{
        title: '最近的需求报表',
        key: 'recent_require_report',
        value: 'Alt+R',
        description: ''
    },{
        title: '最近的自定义缺陷报表',
        key: 'recent_bug_report',
        value: 'Alt+B',
        description: ''
    },{
        title: '跳转到上一页',
        key: 'prev_page',
        value: 'Alt+L',
        description: ''
    },{
        title: '跳转到下一页',
        key: 'next_page',
        value: 'Alt+H',
        description: ''
    },{
        title: '打开工作台',
        key: 'open_workbench',
        value: 'Alt+W',
        description: ''
    },{
        title: '打开消息中心',
        key: 'open_message',
        value: 'Alt+M',
        description: ''
    },{
        title: '创建项目',
        key: 'create_project',
        value: 'Alt+C',
        description: ''
    },{
        title: '项目成员列表',
        key: 'member_list',
        value: 'Alt+E',
        description: ''
    },{
        title: '显示当前帮助信息',
        key: 'help',
        value: 'Shift+?',
        description: ''
    }
];

let options = {
    changeKey: function (ele) {
        let id = ele.attr('id');
        let val = ele.find('option:selected').val();
        let text;
        for(let i=0; i<defaultOptions.length; i++) {
            let item = defaultOptions[i];
            if(item.id == id) {
                item.options.forEach(function(e){
                    if(e.value == val) {
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
        if (event.ctrlKey||event.altKey||event.metaKey||event.shiftKey) {
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
        } else if (event.keyCode){
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

    for (let i=0; i<select.length; i++) {
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

    chrome.storage.local.get('localOptions', function(result) {
        let local = result.localOptions;

        for(let i=0; i<defaultOptions.length; i++) {
            let item = defaultOptions[i];
            let id = item.id;
            let eleOptionDiv = $('<div></div>').attr('class', 'option');
            let eleTitle = $('<span></span>').text(item.title);
            let eleSelect = $('<select></select>').attr('id', id);
            let eleDescDiv = $('<div></div>').attr('class', 'desc')

            $('.options').append(eleOptionDiv);
            eleOptionDiv.append(eleTitle);
            eleOptionDiv.append(eleSelect);
            for(let k=0; k<item.options.length; k++) {
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
                if(typeof(key) != 'undefined') {
                    eleSelect.val(key);
                } else {
                    eleSelect.val(item.options[0].value);
                    key = item.options[0].value;
                }
            }

            //根据value展示对应的描述
            let description;
            for (let j=0; j<item.options.length; j++) {
                if(item.options[j].value == key) {
                    description = item.options[j].description;
                }
            }

            eleDescDiv.text(description);
            eleOptionDiv.append(eleDescDiv);
        }

        for(let i=0; i<defaultShortcuts.length; i++) {
            let item = defaultShortcuts[i];
            let tr = $('<tr></tr>');
            $('tbody').append(tr);
            for(let j=0; j<3; j++) {
                let td = $('<td></td>');
                switch (j) {
                    case 0:
                        td.text(item.title);
                        break;
                    case 1:
                        let input = $('<input>').addClass(item.key);
                        if(typeof(local) == 'undefined') {
                            input.val(item.value);
                        } else {
                            input.val(local.shortcuts[item.key]);
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
    for(let i=0; i<select.length; i++) {
        let ele = select.eq(i);
        let id = ele.attr('id');
        defaultOptions.forEach(function(e){
            if(e.id == id) {
                ele.val(e.options[0].value);
                ele.next('.desc').text(e.options[0].description);
            }
        });
    }

    let input = $('tbody input');
    for(let i=0; i<input.length; i++) {
        let ele = input.eq(i);
        let key = ele.attr('class');

        for(let j=0; j<defaultShortcuts.length; j++) {
            let arr = defaultShortcuts[j];
            if(arr.key == key) {
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
    for(let i=0; i<defaultOptions.length; i++) {
        let item = defaultOptions[i];
        if(item.id == id) {
            item.options.forEach(function(e){
                if(e.value == val) {
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
    $('div.options').on('change', 'select', function(){
        options.changeKey($(this))
        }
    );
    document.getElementById('save').addEventListener('click', save_options);
    document.getElementById('reset').addEventListener('click', reset);

})

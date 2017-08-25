/**
 * Created by niefang on 17/8/24.
 */
let tapdDefaultOptions = [
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

let tapdDefaultShortcuts = [
  {
    title: '编辑需求或缺陷',
    key: 'edit_story',
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
  }, {
    title: '显示当前帮助信息',
    key: 'help',
    value: 'Shift+?',
    description: ''
  //}
  },{
    title: '复制标题与链接',
    key: 'copy_title_link',
    value: 'Ctrl+C|Meta+C',
    description: ''
  },{
    title: '复制标题',
    key: 'copy_title',
    value: 'Alt+C',
    description: ''
  },{
    title: '放大',
    key: 'zoom_out',
    value: 'Alt+Equal',
    description: ''
  },{
    title: '缩小',
    key: 'zoom_in',
    value: 'Alt+Minus',
    description: ''
  }
];

let tapdAssistOption = {
  getShortcuts: function() {
    let shortcutsMap = new Map();
    return new Promise(function(resolve){
      chrome.storage.local.get('localOptions', function(result){
        let local = result.localOptions;
        for(let i=0; i<tapdDefaultOptions.length; i++) {
          let item = tapdDefaultOptions[i];
          let id = item.id;
          let key;
          if (typeof(local) == 'undefined') {
            key = item.options[0].value;
          } else {
            key = local[id];
            if(typeof(key) == 'undefined') {
              key = item.options[0].value;
            }
          }
          shortcutsMap.set(item.id, key);
        }

        for(let i=0; i<tapdDefaultShortcuts.length; i++) {
          let item = tapdDefaultShortcuts[i];
          let value = '';
          if(typeof(local) == 'undefined') {
            value = item.value;
          } else {
            if (typeof(local.shortcuts[item.key]) == 'undefined') {
              value = item.value;
            } else {
              value = local.shortcuts[item.key];
            }
          }
          shortcutsMap.set(item.key, value);
        }
        resolve(shortcutsMap);
      });
    });

  }
}
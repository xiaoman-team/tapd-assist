let patchURLLink = function (root) {
  let replaceLinkInText = function (node) {
    let text = node.data;
    let splits = text.split(/[ \t\r\n]+/);

    let children = [];
    let index0 = 0;
    splits.forEach(function (split) {
      let index = text.indexOf(split, index0);
      if (index < 0) { // should not
        console.error('[tapd_assist] find sub string failed', text, split);
        return;
      }
      let url;
      try {
        url = new URL(split);
      } catch (err) {
        return;
      }

      if (index > index0) {
        let str = text.substring(index0, index);
        children.push(document.createTextNode(str));
      }

      let a = document.createElement('a');
      a.href = split;
      a.textContent = decodeURIComponent(split);
      if (['https:', 'http:'].indexOf(a.protocol)) {
        a.title = '点击打开' + a.protocol + '//协议';
      }
      children.push(a);

      index0 = index + split.length;
    });

    if (children.length === 0) {
      return; // no matched url
    }

    let span = document.createElement('span');
    children.forEach(function (child) {
      span.appendChild(child);
    });

    if (text.length > index0) {
      let str = text.substring(index0);
      span.appendChild(document.createTextNode(str));
    }
    return span;
  };


  let detectAndReplaceLink;

  detectAndReplaceLink = function (parent) {
    let childNodes = parent.childNodes;
    childNodes.forEach(function (node) {
      detectAndReplaceLink(node);

      if (parent.nodeName.toLowerCase() !== 'a' && node.nodeName.toLowerCase() === '#text') {
        let newNode = replaceLinkInText(node);
        if (newNode) {
          parent.insertBefore(newNode, node);
          parent.removeChild(node);
        }
      }
    });
  };

  detectAndReplaceLink(root);
}

let PROJECT_SHORTCUTS = {};

let patchProjects = function () {
  let root = document.getElementById('myprojects-list');
  if (!root) {
    console.warn('[tapd_assist] #myprojects-list not found');
    return;
  }

  let projects = $(root).children('li');
  let shortcuts = {};
  for (let i = 0; i < projects.length; i++) {
    let index = i + 1;
    let li = projects[i];
    if ($(li).hasClass('iamloaded')) {
      continue;
    }
    li.style.position = 'relative';

    let span = document.createElement('span');
    span.className = 'assist-project-index';
    span.textContent = index;
    li.appendChild(span);

    let anchor = $(li).children('a')[0];
    if (anchor) {
      anchor.setAttribute('project-index', i + 1);
      shortcuts['Alt+' + index] = function () {
        anchor.click();
        span.textContent = '\u2713';
        li.style.backgroundColor = '#303236';
      }
    }
  }
  PROJECT_SHORTCUTS = shortcuts;
}

patchProjects();

let bodyDOMObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.target.id === 'General_div' && mutation.addedNodes.length) {
      let root = document.getElementById('description_div');
      if (root) {
        patchURLLink(root);
      } else {
        console.warn('[tapd_assist] #description_div not found');
      }
      patchProjects();
    } else if (mutation.target.id === 'myprojects-list' && mutation.addedNodes.length) {
      patchProjects();
    }
  });
});

$('.comment_con_main').toArray().forEach(patchURLLink);

bodyDOMObserver.observe(document.body, {
  childList: true,
  subtree: true
});

function getProjectId(url) {
  if (url === undefined) {
    url = window.location.href
  }
  let re = new RegExp('^https://www\\.tapd\\.cn//?([0-9]+)/.*$');
  let m = re.exec(url);
  if (m) {
    return m[1]
  }
}

function getProjectUrl(path) {
  let projectId = getProjectId();
  if (projectId) {
    return 'https://www.tapd.cn/' + projectId + path;
  }
}

function ajax(options) {
  return $.ajax(Object.assign({
    xhr: function () {
      let xhr = jQuery.ajaxSettings.xhr();
      let setRequestHeader = xhr.setRequestHeader;
      xhr.setRequestHeader = function (name, value) {
        if (name == 'X-Requested-With') return;
        setRequestHeader.call(this, name, value);
      }
      return xhr;
    },
  }, options));
}

let dialog
chrome.extension.sendRequest({
  cmd: 'readFile',
  url: chrome.extension.getURL('tpls/help_panel.tpl'),
}, function (data) {
  let div = $('<div />')
  div.html(data)       
  dialog = div.find('#tapdAssistHelpPanel')
  dialog.hide()
  dialog.on('click.closeModal', '[data-dismiss="modal"]', function () {
    dialog.hide()
  })
  $('body').append(dialog)
})

let menuLock = false

const SHORTCUTS = {
  'Alt+Escape': function () {
    if (!$('body').hasClass('.left-tree-close')) {
      menuLock = true
    }
  },
  'Alt+C': '#create-project',
  'Alt+W': '#top_nav_worktable',
  'Alt+N': '#top_nav_worktable_msg',
  'Alt+M': function () {
    let projectId = getProjectId();
    if (projectId) {
      window.location.href = getProjectUrl('/settings/team');
    }
  },
  'Alt+R': function () {
    let projectId = getProjectId();
    if (projectId) {
      let defaultAnchor = getProjectUrl('/prong/stories/stats_charts');
      ajax({
        url: getProjectUrl('/prong/stories/stats_charts')
      }).then(function (data) {
        let htmlDoc = $.parseHTML(data);
        let hrefs = $(htmlDoc)
          .find('#custom-statistics ul.custom-statistic-list li a')
          .toArray()
          .map(a => a.getAttribute('href'))
        let anchor = hrefs[0];
        if (anchor) {
          window.location.href = anchor;
        } else {
          window.location.href = defaultAnchor;
        }
      }, function (err) {
        window.location.href = defaultAnchor;
      })
    }
  },
  'Alt+B': function () {
    let projectId = getProjectId();
    if (projectId) {
      let defaultAnchor = getProjectUrl('/bugtrace/bugreports/stat_general/general/systemreport-1000000000000000008');
      ajax({
        url: getProjectUrl('/bugtrace/bugreports/index_simple')
      }).then(function (data) {
        let htmlDoc = $.parseHTML(data);
        let hrefs = $(htmlDoc)
          .find('.tbox-content ul li a')
          .toArray()
          .map(a => a.getAttribute('href'))
          .filter(href => href.indexOf('/bugtrace/bugreports/stat_general/general/customreport-') >= 0)
        let anchor = hrefs[0];
        if (anchor) {
          window.location.href = anchor;
        } else {
          window.location.href = defaultAnchor;
        }
      }, function (err) {
        window.location.href = defaultAnchor;
      })
    }
  },
  'Alt+H|Alt+ArrowLeft': function () {
    let element = $('.page-btn.page-prev');
    let anchor = element.children('a');
    if (anchor.length) {
      element = anchor;
    }
    let element1 = element[0];
    if (element1) {
      element1.click();
    }
  },
  'Alt+L|Alt+ArrowRight': function () {
    let element = $('.page-btn.page-next');
    let anchor = element.children('a');
    if (anchor.length) {
      element = anchor;
    }
    let element1 = element[0];
    if (element1) {
      element1.click();
    }
  },
  'Alt+F': function (e) {
    e.preventDefault();
    $('#search-keyword').focus().select();
  },
  'Shift+Slash': function () {
    dialog.show()
  },
  'Alt': function () {
    dialog.show()
    $('body').removeClass('left-tree-close')
  },
  'Alt+K': function () {
    chrome.storage.sync.get('shortcut', function (val) {
      console.log(val)
    })
  },
  'Ctrl+C|Meta+C': function (e, keys) {
    let event = document.createEvent("CustomEvent");
    event.initCustomEvent('try:copy:title', true, true, { // failed to pass data, why?
      keys: keys,
      event: e
    })
    document.dispatchEvent(event);
  }
};

let executeShortcuts = function (shortcuts, e) {
  let fnKeys = ['alt', 'ctrl', 'meta', 'shift']
  let downFnKeys = fnKeys.filter(function (f) {
    return e[f + 'Key']
  })

  let code = e.code.toLowerCase().replace(/^(key|digit)/, '');
  let isFnKeys = ['alt', 'control', 'meta', 'shift'].some(function (f) {
    return code.startsWith(f)
  })

  let shortcutMap = {};
  for (let key in shortcuts) {
    let handler = shortcuts[key];
    let keys = key.split('|');
    keys.forEach(function (k) {
      let splits = k.toLowerCase().split('+').map(function (split) {
        return split.trim()
      }).sort().join('+');
      shortcutMap[splits] = handler;
    })
  }

  let downKeys = downFnKeys
  if (!isFnKeys) {
    downKeys = downKeys.concat(code)
  }
  downKeys = downKeys.slice().sort().join('+')

  // console.log('downKeys', downKeys)

  let handler = shortcutMap[downKeys]
  if (!handler) {
    return;
  }

  if (typeof handler === 'string') {
    let element = $(handler)[0];
    if (element) {
      element.click();
    } else {
      console.warn('Invalid shortcut handler: document.getElementById empty', handler);
    }
  } else if (typeof handler === 'function') {
    handler(e, downKeys);
  } else {
    console.warn('Invalid shortcut handler', typeof handler, handler);
  }
}

document.addEventListener('keydown', function (e) {
  executeShortcuts(SHORTCUTS, e);
  executeShortcuts(PROJECT_SHORTCUTS, e);
});

document.addEventListener('keyup', function (e) {
  if (e.key === 'Alt') {
    dialog.hide()
    if (!menuLock) {
      $('body').addClass('left-tree-close minimenu')
    }
  }
})

// bodyDOMObserver.disconnect();

chrome.extension.sendMessage({
  type: 'setTabIcon',
  path: {
    "16": "image/main_icon_16.png",
    "24": "image/main_icon_24.png",
    "32": "image/main_icon_32.png"
  }
});

function injectScript(file) {
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file);
  document.body.appendChild(script);
}
injectScript(chrome.extension.getURL('/page_inject.js'));

let patchPage = function (root) {
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

let bodyDOMObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.target.id === 'General_div' && mutation.addedNodes.length) {
      let root = document.getElementById('description_div');
      if (root) {
        patchPage(root);
      } else {
        console.warn('[tapd_assist] #description_div not found');
      }
    }
    // console.log(mutation.type, mutation);
  });    
});

bodyDOMObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// bodyDOMObserver.disconnect();

chrome.extension.sendMessage({
  type: 'setTabIcon',
  path: {
      "16": "image/main_icon_16.png",
      "24": "image/main_icon_24.png",
      "32": "image/main_icon_32.png"
  }
});


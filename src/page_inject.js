let patchPage = function () {
  let detectAndReplaceLinkInText = function (node) {
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
      if (['https://', 'http://'].indexOf(a.origin)) {
        a.title = '点击打开协议' + a.origin;
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
  
  detectAndReplaceLink = function (root) {
    let childNodes = root.childNodes;
    childNodes.forEach(function (node) {
      detectAndReplaceLink(node);

      if (node.nodeName === '#text') {
        let newNode = detectAndReplaceLinkInText(node);
        if (newNode) {
          root.insertBefore(newNode, node);
          root.removeChild(node);
        }
      }
    });
  };

  let container = $(".description_div.editor-content")[0];
  if (!container) {
    console.log('[tapd_assist] .description_div.editor-content not found');
    return;
  }
  detectAndReplaceLink(container);

}

window.onload = patchPage;

setTimeout(patchPage, 2 * 1000);
setTimeout(patchPage, 6 * 1000);

chrome.extension.sendMessage({
  type: 'setTabIcon',
  path: {
      "16": "image/main_icon_16.png",
      "24": "image/main_icon_24.png",
      "32": "image/main_icon_32.png"
  }
});


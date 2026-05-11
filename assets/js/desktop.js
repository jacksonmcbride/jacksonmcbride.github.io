(function () {
  if (typeof openWindow !== 'function') return;

  function isPostLink(a) {
    const href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '/') return false;
    if (href.indexOf('/tag/') === 0) return false;
    return /^\/\d{4}\//.test(href);
  }

  function openPostInWindow(url, title) {
    fetch(url)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const content = doc.querySelector('.post_content');
        const body = content ? content.outerHTML : '<p>Could not load post.</p>';
        openWindow({
          title: title || 'Post',
          body: body,
          x: EXPLORER_LEFT(), y: POST_TOP, w: 560,
          icon: '/assets/img/icons/file-16.png'
        });
      })
      .catch(function () {
        openWindow({ title: 'Error', body: '<p>Failed to load post.</p>', x: 120, y: 80, w: 320 });
      });
  }

  const EXPLORER_TOP = 60;
  const EXPLORER_LEFT = function () { return Math.max(20, (window.innerWidth - 800) / 2); };
  const POST_TOP = 340;

  function openExplorer() {
    fetch('/explorer/')
      .then(function (res) { return res.text(); })
      .then(function (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const wrap = doc.querySelector('.wrapper');
        if (!wrap) return;
        wrap.setAttribute('data-explorer-window', '');
        wrap.style.position = 'fixed';
        wrap.style.margin = '0';
        wrap.style.top = EXPLORER_TOP + 'px';
        wrap.style.left = EXPLORER_LEFT() + 'px';
        wrap.style.zIndex = '100';
        const closeBtn = wrap.querySelector('button[aria-label="Close"]');
        if (closeBtn) closeBtn.addEventListener('click', function () {
          if (window.unregisterWindow) window.unregisterWindow(wrap);
          wrap.remove();
        });
        document.body.appendChild(wrap);
        if (window.makeDraggable) window.makeDraggable(wrap);
        const titleEl = wrap.querySelector('.title-bar-text');
        const winTitle = titleEl ? titleEl.textContent.trim() : 'My Computer';
        if (window.registerWindow) window.registerWindow(wrap, { title: winTitle, icon: '/assets/img/icons/computer-16.png' });
        if (window.bringToFront) window.bringToFront(wrap);
      });
  }

  function updateExplorerView(explorerWin, url) {
    const fetchUrl = url === '/' ? '/explorer/' : url;
    fetch(fetchUrl)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newWrap = doc.querySelector('.wrapper');
        if (!newWrap) return;
        ['.title-bar-text', '.tag_list', '.post_list', '.post_total'].forEach(function (sel) {
          const from = newWrap.querySelector(sel);
          const to   = explorerWin.querySelector(sel);
          if (from && to) to.replaceWith(from);
        });
      });
  }

  function openMyDocs() {
    fetch('/me/')
      .then(function (res) { return res.text(); })
      .then(function (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const content = doc.querySelector('.post_content');
        const body = content ? content.outerHTML : '<p>Could not load.</p>';
        openWindow({
          title: 'About Me',
          body: body,
          x: 160, y: 80, w: 560,
          icon: '/assets/img/icons/mydocs-32.png'
        });
      });
  }

  function openIE() {
    const body =
      '<div style="background: silver; padding: 4px 6px; margin: -8px -8px 10px -8px; border-bottom: 1px solid grey; display: flex; align-items: center; gap: 6px;">' +
        '<label for="ie-addr">Address:</label>' +
        '<input id="ie-addr" type="text" value="bookmarks://jacksonmcbride" readonly style="flex:1;">' +
      '</div>' +
      '<h3 style="margin: 0 0 8px 0;">Bookmarks</h3>' +
      '<ul>' +
        '<li><a href="https://www.linkedin.com/in/jackson-r-mcbride" target="_blank" rel="noopener">LinkedIn &mdash; Jackson McBride</a></li>' +
        '<li><a href="https://github.com/jacksonmcbride" target="_blank" rel="noopener">GitHub &mdash; jacksonmcbride</a></li>' +
      '</ul>';
    openWindow({
      title: 'Internet Explorer',
      body: body,
      x: 200, y: 110, w: 480,
      icon: '/assets/img/icons/ie-16.png'
    });
  }

  function openRecycle() {
    openWindow({
      title: 'Recycle Bin',
      body: '<p style="text-align: center; padding: 28px 10px;">The Recycle Bin is empty.</p>',
      x: 220, y: 140, w: 340, h: 170,
      icon: '/assets/img/icons/recyclebin-16.png'
    });
  }

  function openNotepad() {
    const text =
      "Welcome to Jackson's Win98 desktop.\n\n" +
      "Click around:\n\n" +
      "  - \"My Computer\" browses my posts by folder.\n" +
      "  - Drag any window by its title bar.\n" +
      "  - Minimize with the \"-\" to send to the taskbar.\n" +
      "  - Click a taskbar button to bring a window back.\n\n" +
      "For the real content, head into My Computer.\n";
    openWindow({
      title: 'README.txt - Notepad',
      body: '<pre style="margin:0; white-space: pre-wrap; font-family: monospace;">' + text + '</pre>',
      x: 240, y: 180, w: 460, h: 280,
      icon: '/assets/img/icons/notepad-16.png'
    });
  }

  const iconHandlers = {
    'open-explorer': openExplorer,
    'open-mydocs':   openMyDocs,
    'open-ie':       openIE,
    'open-recycle':  openRecycle,
    'open-notepad':  openNotepad
  };

  document.addEventListener('click', function (e) {
    const icon = e.target.closest('.desktop-icon');
    if (icon && iconHandlers[icon.id]) {
      e.preventDefault();
      iconHandlers[icon.id]();
      return;
    }
    const folderLink = e.target.closest('a[href^="/tag/"], a[href="/"]');
    if (folderLink) {
      const explorerWin = folderLink.closest('[data-explorer-window]');
      if (explorerWin) {
        e.preventDefault();
        updateExplorerView(explorerWin, folderLink.getAttribute('href'));
        return;
      }
    }
    const a = e.target.closest('a');
    if (!a) return;
    if (!isPostLink(a)) return;
    e.preventDefault();
    const title = a.getAttribute('title') || a.textContent.trim();
    openPostInWindow(a.href, title);
  });

  if (window.location.pathname === '/' || window.location.pathname === '') {
    openExplorer();
  }
})();

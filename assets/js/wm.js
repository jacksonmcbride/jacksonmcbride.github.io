(function () {
  let zCounter = 100;
  const windows = new Set();
  const taskbarBtns = new Map();
  const ANIM_MS = 180;

  function topVisible() {
    let top = null;
    let topZ = -1;
    windows.forEach(function (w) {
      if (w.style.display === 'none') return;
      const z = parseInt(w.style.zIndex || 0);
      if (z > topZ) { topZ = z; top = w; }
    });
    return top;
  }

  function updateTaskbarStates() {
    const top = topVisible();
    taskbarBtns.forEach(function (btn, win) {
      btn.classList.toggle('pressed', win === top && win.style.display !== 'none');
    });
  }

  function bringToFront(win) {
    zCounter += 1;
    win.style.zIndex = zCounter;
    windows.forEach(function (w) {
      const tb = w.querySelector('.title-bar');
      if (tb) tb.classList.toggle('inactive', w !== win);
    });
    updateTaskbarStates();
  }

  function getCollapseTransform(win) {
    const btn = taskbarBtns.get(win);
    if (!btn) return null;
    const wr = win.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    if (wr.width === 0 || wr.height === 0) return null;
    const sx = br.width / wr.width;
    const sy = br.height / wr.height;
    const tx = (br.left + br.width / 2) - (wr.left + wr.width / 2);
    const ty = (br.top  + br.height / 2) - (wr.top  + wr.height / 2);
    return 'translate(' + tx + 'px, ' + ty + 'px) scale(' + sx + ', ' + sy + ')';
  }

  function minimizeWindow(win) {
    const t = getCollapseTransform(win);
    if (!t) {
      win.style.display = 'none';
      updateTaskbarStates();
      return;
    }
    win.style.transformOrigin = 'center center';
    win.style.transition = 'transform ' + ANIM_MS + 'ms ease-out, opacity ' + ANIM_MS + 'ms ease-out';
    win.style.transform = t;
    win.style.opacity = '0';
    setTimeout(function () {
      win.style.display = 'none';
      win.style.transition = '';
      win.style.transform = '';
      win.style.opacity = '';
      updateTaskbarStates();
    }, ANIM_MS);
  }

  function restoreWindow(win) {
    win.style.display = '';
    const t = getCollapseTransform(win);
    if (!t) {
      bringToFront(win);
      return;
    }
    win.style.transformOrigin = 'center center';
    win.style.transition = 'none';
    win.style.transform = t;
    win.style.opacity = '0';
    // force reflow so the next style change animates
    win.offsetWidth;
    win.style.transition = 'transform ' + ANIM_MS + 'ms ease-out, opacity ' + ANIM_MS + 'ms ease-out';
    win.style.transform = '';
    win.style.opacity = '';
    setTimeout(function () {
      win.style.transition = '';
    }, ANIM_MS);
    bringToFront(win);
  }

  function registerWindow(win, opts) {
    opts = opts || {};
    windows.add(win);
    const bar = document.querySelector('.taskbar-windows');
    if (!bar) return;
    const btn = document.createElement('button');
    btn.className = 'taskbar-window';
    btn.type = 'button';
    btn.title = opts.title || 'Window';
    if (opts.icon) {
      const img = document.createElement('img');
      img.src = opts.icon;
      img.alt = '';
      btn.appendChild(img);
    }
    const span = document.createElement('span');
    span.textContent = opts.title || 'Window';
    btn.appendChild(span);
    btn.addEventListener('click', function () {
      if (win.style.display === 'none') {
        restoreWindow(win);
        return;
      }
      if (win === topVisible()) {
        minimizeWindow(win);
      } else {
        bringToFront(win);
      }
    });
    bar.appendChild(btn);
    taskbarBtns.set(win, btn);
    updateTaskbarStates();
  }

  function unregisterWindow(win) {
    windows.delete(win);
    const btn = taskbarBtns.get(win);
    if (btn) btn.remove();
    taskbarBtns.delete(win);
    updateTaskbarStates();
  }

  function makeDraggable(win) {
    const titleBar = win.querySelector('.title-bar');
    if (!titleBar) return;
    titleBar.style.cursor = 'move';
    titleBar.style.userSelect = 'none';
    titleBar.addEventListener('mousedown', function (e) {
      if (e.target.closest('.title-bar-controls')) return;
      e.preventDefault();
      bringToFront(win);
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = win.getBoundingClientRect();
      function onMove(ev) {
        win.style.left = (rect.left + ev.clientX - startX) + 'px';
        win.style.top  = (rect.top  + ev.clientY - startY) + 'px';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  window.makeDraggable = makeDraggable;
  window.bringToFront = bringToFront;
  window.registerWindow = registerWindow;
  window.unregisterWindow = unregisterWindow;
  window.minimizeWindow = minimizeWindow;
  window.restoreWindow = restoreWindow;

  window.openWindow = function (opts) {
    opts = opts || {};
    const title = opts.title || 'Untitled';
    const body  = opts.body  || '';
    const x = opts.x != null ? opts.x : 80;
    const y = opts.y != null ? opts.y : 80;
    const w = opts.w != null ? opts.w : 320;
    const h = opts.h;
    const icon = opts.icon || '/assets/img/icons/file-16.png';

    const win = document.createElement('div');
    win.className = 'window';
    win.style.position = 'fixed';
    win.style.left  = x + 'px';
    win.style.top   = y + 'px';
    win.style.width = w + 'px';
    if (h != null) win.style.height = h + 'px';

    win.innerHTML =
      '<div class="title-bar">' +
        '<div class="title-bar-text"></div>' +
        '<div class="title-bar-controls">' +
          '<button aria-label="Minimize"></button>' +
          '<button aria-label="Maximize"></button>' +
          '<button aria-label="Close"></button>' +
        '</div>' +
      '</div>' +
      '<div class="window-body"></div>';

    win.querySelector('.title-bar-text').textContent = title;
    win.querySelector('.window-body').innerHTML = body;

    win.querySelector('button[aria-label="Close"]').addEventListener('click', function () {
      unregisterWindow(win);
      win.remove();
    });
    win.querySelector('button[aria-label="Minimize"]').addEventListener('click', function () {
      minimizeWindow(win);
    });
    win.querySelector('button[aria-label="Maximize"]').addEventListener('click', function () {
      if (win.dataset.maximized === '1') {
        win.style.left   = win.dataset.prevLeft;
        win.style.top    = win.dataset.prevTop;
        win.style.width  = win.dataset.prevWidth;
        win.style.height = win.dataset.prevHeight || 'auto';
        win.dataset.maximized = '';
      } else {
        win.dataset.prevLeft   = win.style.left;
        win.dataset.prevTop    = win.style.top;
        win.dataset.prevWidth  = win.style.width;
        win.dataset.prevHeight = win.style.height;
        win.style.left   = '0';
        win.style.top    = '0';
        win.style.width  = '100vw';
        win.style.height = '100vh';
        win.dataset.maximized = '1';
      }
    });

    win.addEventListener('mousedown', function () { bringToFront(win); });

    document.body.appendChild(win);
    makeDraggable(win);
    registerWindow(win, { title: title, icon: icon });
    bringToFront(win);
    return win;
  };
})();

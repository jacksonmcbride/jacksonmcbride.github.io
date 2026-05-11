(function () {
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function updateClock() {
    const el = document.querySelector('.taskbar-clock');
    if (!el) return;
    const now = new Date();
    let h = now.getHours();
    const m = pad(now.getMinutes());
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    el.textContent = h + ':' + m + ' ' + ampm;
  }

  updateClock();
  setInterval(updateClock, 30000);
})();

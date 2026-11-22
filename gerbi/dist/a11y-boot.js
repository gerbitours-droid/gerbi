// Accessibility menu settings (IS 5568). A classic script loaded in <head> before the stylesheets, so the classes on
// <html> are set before the first paint (no flash). Settings live in localStorage on this device only — no tracking.
// The menu itself is a11y-widget.mjs; the statement page (legal.mjs) uses the same store via window.gerbiA11y.
(function () {
  var KEY = 'gerbi-a11y-v1', OLD = 'gerbi-display-prefs-v1', MAX_TEXT = 3;
  var FLAGS = { contrast: 'a11y-contrast', dark: 'a11y-dark', gray: 'a11y-gray', links: 'a11y-links', headings: 'a11y-headings', font: 'a11y-font', still: 'a11y-still', cursor: 'a11y-cursor', spacing: 'a11y-spacing', focus: 'a11y-focus' };
  var TEXT = ['', 'a11y-text-lg', 'a11y-text-xl', 'a11y-text-xxl'];
  var root = document.documentElement;

  // Only known keys survive; high contrast and dark contrast exclude each other (dark wins if both arrive).
  function clean(p) {
    var out = {}, n = Math.round(Number(p && p.text) || 0);
    if (n > 0) out.text = Math.min(n, MAX_TEXT);
    for (var k in FLAGS) if (p && p[k] === true) out[k] = true;
    if (out.dark) delete out.contrast;
    return out;
  }
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return clean(JSON.parse(raw));
      var old = JSON.parse(localStorage.getItem(OLD) || 'null'); // the statement page's earlier display settings
      if (old) return clean({ text: old.text ? 1 : 0, contrast: old.contrast === true, links: old.links === true, still: old.motion === true });
    } catch (e) {}
    return {};
  }
  function apply(p) {
    for (var k in FLAGS) root.classList.toggle(FLAGS[k], !!p[k]);
    for (var i = 1; i < TEXT.length; i++) root.classList.toggle(TEXT[i], p.text === i);
  }
  function save(p) {
    p = clean(p);
    try { if (Object.keys(p).length) localStorage.setItem(KEY, JSON.stringify(p)); else localStorage.removeItem(KEY); localStorage.removeItem(OLD); } catch (e) {}
    apply(p);
    try { document.dispatchEvent(new CustomEvent('gerbi-a11y-change', { detail: p })); } catch (e) {}
    return p;
  }

  // "Stop animations" also answers (prefers-reduced-motion) queries made by the site's scripts (scrolling, canvas
  // effects), so they behave as if the device asked for reduced motion.
  var mm = window.matchMedia;
  if (mm) window.matchMedia = function (q) {
    var real = mm.call(window, q);
    if (!/prefers-reduced-motion/.test(String(q)) || !root.classList.contains(FLAGS.still)) return real;
    var noop = function () {};
    return { matches: /prefers-reduced-motion\s*:\s*reduce/.test(String(q)), media: real.media, onchange: null, addListener: noop, removeListener: noop, addEventListener: noop, removeEventListener: noop, dispatchEvent: function () { return false; } };
  };

  window.gerbiA11y = { KEY: KEY, FLAGS: FLAGS, MAX_TEXT: MAX_TEXT, clean: clean, read: read, apply: apply, save: save };
  apply(read());
})();

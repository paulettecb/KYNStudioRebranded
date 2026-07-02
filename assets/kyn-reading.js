/* KYN — Reading options for blog articles.
   Vanilla JS, no dependencies. Prefs persist in localStorage. */
(function () {
  'use strict';

  var KEY = 'kyn-reading-prefs';
  var DEFAULTS = { size: 1, leading: 'normal', spaced: false, sans: false, bionic: false };

  var body = document.querySelector('.article-body.rte');
  var panel = document.querySelector('[data-rd-panel]');
  if (!body || !panel) return;

  var originalHTML = null; // saved before bionic transform, restored on disable

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var p = raw ? JSON.parse(raw) : {};
      return {
        size: [0, 1, 2].indexOf(p.size) !== -1 ? p.size : DEFAULTS.size,
        leading: p.leading === 'wide' ? 'wide' : 'normal',
        spaced: !!p.spaced,
        sans: !!p.sans,
        bionic: !!p.bionic
      };
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function save(prefs) {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* private mode */ }
  }

  /* ---- Bionic (experimental): bold the first ~40% of each word ---- */
  var SKIP = { A: 1, CODE: 1, PRE: 1, SCRIPT: 1, STYLE: 1, B: 1, STRONG: 1, KBD: 1, SAMP: 1 };
  var WORD = /[\p{L}\p{M}\d]+/gu;

  function bionicFragment(text) {
    // Build DOM nodes directly (no HTML strings — avoids entity/escaping bugs)
    var frag = document.createDocumentFragment();
    var last = 0;
    var m;
    WORD.lastIndex = 0;
    while ((m = WORD.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var word = m[0];
      var n = Math.max(1, Math.ceil(word.length * 0.4));
      var b = document.createElement('b');
      b.className = 'rd-bionic';
      b.textContent = word.slice(0, n);
      frag.appendChild(b);
      if (n < word.length) frag.appendChild(document.createTextNode(word.slice(n)));
      last = m.index + word.length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function applyBionic() {
    if (originalHTML === null) originalHTML = body.innerHTML;
    var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        for (var el = node.parentElement; el && el !== body; el = el.parentElement) {
          if (SKIP[el.tagName]) return NodeFilter.FILTER_REJECT;
        }
        return /\S/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      node.parentNode.replaceChild(bionicFragment(node.nodeValue), node);
    });
  }

  function removeBionic() {
    if (originalHTML !== null) {
      body.innerHTML = originalHTML;
      originalHTML = null;
    }
  }

  /* ---- Apply prefs to DOM ---- */
  function apply(prefs) {
    body.classList.remove('rd-size-0', 'rd-size-1', 'rd-size-2', 'rd-leading-normal', 'rd-leading-wide');
    body.classList.add('rd-size-' + prefs.size, 'rd-leading-' + prefs.leading);
    body.classList.toggle('rd-spaced', prefs.spaced);
    body.classList.toggle('rd-sans', prefs.sans);

    var hasBionic = !!body.querySelector('b.rd-bionic');
    if (prefs.bionic && !hasBionic) applyBionic();
    if (!prefs.bionic && hasBionic) removeBionic();

    panel.querySelectorAll('[data-rd]').forEach(function (btn) {
      var kind = btn.getAttribute('data-rd');
      if (kind === 'reset') return;
      if (kind === 'size') {
        btn.setAttribute('aria-pressed', String(Number(btn.getAttribute('data-value')) === prefs.size));
      } else if (kind === 'leading') {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-value') === prefs.leading));
      } else {
        btn.setAttribute('aria-pressed', String(!!prefs[kind]));
      }
    });
  }

  /* ---- Wire up ---- */
  var prefs = load();
  apply(prefs);

  panel.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-rd]');
    if (!btn) return;
    var kind = btn.getAttribute('data-rd');

    if (kind === 'reset') {
      prefs = Object.assign({}, DEFAULTS);
    } else if (kind === 'size') {
      prefs.size = Number(btn.getAttribute('data-value'));
    } else if (kind === 'leading') {
      prefs.leading = btn.getAttribute('data-value');
    } else {
      prefs[kind] = !prefs[kind];
    }
    save(prefs);
    apply(prefs);
  });
})();

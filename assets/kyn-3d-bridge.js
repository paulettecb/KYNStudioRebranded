/* KYN · "Diseña la tuya": puente entre la galería del producto y el motor 3D.
   El motor (assets/kyn-3d.js: Three.js + coreografía de armado) solo se
   descarga al tocar "Diseña la tuya". Los círculos de color del formulario
   pintan la correa: sections/main-product.liquid emite `kyn:variant` cada vez
   que cambia la variante y aquí se traduce a pintarCorta / pintarLarga.
   Config y textos vienen del JSON que imprime snippets/pdp-3d.liquid. */
(function () {
  'use strict';

  function webglOk() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }

  function loadEngine(src) {
    return new Promise(function (resolve, reject) {
      if (window.KYN3D && window.KYN3D.mount) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () {
        if (window.KYN3D && window.KYN3D.mount) resolve(); else reject(new Error('KYN3D missing'));
      };
      s.onerror = function () { reject(new Error('KYN3D load failed')); };
      document.head.appendChild(s);
    });
  }

  function init(layer) {
    var sectionId = layer.getAttribute('data-section-id');
    var cfgEl = document.getElementById('kyn3d-config-' + sectionId);
    var section = document.getElementById('MainProduct-' + sectionId);
    if (!cfgEl || !section) return;
    var cfg;
    try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }

    var gallery = section.querySelector('.pdp-gallery');
    var seg = section.querySelector('[data-kyn3d-seg]');
    var canvas = layer.querySelector('canvas');
    var status = layer.querySelector('[data-kyn3d-status]');
    var hint = layer.querySelector('[data-kyn3d-hint]');
    var handle = layer.querySelector('[data-kyn3d-handle]');
    var combo = layer.querySelector('[data-kyn3d-combo]');
    var thumbs = document.getElementById('pdp-thumbs-' + sectionId);
    if (!gallery || !seg || !canvas) return;
    if (!webglOk()) return; /* sin WebGL2 la galería se queda como está */

    var S = cfg.strings || {};
    var state = {
      mode: 'photos',
      api: null,
      loading: null,
      corta: cfg.initial && cfg.initial.corta,
      larga: cfg.initial && cfg.initial.larga,
      handle: true
    };

    /* Miniatura "3D" al inicio de la tira: la segunda puerta de entrada */
    var thumb = null;
    if (thumbs) {
      thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'pdp-thumb pdp-thumb--3d';
      thumb.setAttribute('aria-label', S.thumbLabel || '3D');
      thumb.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
        '<path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg><span>3D</span>';
      thumb.addEventListener('click', function () { setMode('3d'); });
      thumbs.insertBefore(thumb, thumbs.firstChild);
      thumbs.addEventListener('click', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.pdp-thumb') : null;
        if (t && t !== thumb) setMode('photos');
      });
    }

    seg.hidden = false;
    seg.querySelectorAll('[data-kyn3d-mode]').forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-kyn3d-mode')); });
    });

    function hex(v) {
      return (cfg.finishes && cfg.finishes[v]) || '#cccccc';
    }

    function paint() {
      if (state.api) {
        state.api.pintarCorta(hex(state.corta));
        state.api.pintarLarga(hex(state.larga));
      }
      if (!combo) return;
      combo.textContent = '';
      [state.corta, state.larga].forEach(function (v) {
        var dot = document.createElement('i');
        dot.className = 'pdp-3d__dot';
        dot.style.background = hex(v);
        combo.appendChild(dot);
      });
      var text = document.createElement('span');
      text.className = 'pdp-3d__combo-text';
      text.textContent = state.corta + ' × ' + state.larga + ' · ' + cfg.largo + ' m';
      combo.appendChild(text);
    }

    function setStatus(text) {
      if (!status) return;
      status.textContent = text || '';
      status.hidden = !text;
    }

    function setHandleUI(on) {
      state.handle = !!on;
      if (!handle) return;
      handle.hidden = false;
      handle.setAttribute('aria-pressed', on ? 'true' : 'false');
      var label = handle.querySelector('span');
      if (label) label.textContent = on ? (S.openHandle || '') : (S.closeHandle || '');
    }
    if (handle) {
      handle.addEventListener('click', function () {
        if (!state.api) return;
        var next = !state.handle;
        state.api.setAgarradera(next);
        setHandleUI(next);
      });
    }
    if (hint) {
      canvas.addEventListener('pointerdown', function () { hint.hidden = true; }, { once: true });
    }

    function mount() {
      state.api = window.KYN3D.mount(canvas, {
        colorCorta: hex(state.corta),
        colorLarga: hex(state.larga),
        largo: String(cfg.largo),
        modelUrl: function (file) { return (cfg.models && cfg.models[file]) || file; },
        dracoPath: cfg.dracoPath,
        onAgarradera: setHandleUI
      });
      paint();
    }

    function fail() {
      state.loading = null;
      setStatus(S.unsupported || '');
      setTimeout(function () {
        setStatus('');
        setMode('photos');
        seg.hidden = true;
        if (thumb && thumb.parentNode) thumb.parentNode.removeChild(thumb);
      }, 2500);
    }

    function setMode(mode) {
      if (mode === state.mode) return;
      state.mode = mode;
      var on = mode === '3d';
      if (on) {
        /* en celular el marco se queda pegado debajo del header mientras eliges */
        var header = document.querySelector('.site-header');
        gallery.style.setProperty('--pdp-sticky-top', ((header ? header.offsetHeight : 0) + 8) + 'px');
      }
      gallery.classList.toggle('is-3d', on);
      layer.hidden = !on;
      seg.querySelectorAll('[data-kyn3d-mode]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-kyn3d-mode') === mode ? 'true' : 'false');
      });
      if (thumb) {
        if (on) thumbs.querySelectorAll('.pdp-thumb').forEach(function (t) { t.classList.remove('active'); });
        thumb.classList.toggle('active', on);
      }
      if (!on) {
        if (state.api) state.api.pause();
        return;
      }
      if (state.api) { state.api.resume(); return; }
      if (state.loading) return;
      setStatus(S.loading || '');
      state.loading = loadEngine(cfg.engine).then(function () {
        setStatus('');
        try { mount(); } catch (e) { fail(); }
      }).catch(fail);
    }

    document.addEventListener('kyn:variant', function (e) {
      var d = e.detail || {};
      if (String(d.sectionId) !== String(sectionId) || !d.selected) return;
      state.corta = d.selected[cfg.idxCorta] || state.corta;
      state.larga = d.selected[cfg.idxLarga] || state.larga;
      paint();
      if (state.mode === '3d' && thumb) {
        /* updateVariantUI marca la miniatura de la foto de la variante; en 3D manda la nuestra */
        thumbs.querySelectorAll('.pdp-thumb').forEach(function (t) { t.classList.remove('active'); });
        thumb.classList.add('active');
      }
    });

    paint();
  }

  function boot() {
    document.querySelectorAll('[data-kyn3d]').forEach(init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

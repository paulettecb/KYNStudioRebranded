/* KYN · "Diseña la tuya": puente entre la galería del producto y el motor 3D.
   El motor (assets/kyn-3d.js: Three.js + coreografía de armado) solo se
   descarga al tocar "Diseña la tuya". Los círculos de color del formulario
   pintan la correa: sections/main-product.liquid emite `kyn:variant` cada vez
   que cambia la variante y aquí se traduce a pintarCorta / pintarLarga.
   La barra de herramientas (mosquetón opcional, nombre en letras) sale según
   los ajustes de la sección; en modo "order" la elección viaja en el pedido
   como propiedad del artículo. Config y textos vienen del JSON que imprime
   snippets/pdp-3d.liquid. */
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
    var tools = section.querySelector('[data-kyn3d-tools]');
    var form = document.getElementById('product-form-' + sectionId);
    if (!gallery || !seg || !canvas) return;
    if (!webglOk()) return; /* sin WebGL2 la galería se queda como está */

    var S = cfg.strings || {};
    var state = {
      mode: 'photos',
      api: null,
      loading: null,
      corta: cfg.initial && cfg.initial.corta,
      larga: cfg.initial && cfg.initial.larga,
      handle: true,
      mosq: 'lobster',
      nombre: { texto: '', alto: 26, pos: 0, cabe: true, faltan: [] }
    };
    var mosqCfg = cfg.mosqueton || { mode: 'off' };
    /* el producto vende el mosquetón como opción: el valor elegido decide cuál se ve */
    var mosqFromOption = typeof cfg.idxMosq === 'number' && cfg.idxMosq >= 0;
    function mosqIdFor(value) { return /carabin/i.test(String(value || '')) ? 'carabiner' : 'lobster'; }
    if (mosqFromOption && cfg.initial && cfg.initial.mosq) state.mosq = mosqIdFor(cfg.initial.mosq);
    var nombreCfg = cfg.nombre || { mode: 'off' };

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
    gallery.classList.toggle('has-tools', !!tools);
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

    /* Propiedades del artículo: solo cuando el ajuste está en "order" y hay algo que decir */
    function setProperty(name, value) {
      if (!form || !name) return;
      var sel = 'input[type="hidden"][data-kyn3d-prop="' + name.replace(/"/g, '') + '"]';
      var input = form.querySelector(sel);
      if (!value) {
        if (input) input.parentNode.removeChild(input);
        return;
      }
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'properties[' + name + ']';
        input.setAttribute('data-kyn3d-prop', name.replace(/"/g, ''));
        form.appendChild(input);
      }
      input.value = value;
    }

    /* ── Mosquetón: lobster o carabiner de uso rudo ── */
    var mosqPills = tools ? tools.querySelectorAll('[data-kyn3d-mosq]') : [];
    function setMosq(id) {
      state.mosq = id === 'carabiner' ? 'carabiner' : 'lobster';
      mosqPills.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-kyn3d-mosq') === state.mosq ? 'true' : 'false');
      });
      if (state.api) state.api.setMosqueton(state.mosq);
      if (mosqCfg.mode === 'order') setProperty(mosqCfg.property, state.mosq === 'carabiner' ? (S.carabiner || 'Carabiner') : '');
    }
    mosqPills.forEach(function (b) {
      b.addEventListener('click', function () { setMosq(b.getAttribute('data-kyn3d-mosq')); });
    });

    /* ── Nombre en letras (paso 4 del constructor) ── */
    var nameInput = tools ? tools.querySelector('[data-kyn3d-name]') : null;
    var nameNote = tools ? tools.querySelector('[data-kyn3d-name-note]') : null;
    var nameRanges = tools ? tools.querySelector('[data-kyn3d-name-ranges]') : null;
    var altoInput = tools ? tools.querySelector('[data-kyn3d-name-alto]') : null;
    var altoOut = tools ? tools.querySelector('[data-kyn3d-name-alto-out]') : null;
    var posInput = tools ? tools.querySelector('[data-kyn3d-name-pos]') : null;
    var posOut = tools ? tools.querySelector('[data-kyn3d-name-pos-out]') : null;
    var nameTimer = null;
    var pasoNombre = false;

    function fmt(tpl, key, val) { return String(tpl || '').replace('[' + key + ']', val); }
    function posText() { return state.nombre.pos === 0 ? (S.namePosHook || '0') : fmt(S.namePosPct, 'percent', state.nombre.pos); }

    function nameNoteRefresh() {
      if (!nameNote) return;
      var n = state.nombre;
      var err = '';
      if (n.faltan.length) err = fmt(S.nameMissing, 'chars', n.faltan.join(', '));
      else if (n.texto && !n.cabe) err = S.nameNoFit || '';
      nameNote.textContent = err || (S.nameHint || '');
      nameNote.classList.toggle('is-error', !!err);
      if (nameInput) nameInput.setAttribute('aria-invalid', err ? 'true' : 'false');
    }

    function nameProperty() {
      if (nombreCfg.mode !== 'order') return;
      var n = state.nombre;
      setProperty(nombreCfg.property, n.texto ? n.texto + ' · ' + fmt(S.nameSizeMm, 'mm', n.alto) + ' · ' + posText() : '');
    }

    function setNombreTexto(txt) {
      var t = String(txt || '').toUpperCase().slice(0, 16);
      state.nombre.texto = t.trim();
      if (nameInput && nameInput.value !== t) nameInput.value = t;
      if (nameRanges) nameRanges.hidden = !state.nombre.texto;
      if (state.api) {
        state.nombre.faltan = state.api.analizarNombre(state.nombre.texto).faltan;
        state.api.setNombreTexto(state.nombre.texto);
        if (state.nombre.texto && !pasoNombre) { pasoNombre = true; state.api.irPaso(4); }
        clearTimeout(nameTimer);
        if (state.nombre.texto) nameTimer = setTimeout(function () { if (state.api) state.api.enfocarNombre(); }, 900);
      }
      nameNoteRefresh();
      nameProperty();
    }
    if (nameInput) {
      nameInput.addEventListener('input', function () { setNombreTexto(nameInput.value); });
    }
    if (tools) {
      tools.querySelectorAll('[data-kyn3d-dije]').forEach(function (b) {
        b.addEventListener('click', function () {
          setNombreTexto((nameInput ? nameInput.value : state.nombre.texto) + b.getAttribute('data-kyn3d-dije'));
          if (nameInput) nameInput.focus();
        });
      });
    }
    if (altoInput) {
      altoInput.addEventListener('input', function () {
        state.nombre.alto = parseInt(altoInput.value, 10) || 26;
        if (altoOut) altoOut.textContent = fmt(S.nameSizeMm, 'mm', state.nombre.alto).replace(/^letra de /i, '');
        if (state.api) state.api.setNombre({ alto: state.nombre.alto });
        nameProperty();
      });
    }
    if (posInput) {
      posInput.addEventListener('input', function () {
        state.nombre.pos = parseInt(posInput.value, 10) || 0;
        if (posOut) posOut.textContent = posText();
        if (state.api) state.api.setNombre({ pos: state.nombre.pos });
        nameProperty();
      });
    }
    /* al soltar tamaño o posición, la cámara vuelve a encuadrar el nombre (se mueve a lo largo de la tira) */
    [altoInput, posInput].forEach(function (el) {
      if (el) el.addEventListener('change', function () { if (state.api && state.nombre.texto) state.api.enfocarNombre(); });
    });
    function onNombreCabe(cabe) {
      state.nombre.cabe = !!cabe;
      nameNoteRefresh();
    }

    function mount() {
      state.api = window.KYN3D.mount(canvas, {
        colorCorta: hex(state.corta),
        colorLarga: hex(state.larga),
        largo: String(cfg.largo),
        modelUrl: function (file) { return (cfg.models && cfg.models[file]) || file; },
        dracoPath: cfg.dracoPath,
        mosqueton: state.mosq,
        nombre: { texto: state.nombre.texto, alto: state.nombre.alto, pos: state.nombre.pos, colorHex: nombreCfg.color },
        onAgarradera: setHandleUI,
        onNombreCabe: onNombreCabe
      });
      paint();
      /* lo que se escribió mientras cargaba el motor */
      if (state.nombre.texto) setNombreTexto(state.nombre.texto);
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
      if (tools) tools.hidden = !on;
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
      if (mosqFromOption && d.selected[cfg.idxMosq] !== undefined) setMosq(mosqIdFor(d.selected[cfg.idxMosq]));
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

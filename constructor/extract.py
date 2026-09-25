#!/usr/bin/env python3
"""Genera src/kyn-3d.ts a partir del constructor original (kyn-catalogo).

Uso:  python3 extract.py /ruta/a/kyn-catalogo/src/components/ConstructorKyn.tsx

Toma las constantes/helpers de módulo y el cuerpo del useEffect (la escena
completa: geometría, coreografía, agarradera, mosquetón opcional, nombre en
letras, cámara) y lo envuelve en mount(canvas, opts) sin Preact: colores,
largo, mosquetón, nombre y rutas de modelos llegan por opts en vez de
estado/URL. Si la coreografía cambia en kyn-catalogo, se vuelve a correr y se
reconstruye assets/kyn-3d.js con `npm run build`.
"""
import re, sys, pathlib

src_path = sys.argv[1] if len(sys.argv) > 1 else '/home/user/kyn-catalogo/src/components/ConstructorKyn.tsx'
src = pathlib.Path(src_path).read_text().split('\n')

def find(marker, start=0):
    for i in range(start, len(src)):
        if marker in src[i]:
            return i
    raise SystemExit('marker not found: ' + marker)

h0 = find('// Los dos largos que se venden')
h1 = find('export default function ConstructorKyn')
e0 = find('if (!canvas) return;') + 1
e1 = find('// eslint-disable-next-line react-hooks/exhaustive-deps')
helpers = '\n'.join(src[h0:h1])
body = '\n'.join(src[e0:e1])
print(f'helpers {h0+1}-{h1} | effect body {e0+1}-{e1}')

def _sub(text, pat, rep, flags=0, expect=1):
    out, n = re.subn(pat, rep, text, flags=flags)
    if n != expect:
        raise SystemExit(f'expected {expect} match(es) for {pat!r}, got {n}')
    return out

def sub(pat, rep, flags=0, expect=1):
    global body
    body = _sub(body, pat, rep, flags, expect)

def subh(pat, rep, flags=0, expect=1):
    global helpers
    helpers = _sub(helpers, pat, rep, flags, expect)

# ── helpers de módulo: los mosquetones se cargan por nombre de archivo ──
subh(r"src: '/models/([a-z0-9-]+\.glb)'", r"src: '\1'", expect=2)

# ── colores y modelos desde opts ──
sub(r"colors\[selCorta\]\?\.hex \?\? '#C9B79C'", "opts.colorCorta")
sub(r"colors\[selLarga\]\?\.hex \?\? '#B5674D'", "opts.colorLarga")
sub(r"new DRACOLoader\(\)\.setDecoderPath\('/draco/'\)", "new DRACOLoader().setDecoderPath(opts.dracoPath)")
sub(r"carga\('/models/([a-z0-9-]+\.glb)'\)", r"carga(opts.modelUrl('\1'))", expect=5)
sub(r"carga\(M\.src\)", "carga(opts.modelUrl(M.src))")
sub(r"const L_LARGA = LARGOS\.find\(\(l\) => l\.id === largo\)!\.larga;",
    "const L_LARGA = (LARGOS.find((l) => l.id === opts.largo) ?? LARGOS[1]).larga;")

# ── mosquetón y nombre: el estado de Preact se vuelve opts ──
sub(r"let ganchoSel: MosqId = mosq;", "let ganchoSel: MosqId = opts.mosqueton === 'carabiner' ? 'carabiner' : 'lobster';")
sub(r"LETRA_COLORES\[selNombre\]\?\.hex \?\? LETRA_COLORES\[0\]\.hex", "opts.nombre?.colorHex ?? LETRA_COLORES[0].hex")
sub(r"const nombreCfg = \{ piezas: piezasNombre, alto: altoN, pos: posN \};",
    "const nombreCfg = {\n"
    "      piezas: piezasDe((opts.nombre?.texto ?? '').toUpperCase().trim()).piezas,\n"
    "      alto: Math.min(ALTO_MAX, Math.max(ALTO_MIN, opts.nombre?.alto ?? ALTO_BASE)),\n"
    "      pos: Math.min(100, Math.max(0, opts.nombre?.pos ?? 0)),\n"
    "    };")
sub(r"avisarCabeRef\.current\(recorrido >= 0\);", "opts.onNombreCabe?.(recorrido >= 0);")

# ── la API ──
sub(r"apiRef\.current = \{", "const api: Omit<Kyn3DApi, 'destroy' | 'pause' | 'resume' | 'setNombreTexto' | 'analizarNombre'> = {")
sub(r"apiRef\.current\.irPaso", "api.irPaso")
sub(r"apiRef\.current\?\.irPaso", "api.irPaso", expect=2)
sub(r"\n\s*setAgarradera\(true\);", "\n          opts.onAgarradera?.(true);")
sub(r"const p0 = Number\(new URLSearchParams\(location\.search\)\.get\('paso'\) \?\? 1\);",
    "const p0 = opts.autoArmar === false ? 1 : 3; // el paso 4 (nombre) lo dispara quien monta, cuando hay nombre")

# ── TS 5.5: `'up' in CAMS[a]` deja CAMS[a].up como unknown en la unión; Astro no lo comprueba al construir ──
sub(r"upGiro\.setFromUnitVectors\(upDesde, CAMS\[a\]\.up\);", "upGiro.setFromUnitVectors(upDesde, CAMS[a].up as THREE.Vector3);")

# ── resize: llenar el contenedor (el marco de la galería) en vez de w*0.92 ──
sub(r"\n    const resize = \(\) => \{\n.*?\n    \};\n    window\.addEventListener\('resize', resize\);\n    resize\(\);\n", '''
    const host = canvas.parentElement as HTMLElement;
    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host); else window.addEventListener('resize', resize);
    resize();
''', flags=re.S)

# ── el loop de animación con nombre, para poder pausarlo cuando la galería vuelve a Fotos ──
sub(r"renderer\.setAnimationLoop\(\(\) => \{", "const loop = () => {")
sub(r"      renderer\.render\(scene, camera\);\n      tPrev = t;\n    \}\);",
    "      renderer.render(scene, camera);\n      tPrev = t;\n    };\n    renderer.setAnimationLoop(loop);")

# ── cleanup del efecto -> destroy() + return api ──
sub(r"\n\s*return \(\) => \{\s*\n\s*window\.removeEventListener\('resize', resize\);\s*\n\s*renderer\.setAnimationLoop\(null\);\s*\n\s*renderer\.dispose\(\);\s*\n\s*\};\s*$", '''
    const destroy = () => {
      if (destruido) return;
      destruido = true;
      if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      renderer.setAnimationLoop(null);
      controls.dispose();
      draco.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
    const pause = () => { if (!destruido) renderer.setAnimationLoop(null); };
    const resume = () => { if (!destruido) renderer.setAnimationLoop(loop); };
    const setNombreTexto = (txt: string) => api.setNombre({ piezas: piezasDe(txt.toUpperCase().trim()).piezas });
    const analizarNombre = (txt: string) => piezasDe(txt.toUpperCase().trim());
    return { ...api, setNombreTexto, analizarNombre, pause, resume, destroy };
''')
sub(r"\n    // si la URL traía paso adelantado, reproducir la coreografía desde ahí\n",
    "\n    let destruido = false;\n    // arranca armada: la pieza llega ensamblada (paso 3), salvo autoArmar=false\n")
sub(r"if \(p0 >= 3\) setTimeout\(\(\) => api\.irPaso\(3\), 8000 / RITMO\);",
    "if (p0 >= 3) setTimeout(() => { if (!destruido) api.irPaso(3); }, 8000 / RITMO);")
sub(r"if \(p0 >= 4\) setTimeout\(\(\) => api\.irPaso\(4\), 9000 / RITMO\);",
    "if (p0 >= 4) setTimeout(() => { if (!destruido) api.irPaso(4); }, 9000 / RITMO);")

header = '''// KYN · Motor 3D de la Urban Leash para el tema de Shopify.
//
// Es la escena del constructor (kyn-catalogo/src/components/ConstructorKyn.tsx)
// sin la interfaz de Preact: ensamble, coreografía de armado, agarradera,
// mosquetón opcional (lobster / carabiner), nombre en letras y recoloreo.
// GENERADO por constructor/extract.py: la coreografía se edita en
// kyn-catalogo y se vuelve a extraer, no aquí.
//
// Uso (ver assets/kyn-3d-bridge.js):
//   const api = KYN3D.mount(canvas, { colorCorta, colorLarga, largo, modelUrl, dracoPath });
//   api.pintarCorta('#8a5a3c'); api.setMosqueton('carabiner'); api.setNombreTexto('KENNA');
//   api.irPaso(4); api.enfocarNombre(); api.pause(); api.resume(); api.destroy();
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type Kyn3DMosqueton = 'lobster' | 'carabiner';

export type Kyn3DNombre = {
  /** piezas de la tira; null = espacio (ver analizarNombre) */
  piezas?: (string | null)[];
  /** alto de letra en mm (16–40; 26 = tal cual sale de Tinkercad) */
  alto?: number;
  /** 0 = junto al mosquetón, 100 = lo más lejos que cabe, hacia la agarradera */
  pos?: number;
};

export type Kyn3DOptions = {
  /** hex de la tira corta (Primary Finish) */
  colorCorta: string;
  /** hex de la tira larga (Secondary Finish) */
  colorLarga: string;
  /** largo del producto: '1.2' | '1.6' (bloqueado por producto) */
  largo: string;
  /** archivo .glb -> URL en el CDN de Shopify */
  modelUrl: (file: string) => string;
  /** carpeta (con / final) donde viven draco_wasm_wrapper.js y draco_decoder.wasm */
  dracoPath: string;
  /** mosquetón de la punta de la tira larga (default 'lobster') */
  mosqueton?: Kyn3DMosqueton;
  /** nombre inicial en letras (opcional) */
  nombre?: { texto?: string; alto?: number; pos?: number; colorHex?: string };
  /** reproducir la coreografía de armado al montar (default true) */
  autoArmar?: boolean;
  /** la escena cierra sola la agarradera al final del armado; avisa para que el botón lo refleje */
  onAgarradera?: (on: boolean) => void;
  /** avisa si el nombre cabe en la tira con el alto y la posición actuales */
  onNombreCabe?: (cabe: boolean) => void;
};

export type Kyn3DApi = {
  pintarCorta: (hex: string) => void;
  pintarLarga: (hex: string) => void;
  pintarNombre: (hex: string) => void;
  setAgarradera: (on: boolean) => void;
  setMosqueton: (id: Kyn3DMosqueton) => void;
  setNombre: (cfg: Kyn3DNombre) => void;
  /** texto libre -> piezas (A–Z, espacios y los dijes ✿ ☾ ★ ♥); lo demás se ignora */
  setNombreTexto: (txt: string) => void;
  /** qué piezas produce un texto y qué caracteres no tienen pieza todavía */
  analizarNombre: (txt: string) => { piezas: (string | null)[]; faltan: string[] };
  /** la cámara encuadra el nombre (solo con la pieza armada y el paso 4 activo) */
  enfocarNombre: () => void;
  /** 2 y 3: coreografía de armado; 4: paso del nombre (las letras aparecen al terminar el armado) */
  irPaso: (n: number) => void;
  /** detiene el render (la galería volvió a Fotos); resume lo reanuda */
  pause: () => void;
  resume: () => void;
  destroy: () => void;
};

'''
out = header + helpers + '\n\nexport function mount(canvas: HTMLCanvasElement, opts: Kyn3DOptions): Kyn3DApi {\n' + body + '\n}\n\nexport const version = \'0.2.0\';\n'
pathlib.Path(__file__).with_name('src').joinpath('kyn-3d.ts').write_text(out)
print('written', out.count('\n'), 'lines')
for tok in ['apiRef', 'colors[', 'selCorta', 'selLarga', 'selNombre', '/models/', '/draco/', 'setAgarradera(true)', 'location.search',
            'useState', 'PRECIOS', 'crearNombreEnCorrea', 'canvasRef', 'MOSTRAR_NOMBRE', 'pesos(', 'avisarCabeRef', 'piezasNombre', 'altoN', 'posN', ' mosq;']:
    c = out.count(tok)
    if c:
        print('  residuo:', tok, c)

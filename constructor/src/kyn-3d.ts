// KYN · Motor 3D de la Urban Leash para el tema de Shopify.
//
// Es la escena del constructor (kyn-catalogo/src/components/ConstructorKyn.tsx)
// sin la interfaz de Preact: solo el ensamble, la coreografía de armado, la
// agarradera y el recoloreo. GENERADO por constructor/extract.py: la
// coreografía se edita en kyn-catalogo y se vuelve a extraer, no aquí.
//
// Uso (ver sections/main-product.liquid):
//   const api = KYN3D.mount(canvas, { colorCorta, colorLarga, largo, modelUrl, dracoPath });
//   api.pintarCorta('#8a5a3c'); api.pintarLarga('#5f6b32'); api.setAgarradera(true); api.destroy();
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

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
  /** reproducir la coreografía de armado al montar (default true) */
  autoArmar?: boolean;
  /** la escena cierra sola la agarradera al final del armado; avisa para que el botón lo refleje */
  onAgarradera?: (on: boolean) => void;
};

export type Kyn3DApi = {
  pintarCorta: (hex: string) => void;
  pintarLarga: (hex: string) => void;
  pintarNombre: (hex: string) => void;
  setAgarradera: (on: boolean) => void;
  irPaso: (n: number) => void;
  /** detiene el render (la galería volvió a Fotos); resume lo reanuda */
  pause: () => void;
  resume: () => void;
  destroy: () => void;
};

// Los dos largos que se venden. El 3D se arma con el que esté elegido: la
// cinta en crudo cambia y la pieza entera se recalcula.
//   corta 45 − 7 (doblez) − 7 (mitad del traslape)  +  larga − 7 (doblez)
const LARGOS = [
  { id: '1.2', label: '1.2 m', larga: 1.0 },
  { id: '1.6', label: '1.6 m', larga: 1.33 },
] as const;

const HW = 0.0095, HT = 0.001, RC = 0.0008;
// La tira corta es igual en los dos modelos; la larga la elige quien compra
// (ver LARGOS), así que todo lo que depende de ella se calcula dentro del
// efecto y la escena se rehace al cambiarla.
const L_CORTA = 0.45;
const ZONA = 0.012; // cinta que reparte la curva de cada doblez
const Z_EJE = 0.005; // radio del eje de los dobleces

// La unión: las dos tiras se montan una sobre otra SOLO el tramo de los dos
// tornillos, más un dedito de cola a cada lado — como en la pieza real. Antes
// los barrenos iban a 6 cm y eso obligaba a 11 cm de empalme: las tiras
// corrían juntas medio largo y se leía como si se atravesaran.
const TORN_UNION = [0.175, 0.145]; // los 2 barrenos de en medio, alineados
const COLA_UNION = 0.015; // cuánto sobra cada tira más allá de su tornillo
const DRING_Y = 0.16; // el aro va emparedado entre los dos tornillos

// corta: cuelga con su lado de 2 barrenos arriba;
// el doblez del perno vive a 10 cm de su punta de 4 barrenos (abajo)
const CORTA_Y = TORN_UNION[0] + COLA_UNION;
const DOBLEZ_CORTA_LOCAL = -0.35; // marco local de la corta
const DOBLEZ_CORTA = DOBLEZ_CORTA_LOCAL + CORTA_Y; // mundo
const TORN_PERNO = [-0.315 + CORTA_Y, -0.275 + CORTA_Y];
// larga: su punta de 4 barrenos arriba; ancla mundo de esa punta.
// Su cola baja justo un dedito por debajo del tornillo de abajo.
const LARGA_Z = 0.0025; // la larga va al frente en la unión
// Agarradera (pieza ya armada): la tira corta se dobla en gota y su mosquetón
// de perno sube a abrocharse en el anillo D — es lo que haces tú con la correa
// terminada, no un paso de fabricación.
// El doblez arranca donde de verdad TERMINA la colita de la tira larga: más
// arriba la corta todavía va pegada a la larga, y cualquier curva de ahí para
// arriba la atraviesa. (Queda muy por debajo del último tornillo de unión, así
// que el sándwich atornillado tampoco se despega.)
const ASA_S0 = CORTA_Y - (TORN_UNION[1] - COLA_UNION) + 0.003;
// La cinta libre TERMINA en su doblez (donde abraza el ojo del mosquetón):
// más allá ya no hay material, solo la colita que regresa atornillada. Colgar
// el herraje a 0.383 —donde cae el ORIGEN del .glb— lo dejaba 3.3 cm en el
// aire, y por eso la correa se veía lejísimos del gancho por más que se
// ajustara el ángulo.
const ASA_SE = CORTA_Y - DOBLEZ_CORTA; // = 0.35, el doblez
const PERNO_ORIGEN = 0.033; // del doblez al origen del .glb, para la pose abierta
// El mosquetón, medido de su .glb ya colocado: del origen al ojo (donde lo
// abraza el doblez de la cinta) y del origen a la boca del gancho.
// Los dos puntos que importan del .glb, en su propio marco y medidos de la
// malla: el OJO (lo que abraza el doblez de la cinta) y la BOCA del gancho
// (el hueco donde tiene que quedar el anillo). Antes se apuntaba la punta de
// la nariz del gancho, que está 1.7 cm más abajo y 6 mm de lado: por eso el
// gancho quedaba junto al aro y no cruzándolo.
const PERNO_OJO = 0.0383;
const OJO_L: [number, number, number] = [0.0024, PERNO_OJO, 0.0008];
const BOCA_L: [number, number, number] = [0.006, -0.02, 0.0008];
const PERNO_LARGO = Math.hypot(
  BOCA_L[0] - OJO_L[0], BOCA_L[1] - OJO_L[1], BOCA_L[2] - OJO_L[2],
);
const ASA_LARGO = ASA_SE - ASA_S0;

// La CAÍDA de la tira larga: pasada la unión deja de colgar tiesa y hace
// una S muy suelta, muy flojita, EN EL PLANO DE LA VISTA — como una correa
// acomodada para foto de producto — para que la pieza completa quepa en el
// mismo cuadro. El rumbo de la cinta oscila un periodo entero de seno (da
// la vuelta a un lado, regresa por el centro y remata al otro), y como el
// seno integra a cero, la punta aterriza centrada.
const CAIDA_Y0 = 0.34; // dónde arranca el levantamiento (altura de mundo)
// El piso es un plano horizontal DE VERDAD: la tira baja, da un cuarto de
// vuelta sobre su grosor (radio CAIDA_RB — esa es la onda que se está
// levantando junto con el asa) y el resto serpentea acostado en el plano
// y = CAIDA_Y0 + CAIDA_RB, cara arriba, dos pasadas anchas apiladas. De
// perfil se ve el doblez y el montoncito en el suelo, no una línea.
const CAIDA_RB = 0.16; // radio del levantamiento
const CAIDA_PISO_PSI = 1.42; // cuánto gira el rumbo en las pasadas del suelo
const CAIDA_PISO_PLANA = 1.9; // recorte a meseta de esas pasadas
const CAIDA_PISO_ONDAS = 1.5; // periodo y medio → dos ondas bien echadas

// Qué tan rápido corre la coreografía de armado. Multiplica el reloj de las
// fases 2 y 3 enteras, así que los tiempos de adentro siguen en su proporción
// —solo hay que tocar este número para acelerar o frenar todo el ritual.
// A 1 duraba ~18 s de punta a punta, que se sentía eterno.
const RITMO = 3;

// Apagado a pedido de Paulette: la placa del nombre no quedó bien y le
// estorbaba para usar el constructor. El código queda intacto (aquí y en
// el efecto de abajo) por si se retoma después — solo hay que poner esto
// en true.
const MOSTRAR_NOMBRE = false;

const suave = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

function cintaGeometry(largo: number, pasos: number) {
  const secc = new THREE.Shape();
  secc.moveTo(-HW + RC, -HT);
  secc.lineTo(HW - RC, -HT);
  secc.quadraticCurveTo(HW, -HT, HW, -HT + RC);
  secc.lineTo(HW, HT - RC);
  secc.quadraticCurveTo(HW, HT, HW - RC, HT);
  secc.lineTo(-HW + RC, HT);
  secc.quadraticCurveTo(-HW, HT, -HW, HT - RC);
  secc.lineTo(-HW, -HT + RC);
  secc.quadraticCurveTo(-HW, -HT, -HW + RC, -HT);
  const eje = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -largo, 0));
  const geo = new THREE.ExtrudeGeometry(secc, { steps: pasos, curveSegments: 5, extrudePath: eje });
  geo.rotateY(Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const d = Math.min(-y, y + largo);
    if (d < HW) {
      const f = Math.sqrt(Math.max(0, d * (2 * HW - d))) / HW;
      p.setX(i, p.getX(i) * f);
    }
  }
  return geo;
}

function granoTextura() {
  const gs = 256;
  const gc = document.createElement('canvas');
  gc.width = gc.height = gs;
  const g = gc.getContext('2d')!;
  g.fillStyle = '#7d7d7d';
  g.fillRect(0, 0, gs, gs);
  for (let i = 0; i < 900; i++) {
    const v = 100 + Math.floor(Math.random() * 60);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.beginPath();
    g.ellipse(Math.random() * gs, Math.random() * gs, 4 + Math.random() * 7,
      3 + Math.random() * 6, Math.random() * Math.PI, 0, 7);
    g.fill();
  }
  const tx = new THREE.CanvasTexture(gc);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(60, 60);
  return tx;
}


export function mount(canvas: HTMLCanvasElement, opts: Kyn3DOptions): Kyn3DApi {

    // Medidas que dependen del largo elegido. Van aquí y no arriba porque la
    // escena se rehace cuando cambia (ver las dependencias del efecto).
    const L_LARGA = (LARGOS.find((l) => l.id === opts.largo) ?? LARGOS[1]).larga;
    const LARGA_TIP = TORN_UNION[1] - COLA_UNION + L_LARGA;
    const DOBLEZ_LARGA = LARGA_TIP - 0.1;
    const TORN_GATILLO = [LARGA_TIP - 0.135, LARGA_TIP - 0.175];
    // Nombre atravesado en la tira larga (prueba "Kenna"): pegado al tramo
    // recto justo antes del doblez, para que quede "casi llegando" al
    // mosquetón sin meterse en la zona que se dobla ni pisar sus tornillos.
    const NOMBRE_Y = DOBLEZ_LARGA - 0.17;
    const NOMBRE_MITAD = 0.0645; // medio largo real de la placa (12.9 cm)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.9;
    const key = new THREE.DirectionalLight('#FFFFFF', 0.55);
    key.position.set(1.5, 3, 2);
    scene.add(key);
    // Filo de luz por detrás: le prende el canto a la cinta para que se
    // despegue del fondo aunque el color sea el mismo (una correa periwinkle
    // sobre página periwinkle se perdía). No aclara las caras, solo el borde.
    const filo = new THREE.DirectionalLight('#FFFFFF', 0.9);
    filo.position.set(-2.2, 0.6, -2.6);
    scene.add(filo);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.005, 20);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 0.08;
    controls.maxDistance = 4;
    // el pellizco acerca hacia donde apuntan los dedos, no hacia un punto
    // fijo — así se puede acercar de verdad al mosquetón, no "adonde quiera"
    controls.zoomToCursor = true;

    const grano = granoTextura();
    const biothane = (hex: string) =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hex), roughness: 0.5, metalness: 0,
        bumpMap: grano, bumpScale: 1.6, clearcoat: 0.15, clearcoatRoughness: 0.55,
      });

    // ---- tira corta ----
    const matCorta = biothane(opts.colorCorta);
    const geoCorta = cintaGeometry(L_CORTA, 520);
    const baseCorta = (geoCorta.attributes.position.array as Float32Array).slice();
    const corta = new THREE.Mesh(geoCorta, matCorta);
    corta.position.y = CORTA_Y;
    scene.add(corta);

    // ---- tira larga (llega en el paso 2) ----
    const matLarga = biothane(opts.colorLarga);
    matLarga.transparent = true;
    matLarga.opacity = 0;
    const geoLarga = cintaGeometry(L_LARGA, 300);
    const baseLarga = (geoLarga.attributes.position.array as Float32Array).slice();
    const larga = new THREE.Mesh(geoLarga, matLarga);
    larga.visible = false;
    scene.add(larga);

    // deformadores: doblez con curl progresivo y aplanado final
    function formarCorta(t: number, vida: number, phi: number) {
      const pos = geoCorta.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = baseCorta[i * 3 + 1];
        const s = -y / L_CORTA;
        const s2 = s * s;
        const px = baseCorta[i * 3] + 0.022 * Math.sin(t * 0.55) * s2 * vida;
        let py = y;
        let pz = baseCorta[i * 3 + 2] +
          (0.09 * s2 + 0.02 * Math.sin(2.6 * s - t * 0.9) * s) * vida;
        const d = DOBLEZ_CORTA_LOCAL - py; // >0 debajo del doblez (marco local)
        if (d > 0 && phi > 0) {
          const ang = phi * Math.min(d / ZONA, 1);
          const dy = py - DOBLEZ_CORTA_LOCAL;
          const dz = pz - Z_EJE;
          py = DOBLEZ_CORTA_LOCAL + dy * Math.cos(ang) + dz * Math.sin(ang);
          pz = Z_EJE - dy * Math.sin(ang) + dz * Math.cos(ang);
          const plano = suave((d - ZONA) / 0.02) * (phi / Math.PI) ** 2;
          pz -= 0.008 * plano;
        }
        pos.setXYZ(i, px, py, pz);
      }
      pos.needsUpdate = true;
      geoCorta.computeVertexNormals();
    }

    // La gota: la agarradera doblada, picuda arriba (donde las dos puntas se
    // juntan en el anillo D) y redonda abajo. Se tabula por longitud de arco
    // para que la cinta no se estire — el perímetro de la gota es exactamente
    // el tramo libre de la tira.
    // La gota se recuesta lo suficiente para quedar ENTERA de un solo lado:
    // si panza mitad adelante y mitad atrás, cruza el plano de la tira larga
    // y la atraviesa. El perfil z = sen(f)·sen²(f/2) sale del pico tangente a
    // la vertical y su máxima pendiente respecto al eje es exactamente
    // GOTA_ANCHO, así que inclinándola ese ángulo (más un margen) todo queda
    // del mismo lado.
    // Los números del cierre de la agarradera. Salieron de ajustarlos en vivo
    // con Paulette contra la correa real —ninguno se calculó— y por eso van
    // como constantes con nombre en vez de magia repartida por el archivo:
    //   asa 20% / 65% / 8°  ·  doblez 2 mm  ·  gancho cuelga -30°
    //   anillo sale 90°, ladea 90°, el gancho entra al 160% de su fondo
    const gotaAncho = 0.2;  // qué tan panzona es la gota
    const gotaAlto = 0.65;  // qué tan estirada hacia abajo
    const gotaIncl = (8 * Math.PI) / 180; // cuánto se recuesta el óvalo
    // Radio del doblez que abraza el ojo del mosquetón. El tramo de cinta que
    // gasta la vuelta es media circunferencia de este radio, para que dé una U
    // de verdad y no una lengüeta aplastada.
    const dobRad = 0.002;
    const curlSigno = -1; // hacia dónde da la vuelta el doblez
    const giroRad = 0;    // columpio del plano del asa
    const inclActual = () => curlSigno * gotaIncl;
    const ganchoRad = 0;  // vuelta del mosquetón sobre su propio eje
    // A qué ángulo cuelga el mosquetón dentro del plano del asa (negativo =
    // recargado hacia la correa). De aquí sale dónde tiene que terminar la
    // cinta y hacia dónde mira el herraje.
    const ganchoAng = (-30 * Math.PI) / 180;
    // Cómo va montado el ANILLO D y qué tan adentro entra el gancho. De estos
    // se deduce todo el cierre —el plano en el que cierra el asa y a dónde
    // llega el gancho—, así que el aro manda y la agarradera lo sigue.
    const aroSale = (90 * Math.PI) / 180;
    const aroInclina = (90 * Math.PI) / 180;
    const aroHondo = 1.6;
    // Corrimiento del gancho sobre la barra del anillo. 6 mm, encontrados a
    // ojo contra la correa real — el modelo del mosquetón no está centrado en
    // su propio eje y esto lo compensa.
    const aroLado = 0.006;
    let acomodarAro = () => {};
    // Plano en el que cierra el asa. NO se elige: lo dicta la panza del aro
    // (ver acomodarAro). Sale ya por el camino corto porque viene de atan2.
    let posRad = 0;
    // Comba hacia atrás de la pierna que sube, para que le pase por detrás a
    // la tira larga (ver abajo). Vale 0 en las dos puntas.
    const GOTA_ATRAS = 0;
    const N_GOTA = 240;

    // Construye la gota de modo que su punta caiga EXACTAMENTE en (destY,destZ)
    // —el centro del anillo D, medido de la escena, no un número a ojo— y que
    // su perímetro sea el tramo libre de la tira, para que la cinta no se
    // estire. Las dos condiciones se cumplen a la vez ajustando la escala
    // (converge en 2-3 vueltas). destY/destZ son relativos al arranque del
    // doblez, así que el gancho siempre llega a donde de verdad está el aro.
    function construirGota(destY: number, destZ: number) {
      const incl = inclActual();
      const cosI = Math.cos(incl), sinI = Math.sin(incl);
      const construir = (sube: number, atras: number) => {
        const ys: number[] = [], zs: number[] = [], ss: number[] = [];
        const punto = (f: number) => {
          const m = Math.sin(f / 2) * Math.sin(f / 2);
          const y0 = -m * gotaAlto;
          // curlSigno ESPEJEA la gota (invierte de verdad hacia dónde da la
          // vuelta). Antes solo multiplicaba la inclinación, que nada más la
          // ladeaba — se sentía como cambiar el ángulo, no el sentido.
          const z0 = curlSigno * gotaAncho * Math.sin(f) * m;
          // La subida al aro (y la deriva hacia atrás) van con t², no lineales:
          // así arrancan en cero y con pendiente cero, y la gota EMPIEZA
          // bajando. Con reparto lineal subía desde el primer milímetro, la
          // panza nacía por encima de la punta de la tira larga y le pasaba
          // por delante.
          const t = f / (2 * Math.PI);
          const w = t * t;
          return {
            y: y0 * cosI - z0 * sinI + sube * w,
            z: y0 * sinI + z0 * cosI + atras * w,
          };
        };
        let acc = 0;
        let a = punto(0);
        ys.push(a.y); zs.push(a.z); ss.push(0);
        for (let i = 1; i <= N_GOTA; i++) {
          const p = punto((2 * Math.PI * i) / N_GOTA);
          acc += Math.hypot(p.y - a.y, p.z - a.z);
          ys.push(p.y); zs.push(p.z); ss.push(acc);
          a = p;
        }
        return { ys, zs, ss, per: acc };
      };
      let sc = 1, cur = construir(0, 0);
      for (let it = 0; it < 6; it++) {
        cur = construir(destY / sc, destZ / sc);
        sc = ASA_LARGO / cur.per;
      }
      const { ys, zs, ss } = cur;
      for (let i = 0; i <= N_GOTA; i++) { ys[i] *= sc; zs[i] *= sc; ss[i] *= sc; }
      // La pierna que sube al aro pasaba por 2-4 mm dentro del grosor de la
      // tira larga. Se le da una comba hacia atrás que vale 0 en las dos
      // puntas (arranque y aro quedan intactos) y pesa donde va subiendo, así
      // le pasa por detrás. Es un empujón de milímetros, no cambia la vuelta.
      for (let i = 0; i <= N_GOTA; i++) {
        const t = i / N_GOTA;
        zs[i] -= GOTA_ATRAS * t * t * (1 - t);
      }
      return { ys, zs, ss, N: N_GOTA };
    }

    // Destino provisional (el ancla del aro) hasta que el .glb cargue y se
    // pueda medir dónde queda de verdad el hueco del anillo.
    let destAro = { y: DRING_Y - (CORTA_Y - ASA_S0), z: 0 };
    // panza del anillo en coordenadas de escena (se llena al cargar el .glb)
    let panzaW: THREE.Vector3 | null = null;
    // eje ojo→boca: es el que se apunta a la panza del aro
    const EJE_GANCHO = new THREE.Vector3(
      BOCA_L[0] - OJO_L[0], BOCA_L[1] - OJO_L[1], BOCA_L[2] - OJO_L[2],
    ).normalize();
    let GOTA = construirGota(destAro.y, destAro.z);

    // Punto de la gota a una distancia s del pico (0 → ASA_LARGO).
    function gotaAt(s: number) {
      const { ys, zs, ss, N } = GOTA;
      // Más allá de la punta la curva SIGUE DERECHO en vez de cortarse. El
      // doblez que abraza el ojo del mosquetón se pasa un centímetro de la
      // punta mientras da la vuelta; con la curva cortada, todos esos
      // vértices se amontonaban en el mismo punto y salía una lengüeta negra
      // aplastada en vez de un doblez.
      if (s > ss[N]) {
        const ty = ys[N] - ys[N - 1], tz = zs[N] - zs[N - 1];
        const L = Math.hypot(ty, tz) || 1;
        const e = s - ss[N];
        return {
          y: ys[N] + (ty / L) * e,
          z: zs[N] + (tz / L) * e,
          dy: ty,
          dz: tz,
        };
      }
      const q = Math.min(Math.max(s, 0), ss[N]);
      let lo = 0, hi = N;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ss[mid] <= q) lo = mid; else hi = mid;
      }
      const span = ss[hi] - ss[lo] || 1;
      const f = (q - ss[lo]) / span;
      return {
        y: ys[lo] + (ys[hi] - ys[lo]) * f,
        z: zs[lo] + (zs[hi] - zs[lo]) * f,
        // tangente por diferencias, para inclinar herrajes y grosor
        dy: ys[hi] - ys[lo],
        dz: zs[hi] - zs[lo],
      };
    }

    // La cinta NO llega hasta el anillo: llega hasta donde empieza el
    // mosquetón, y es el mosquetón el que alcanza el aro. El mosquetón cuelga
    // parado —el ojo abajo, en el doblez de la cinta; el gancho arriba, en la
    // panza del aro—, así que la punta de la gota va justo su largo POR DEBAJO
    // de la panza, del mismo lado.
    // (Correr el mosquetón sobre la curva —lo que intenté antes— dejaba el ojo
    // volando fuera de la cinta: el herraje es rígido y la curva no.)
    function apuntarGota(panzaY: number, panzaLat: number) {
      // La cinta termina donde va el OJO del mosquetón, contado desde la panza
      // del aro en la dirección en la que cuelga el herraje. Cuánto contar no
      // es un número fijo: el ojo no cae sobre la curva sino a un radio de
      // doblez de ella, así que se mide y se corrige (3-4 vueltas y cierra).
      // Con un valor fijo el gancho se pasaba unos milímetros por encima del
      // aro —lo rozaba en vez de cruzarlo— y cambiaba según la forma del asa.
      const cy = Math.cos(ganchoAng), sy = Math.sin(ganchoAng);
      const armar = (l: number) => construirGota(panzaY - l * cy, panzaLat - l * sy);
      let alcance = PERNO_LARGO;
      GOTA = armar(alcance);
      if (!panzaW) return;
      for (let it = 0; it < 8; it++) {
        const f = aroFrame(ASA_SE, 1);
        const ojo = new THREE.Vector3(
          f.cx + dobRad * f.nx,
          CORTA_Y + f.cy + dobRad * f.ny,
          f.cz + dobRad * f.nz,
        );
        alcance += PERNO_LARGO - ojo.distanceTo(panzaW);
        GOTA = armar(alcance);
      }
    }

    // Marco de la agarradera a una distancia s del empalme, doblada al a×100%.
    // Arriba de ASA_S0 (la unión con la tira larga) nada se mueve.
    // Devuelve ya el punto y la normal en 3D, con el columpio incluido, para
    // que la cinta y los herrajes salgan del MISMO cálculo y no puedan
    // descuadrarse entre sí (fue justo lo que se me rompió al intentarlo antes).
    function aroFrame(s: number, a: number) {
      const d = Math.max(0, s - ASA_S0);
      if (a < 1e-4 || d <= 0) {
        return { cx: 0, cy: -s, cz: 0, nx: 0, ny: 0, nz: 1, th: 0, giro: 0 };
      }
      // El torcimiento entra de a poco y se deshace al llegar al aro: 0 donde
      // arranca el doblez (para empalmar sin brinco con el tramo recto), máximo
      // en la panza del asa (que es la que cuelga de lado) y 0 otra vez en la
      // punta, para que el gancho llegue derecho al anillo — así el anillo no
      // se toca. Aplicado parejo, la cinta pegaba un giro de 90° de golpe.
      // Encima va la POSICIÓN: una vuelta pareja de toda la agarradera sobre
      // el eje de la correa. Entra suave en los primeros 6 cm para no quebrar
      // el empalme con el tramo recto, y de ahí se mantiene: por eso mueve el
      // asa entera (cinta, tornillos y gancho) en vez de ladear una pieza.
      const r = Math.min(1, d / 0.06);
      // el seno se limita al tramo del asa: pasado el final (los vértices del
      // doblez se salen un centímetro) volvía negativo y torcía el doblez al revés
      const campana = Math.sin(Math.PI * Math.min(1, d / ASA_LARGO));
      const giro = a * (giroRad * campana + posRad * r * r * (3 - 2 * r));
      const gs = Math.sin(giro), gc = Math.cos(giro);
      const g = gotaAt(d);
      const th = Math.atan2(g.dz, -g.dy); // 0 = hacia abajo
      // se interpola contra la tira recta, así a=0 la deja exactamente igual
      const lat = g.z * a;
      const nlat = Math.cos(th * a);
      return {
        cx: lat * gs,
        cy: -s + (-ASA_S0 + g.y - -s) * a,
        cz: lat * gc,
        nx: nlat * gs,
        ny: Math.sin(th * a),
        nz: nlat * gc,
        th: th * a,
        giro,
      };
    }

    // La tira corta, ya armada, enroscándose en el aro del asa.
    // a = 0 reproduce exactamente la forma plana de formarCorta.
    function formarCortaAro(t: number, vida: number, phi: number, a: number) {
      const pos = geoCorta.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = baseCorta[i * 3 + 1];
        const s = -y / L_CORTA;
        const s2 = s * s;
        const px = baseCorta[i * 3] + 0.022 * Math.sin(t * 0.55) * s2 * vida;
        let py = y;
        let pz = baseCorta[i * 3 + 2] +
          (0.09 * s2 + 0.02 * Math.sin(2.6 * s - t * 0.9) * s) * vida;
        const zonaDob = Math.PI * dobRad; // media vuelta de ese radio
        const d = DOBLEZ_CORTA_LOCAL - py;
        if (d > 0 && phi > 0) {
          const ang = phi * Math.min(d / zonaDob, 1);
          const dy = py - DOBLEZ_CORTA_LOCAL;
          const dz = pz - dobRad;
          py = DOBLEZ_CORTA_LOCAL + dy * Math.cos(ang) + dz * Math.sin(ang);
          pz = dobRad - dy * Math.sin(ang) + dz * Math.cos(ang);
          const plano = suave((d - zonaDob) / 0.02) * (phi / Math.PI) ** 2;
          pz -= 0.008 * plano;
        }
        // el doblez ya hecho se mapea sobre el arco por su propia posición
        // a lo largo de la cinta, así el sobrante queda recostado donde toca
        const f = aroFrame(-py, a);
        // El columpio es un TORCIMIENTO de la cinta sobre su eje vertical: gira
        // también el ancho (px), no solo el plano del aro. Si el ancho se queda
        // quieto, la cinta acaba doblándose de canto —imposible— y los herrajes
        // salen acostados.
        const gs = Math.sin(f.giro), gc = Math.cos(f.giro);
        pos.setXYZ(
          i,
          px * gc + (f.cx + pz * f.nx),
          f.cy + pz * f.ny,
          -px * gs + (f.cz + pz * f.nz)
        );
      }
      pos.needsUpdate = true;
      geoCorta.computeVertexNormals();
    }

    // El mosquetón de perno y sus dos tornillos viajan con el aro, para que
    // el perno termine de vuelta junto a la unión (que es donde se engancha).
    function colocarAro(a: number) {
      // misma receta para toda pieza: se cuelga del marco del aro, se inclina
      // con la cinta y se columpia con el plano
      const poner = (
        o: THREE.Object3D, f: ReturnType<typeof aroFrame>, y: number, off: number,
        seguirCinta = true,
      ) => {
        o.position.set(f.cx + off * f.nx, y + off * f.ny, f.cz + off * f.nz);
        o.rotation.order = 'YXZ'; // primero inclina con la cinta, luego columpia
        if (seguirCinta) o.rotation.set(-f.th, f.giro, 0);
        else o.rotation.set(0, 0, 0);
      };
      if (perno) {
        // El mosquetón va SIEMPRE colgado del final de la cinta, como en la
        // pieza real: el ojo dentro del doblez, el cuerpo sobresaliendo. No se
        // le corre nada — lo que se corre es la gota, que termina el largo del
        // mosquetón por debajo del anillo (ver apuntarGota).
        // El punto que manda es el OJO, no el origen del modelo: es el que
        // tiene que quedar SIEMPRE dentro del doblez de la cinta. Antes giraba
        // el mosquetón alrededor de su origen y el ojo salía volando fuera de
        // la correa — se veía el gancho suelto, sin nada que lo sujetara.
        const off = dobRad;
        const fO = aroFrame(ASA_SE, a);
        const A = new THREE.Vector3(
          fO.cx + off * fO.nx,
          CORTA_Y + fO.cy + off * fO.ny,
          fO.cz + off * fO.nz,
        );
        perno.g.rotation.order = 'YXZ';
        perno.g.rotation.set(-fO.th, fO.giro, 0);
        // Y APUNTA al anillo. Un mosquetón de perno gira libre en su ojo: no
        // tiene por qué seguir la tangente de la cinta, y de hecho seguirla lo
        // dejaba acostado de lado (la gota llega al final casi de plano, así
        // que la tangente ahí no dice nada útil).
        if (panzaW && a > 1e-3) {
          const dir = panzaW.clone().sub(A);
          if (dir.lengthSq() > 1e-9) {
            const abierto = perno.g.quaternion.clone();
            const mira = new THREE.Quaternion().setFromUnitVectors(EJE_GANCHO, dir.normalize());
            perno.g.quaternion.copy(abierto).slerp(mira, a);
          }
        }
        perno.g.rotation.x += ganchoRad * a;
        // Ya con la orientación resuelta se cuelga por el OJO. El corrimiento
        // entra con el cierre: a=0 deja el mosquetón exactamente donde estaba
        // (colgando del doblez, sin tocar el montaje del paso 2) y a=1 pone el
        // ojo en la punta de la cinta, con el gancho justo en la panza.
        // Colocación: abierto, colgando del doblez como siempre; cerrado, con
        // la BOCA exactamente en la panza del aro. Antes se colgaba del ojo y
        // se confiaba en que la gota terminara al largo justo — quedaba a dos
        // o tres milímetros y el gancho se apoyaba en el arco en vez de
        // cruzarlo. Anclando la boca no puede fallar; el ojo cae igual dentro
        // del doblez porque la gota se armó para eso.
        const abierta = A.clone().add(new THREE.Vector3(0, -PERNO_ORIGEN, 0));
        const cerrada = panzaW
          ? panzaW.clone().sub(
              new THREE.Vector3(...BOCA_L).applyQuaternion(perno.g.quaternion),
            )
          : abierta;
        perno.g.position.lerpVectors(abierta, cerrada, a);
      }
      for (let i = 0; i < 2; i++) {
        const sTor = CORTA_Y - YS[i]; // distancia al empalme de este barreno
        const f = aroFrame(sTor, a);
        const y = CORTA_Y + f.cy;
        const m = machos[i], h = hembras[i], ag = agujeros[i];
        if (m) poner(m.g, f, y, FRENTES[i]);
        if (h) poner(h.g, f, y, ATRASES[i]);
        // el cilindro del barreno ya viene con su eje sobre Z; se inclina igual
        if (ag) poner(ag.m, f, y, 0);
      }
    }

    // La caída se integra una vez a una tabla por LONGITUD DE ARCO (la
    // cinta no se estira): primero el cuarto de vuelta del levantamiento
    // (ángulo th sobre el grosor) y después el serpenteo en el plano del
    // piso (rumbo phi sobre la cara). Misma tabla para malla y herrajes —
    // si fueran cálculos separados, se despegarían (ya nos pasó).
    const CAIDA_LEN = LARGA_TIP - CAIDA_Y0;
    const N_CAIDA = 240;
    const CAIDA_TAB = (() => {
      const SB = (CAIDA_RB * Math.PI) / 2; // arco del levantamiento
      const LP = CAIDA_LEN * 1.12 - SB; // tira que queda para el piso
      const rumboPiso = (u: number) => {
        const t = Math.min(1, u / LP);
        const crudo = Math.sin(CAIDA_PISO_ONDAS * 2 * Math.PI * t);
        const forma = Math.max(-1, Math.min(1, crudo * CAIDA_PISO_PLANA));
        return CAIDA_PISO_PSI * forma * suave(u / 0.05);
      };
      const xs = [0], ys = [0], zs = [0], ths = [0], phis = [0];
      const ds = (CAIDA_LEN * 1.12) / N_CAIDA;
      let x = 0, y = 0, z = 0;
      for (let i = 1; i <= N_CAIDA; i++) {
        const sMid = (i - 0.5) * ds;
        if (sMid < SB) {
          const th = sMid / CAIDA_RB;
          y += Math.cos(th) * ds;
          z += Math.sin(th) * ds;
          ths.push(Math.min(Math.PI / 2, (i * ds) / CAIDA_RB));
          phis.push(0);
        } else {
          const phi = rumboPiso(sMid - SB);
          x += Math.sin(phi) * ds;
          z += Math.cos(phi) * ds;
          ths.push(Math.PI / 2);
          phis.push(rumboPiso(i * ds - SB));
        }
        xs.push(x); ys.push(y); zs.push(z);
      }
      return { xs, ys, zs, ths, phis, ds };
    })();
    function enCaida(sc: number) {
      const { xs, ys, zs, ths, phis, ds } = CAIDA_TAB;
      const f = Math.min(Math.max(sc / ds, 0), N_CAIDA - 1e-6);
      const i = Math.floor(f), r = f - i;
      const q = (a: number[]) => a[i] + (a[i + 1] - a[i]) * r;
      return { x: q(xs), y: q(ys), z: q(zs), th: q(ths), phi: q(phis) };
    }

    function formarLarga(phi: number, caida = 0) {
      const pos = geoLarga.attributes.position;
      const yh = -0.1; // doblez a 10 cm de su punta de 4 barrenos (local)
      const yD = CAIDA_Y0 - LARGA_TIP; // arranque de la caída, en marco local
      for (let i = 0; i < pos.count; i++) {
        let py = baseLarga[i * 3 + 1];
        let pz = baseLarga[i * 3 + 2];
        const dy = py - yh; // >0 arriba del doblez (la punta que da la vuelta)
        if (dy > 0 && phi > 0) {
          const ang = phi * Math.min(dy / ZONA, 1);
          const dz = pz - Z_EJE;
          py = yh + dy * Math.cos(ang) - dz * Math.sin(ang);
          pz = Z_EJE + dy * Math.sin(ang) + dz * Math.cos(ang);
          const plano = suave((dy - ZONA) / 0.02) * (phi / Math.PI) ** 2;
          pz -= 0.008 * plano;
        }
        // la caída va DESPUÉS del doblez del gatillo: la punta ya doblada
        // viaja entera sobre la curva (las dos capas comparten py, así que
        // les toca el mismo tramo y no se separan). El grosor (pz) rota con
        // el levantamiento y el ancho (px) con el rumbo del piso — el marco
        // completo, no un dibujo plano.
        let px = baseLarga[i * 3];
        const sC = py - yD;
        if (caida > 0 && sC > 0) {
          const c = enCaida(sC);
          const sT = Math.sin(c.th), cT = Math.cos(c.th);
          const sF = Math.sin(c.phi), cF = Math.cos(c.phi);
          const px2 = c.x + px * cF;
          const py2 = yD + c.y - pz * sT;
          const pz2 = c.z + pz * cT - px * sF;
          px += (px2 - px) * caida;
          py += (py2 - py) * caida;
          pz += (pz2 - pz) * caida;
        }
        pos.setXYZ(i, px, py, pz);
      }
      pos.needsUpdate = true;
      geoLarga.computeVertexNormals();
    }
    formarLarga(0);

    // Los herrajes de la punta (gatillo + 2 tornillos con sus barrenos)
    // viajan sobre la misma tabla, con el mismo marco: primero su vuelta
    // propia, encima el levantamiento (x) y encima el rumbo del piso (y).
    // Se llama cada cuadro DESPUÉS de animaTornillo. En 0 no toca nada.
    const Q_TMP = new THREE.Quaternion();
    function ponerCaida(caida: number) {
      if (caida <= 0) return;
      const dobla = (o: THREE.Object3D, baseY: number, giroBase: number, baseZ: number) => {
        const sC = baseY - CAIDA_Y0;
        if (sC <= 0) return;
        const c = enCaida(sC);
        const n = baseZ - LARGA_Z; // qué tan despegada va del plano de la cinta
        const sT = Math.sin(c.th * caida), cT = Math.cos(c.th * caida);
        const x2 = c.x * caida;
        const y2 = baseY + (CAIDA_Y0 + c.y - baseY) * caida - n * sT;
        const z2 = LARGA_Z + c.z * caida + n * (cT - 1) + n;
        o.position.set(x2, y2, z2);
        o.quaternion.setFromEuler(new THREE.Euler(0, 0, giroBase));
        Q_TMP.setFromEuler(new THREE.Euler(c.th * caida, 0, 0));
        o.quaternion.premultiply(Q_TMP);
        Q_TMP.setFromEuler(new THREE.Euler(0, c.phi * caida, 0));
        o.quaternion.premultiply(Q_TMP);
      };
      if (gatillo) dobla(gatillo.g, DOBLEZ_LARGA + 0.033, Math.PI, Z_EJE + LARGA_Z);
      // La placa del nombre es larga (12.9 cm) contra una curva que da vueltas
      // fuertes en ese tramo: dobla() sigue la tangente de UN solo punto (el
      // centro), y a esa escala la punta se despega de la cinta (la K se salía
      // por completo). Es rígida — no se puede curvar sola — así que en vez de
      // adivinar su ángulo se ANCLAN sus dos puntas (K y A) a sus posiciones
      // reales sobre la curva y se arma la cuerda entre ellas: así ninguna
      // punta se sale, aunque el tramo de en medio no siga la curva exacta
      // (una placa rígida tampoco lo haría en la vida real).
      if (nombre) {
        const puntoEn = (baseY: number) => {
          const sC = baseY - CAIDA_Y0;
          if (sC <= 0) return new THREE.Vector3(0, baseY, LARGA_Z);
          const c = enCaida(sC);
          return new THREE.Vector3(
            c.x * caida,
            baseY + (CAIDA_Y0 + c.y - baseY) * caida,
            LARGA_Z + c.z * caida,
          );
        };
        const pA = puntoEn(NOMBRE_Y - NOMBRE_MITAD); // lado de la K
        const pB = puntoEn(NOMBRE_Y + NOMBRE_MITAD); // lado de la A
        const sCmid = NOMBRE_Y - CAIDA_Y0;
        const phiMid = sCmid > 0 ? enCaida(sCmid).phi * caida : 0;
        const yAxis = pB.clone().sub(pA).normalize();
        const xRef = new THREE.Vector3(Math.cos(phiMid), 0, -Math.sin(phiMid));
        const zAxis = new THREE.Vector3().crossVectors(xRef, yAxis).normalize();
        const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
        nombre.g.position.copy(pA).add(pB).multiplyScalar(0.5);
        nombre.g.quaternion.setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis),
        );
      }
      for (const i of [4, 5]) {
        const m = machos[i], h = hembras[i], ag = agujeros[i];
        if (m) dobla(m.g, YS[i], 0, FRENTES[i]);
        if (h) dobla(h.g, YS[i], 0, ATRASES[i]);
        if (ag) dobla(ag.m, YS[i], 0, 0);
      }
    }

    // ---- herrajes (todos dorados, cargados una vez) ----
    const draco = new DRACOLoader().setDecoderPath(opts.dracoPath);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    type Pz = { g: THREE.Group; mats: THREE.MeshStandardMaterial[] };
    const conMats = (m: THREE.Object3D): THREE.MeshStandardMaterial[] => {
      const mats: THREE.MeshStandardMaterial[] = [];
      m.traverse((n) => {
        const mesh = n as THREE.Mesh;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mat.transparent = true;
          mat.opacity = 0;
          mesh.material = mat;
          mats.push(mat);
        }
      });
      return mats;
    };
    const preparar = (m: THREE.Group, alto: number): Pz => {
      const box = new THREE.Box3().setFromObject(m);
      m.position.sub(box.getCenter(new THREE.Vector3()));
      m.scale.setScalar(alto / box.getSize(new THREE.Vector3()).y);
      const g = new THREE.Group();
      g.add(m);
      g.visible = false;
      return { g, mats: conMats(g) };
    };
    const clonar = (p: Pz): Pz => {
      const g = p.g.clone(true);
      return { g, mats: conMats(g) };
    };
    const carga = (src: string) =>
      new Promise<THREE.Group>((res, rej) => loader.load(src, (x) => res(x.scene), undefined, rej));

    let perno: Pz | null = null, gatillo: Pz | null = null, dring: Pz | null = null;
    let nombre = null as Pz | null; // la placa del nombre está apagada (MOSTRAR_NOMBRE); nunca se carga
    let nombreHex = '#D9B36A';
    // tornillos: [0,1]=perno · [2,3]=unión · [4,5]=gatillo
    const machos: Pz[] = [], hembras: Pz[] = [];
    // los tornillos deben quedar prensados contra la tira (grosor total
    // 2*HT), no flotando: la cabeza casi toca cada cara del biothane
    const FRENTES = [0.0022, 0.0022, 0.0024, 0.0024, 0.0027, 0.0027];
    const ATRASES = [-0.0016, -0.0016, -0.0016, -0.0016, -0.0018, -0.0018];
    const YS = [...TORN_PERNO, ...TORN_UNION, ...TORN_GATILLO];

    // ---- orificios: el punzado real de cada barreno, para que se vea
    // el hueco antes y durante el atornillado, no un tornillo flotando ----
    const agujeros: { m: THREE.Mesh; mat: THREE.MeshStandardMaterial }[] = [];
    for (let i = 0; i < YS.length; i++) {
      const geo = new THREE.CylinderGeometry(0.0017, 0.0017, HT * 2 + 0.0014, 16);
      geo.rotateX(Math.PI / 2); // eje del cilindro: Y → Z (atraviesa el grosor)
      const mat = new THREE.MeshStandardMaterial({
        color: '#171310', roughness: 1, metalness: 0, transparent: true, opacity: 0,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(0, YS[i], 0);
      m.visible = false;
      scene.add(m);
      agujeros.push({ m, mat });
    }

    carga(opts.modelUrl('mosqueton-perno.glb')).then((m) => {
      perno = preparar(m, 0.075);
      perno.g.position.set(0, DOBLEZ_CORTA - 0.033, Z_EJE);
      scene.add(perno.g);
    });
    carga(opts.modelUrl('mosqueton-gatillo.glb')).then((m) => {
      gatillo = preparar(m, 0.075);
      // el modelo trae el ojo ARRIBA; aquí cuelga la correa de él, así
      // que se voltea para que el ojo abrace el doblez y el cuerpo suba.
      // Ojo: se gira el GRUPO ya centrado (no la malla cruda) — girar la
      // malla cruda la voltea alrededor del origen del GLB, que no cae en
      // su centro, y eso la desplaza unos milímetros ("fantasma" en la tira).
      gatillo.g.rotation.z = Math.PI;
      gatillo.g.position.set(0, DOBLEZ_LARGA + 0.033, Z_EJE + LARGA_Z);
      scene.add(gatillo.g);
    });
    carga(opts.modelUrl('d-ring.glb')).then((m) => {
      const box = new THREE.Box3().setFromObject(m);
      const c = box.getCenter(new THREE.Vector3());
      // la BARRA (el lado plano) vive en el borde maxZ del modelo: se
      // ancla al pivote y se voltea el aro para que la CURVA mire afuera
      m.position.set(-c.x, -c.y, -box.max.z);
      const flip = new THREE.Group();
      flip.rotation.y = Math.PI;
      flip.add(m);
      const wrap = new THREE.Group();
      wrap.add(flip);
      wrap.scale.setScalar(0.11);
      // El anillo NO sale de frente: como estaba, la curva crecía hacia la
      // cámara desde una barra metida detrás de las dos tiras, o sea que
      // atravesaba el material de la tira larga. En la pieza real la barra va
      // emparedada y la curva asoma pasando el CANTO, al aire.
      // `plano` la pone de canto y `lado` decide hacia qué lado sale.
      const plano = new THREE.Group();
      plano.add(wrap);
      const lado = new THREE.Group();
      lado.add(plano);
      const g = new THREE.Group();
      g.add(lado);
      g.visible = false;
      dring = { g, mats: conMats(g) };
      // la barra queda emparedada entre las dos tiras (la larga atrás, la
      // corta al frente), justo en el hueco entre sus caras
      dring.g.position.set(0, DRING_Y, 0.00375);
      scene.add(dring.g);

      // Se mide dónde queda de verdad la PANZA del aro (el hueco por donde
      // entra el gancho) y se manda la agarradera ahí: el asa cierra sola
      // hacia donde apunte el anillo, esté como esté. Antes eran coordenadas
      // elegidas a ojo y por eso cada movimiento del aro rompía el cierre.
      acomodarAro = () => {
        plano.rotation.z = Math.PI / 2 + aroInclina;
        lado.rotation.y = -Math.PI / 2 + aroSale;
        g.updateWorldMatrix(true, true);
        const aroBox = new THREE.Box3().setFromObject(g);
        const aroC = aroBox.getCenter(new THREE.Vector3());
        // Qué tan adentro del aro entra el gancho. 100% = el centro de la caja
        // del anillo, que en un aro es el centro del agujero; más de 100% lo
        // corre hacia el arco de afuera. Estaba clavado en 144% (material del
        // arco, el gancho se apoyaba encima) y luego en 100% (demasiado
        // adentro): es de esas cosas que se ven, no se calculan, así que va a
        // deslizador.
        const bx = (aroC.x - g.position.x) * aroHondo;
        const bz = (aroC.z - g.position.z) * aroHondo;
        panzaW = new THREE.Vector3(g.position.x + bx + aroLado, aroC.y, g.position.z + bz);
        // el plano del asa se orienta SOLO hacia la panza
        posRad = Math.atan2(bx, bz);
        destAro = { y: aroC.y - (CORTA_Y - ASA_S0), z: Math.hypot(bx, bz) };
        apuntarGota(destAro.y, destAro.z);
        aroPrev = -1; // fuerza re-deformar con la gota nueva
      };
      acomodarAro();
    });
    carga(opts.modelUrl('tornillo-macho.glb')).then((m) => {
      const a = preparar(m, 0.0075);
      a.g.children[0].rotation.x = -Math.PI / 2; // el poste hacia -z
      for (let i = 0; i < 6; i++) {
        const p = i === 0 ? a : clonar(a);
        p.g.position.set(0, YS[i], FRENTES[i]);
        scene.add(p.g);
        machos.push(p);
      }
    });
    carga(opts.modelUrl('tornillo-hembra.glb')).then((m) => {
      const a = preparar(m, 0.0075);
      a.g.children[0].rotation.x = Math.PI / 2; // el barril hacia +z
      for (let i = 0; i < 6; i++) {
        const p = i === 0 ? a : clonar(a);
        p.g.position.set(0, YS[i], ATRASES[i]);
        scene.add(p.g);
        hembras.push(p);
      }
    });

    const animaTornillo = (i: number, a: number) => {
      const agu = agujeros[i];
      if (agu) {
        agu.m.visible = a > 0;
        agu.mat.opacity = Math.min(1, a * 2.5);
      }
      const h = hembras[i], m = machos[i];
      if (h) {
        h.g.visible = a > 0;
        h.mats.forEach((x) => (x.opacity = Math.min(1, a * 2)));
        h.g.position.z = ATRASES[i] - 0.05 * (1 - suave(a));
      }
      if (m) {
        const am = suave(Math.max(0, a * 1.15 - 0.15));
        m.g.visible = am > 0;
        m.mats.forEach((x) => (x.opacity = Math.min(1, am * 2)));
        m.g.position.z = FRENTES[i] + 0.05 * (1 - am);
        m.g.rotation.z = (1 - am) * Math.PI * 8; // la cuerda girando
      }
    };

    // ---- cámara guiada + libre ----
    const CAMS = {
      p1: { pos: new THREE.Vector3(0.48, 0.02, 0.7), mira: new THREE.Vector3(0.02, -0.04, 0) },
      perno: { pos: new THREE.Vector3(0.2, -0.25, 0.3), mira: new THREE.Vector3(0.01, -0.16, 0) },
      lejos: { pos: new THREE.Vector3(1.1, 0.8, 2.4), mira: new THREE.Vector3(0, 0.55, 0) },
      union: { pos: new THREE.Vector3(0.22, 0.21, 0.34), mira: new THREE.Vector3(0, 0.16, 0) },
      // atadas al doblez de la larga, para que no se desfasen si cambia el empalme
      gatillo: {
        pos: new THREE.Vector3(0.24, DOBLEZ_LARGA + 0.035, 0.36),
        mira: new THREE.Vector3(0, DOBLEZ_LARGA - 0.025, 0),
      },
      // Encuadre final: la pieza DE CABEZA —la agarradera arriba y la tira
      // larga cayendo al piso— y de cerca. No se voltea la pieza sino el
      // 'arriba' de la cámara: así nada del ensamble se mueve ni un milímetro
      // y el cierre que ajustamos a mano queda intacto.
      // se aleja en proporción al largo elegido, para que las dos quepan
      final: (() => {
        const k = 1 + (L_LARGA - 1) * 0.5;
        const mira = new THREE.Vector3(0, 0.32 + (L_LARGA - 1) * 0.11, 0.07);
        return {
          pos: mira.clone().add(new THREE.Vector3(0.56, -0.7, 1.07).multiplyScalar(k)),
          mira,
          decabeza: true,
        };
      })(),
    };
    camera.position.copy(CAMS.p1.pos);
    controls.target.copy(CAMS.p1.mira);
    controls.update();
    const desde = { pos: new THREE.Vector3(), mira: new THREE.Vector3() };
    let rumbo: { pos: THREE.Vector3; mira: THREE.Vector3; decabeza?: boolean } | null = null;
    let rumboT0 = 0, rumboDur = 1;
    // 'arriba' de la cámara al empezar y al terminar el vuelo, en radianes de
    // giro sobre el eje de visión: 0 = normal, π = de cabeza. Se rueda en vez
    // de interpolar el vector, que a la mitad se quedaría en cero.
    let rollDesde = 0, rollHasta = 0;
    function volar(a: keyof typeof CAMS, ahora: number, dur = 1.2) {
      desde.pos.copy(camera.position);
      desde.mira.copy(controls.target);
      rumbo = CAMS[a];
      rollDesde = rollHasta;
      rollHasta = 'decabeza' in CAMS[a] ? Math.PI : 0;
      rumboT0 = ahora;
      rumboDur = dur / RITMO;
      controls.enabled = false;
    }

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reloj = new THREE.Clock();
    let tPrev = 0; // para avanzar por TIEMPO y no por cuadro (ver el cierre)
    let fase = 1; // fase interna de la escena (no siempre igual al paso UI)
    let t2i = 0, t3i = 0;
    let voloLejos = false;
    let phiCortaPrev = -1, phiLargaPrev = -1, caidaPrev = -1; // solo re-deformar si cambió
    const hitos3 = { u1: false, anillo: false, u2: false, volGat: false, g1: false, g2: false };

    // Agarradera (solo con la pieza armada, paso 3): enrosca la tira corta
    // en aro y regresa el mosquetón de perno a la unión.
    let agarraderaOn = false;
    let aro = 0, aroPrev = -1;

    const api: Omit<Kyn3DApi, 'destroy' | 'pause' | 'resume'> = {
      pintarCorta: (hex) => matCorta.color.set(hex),
      pintarLarga: (hex) => matLarga.color.set(hex),
      pintarNombre: (hex) => {
        nombreHex = hex;
        nombre?.mats.forEach((m) => (m as THREE.MeshPhysicalMaterial).color.set(hex));
      },
      setAgarradera: (on) => {
        agarraderaOn = on;
      },
      irPaso: (n) => {
        const ahora = reloj.getElapsedTime();
        if (n === 2 && fase < 2) {
          fase = 2;
          t2i = ahora;
          voloLejos = false;
          volar('perno', ahora, 1.2);
        } else if (n === 3 && fase < 3) {
          fase = 3;
          t3i = ahora;
          agarraderaOn = false; // la pieza llega abierta; tú la cierras
          volar('union', ahora, 1.0);
        }
      },
    };

    formarCorta(quieto ? 1.2 : 0, 1, 0);

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

    const loop = () => {
      const t = quieto ? 1.2 : reloj.getElapsedTime();

      if (fase === 1) {
        if (!quieto) {
          formarCorta(t, 1, 0);
          corta.rotation.z = 0.05 * Math.sin(t * 0.5);
          corta.rotation.y = 0.5 * Math.sin(t * 0.24) - 0.35;
        }
      } else if (fase === 2) {
        const t2 = quieto ? 99 : (t - t2i) * RITMO;
        const vida = quieto ? 0 : Math.max(0, 1 - t2 / 1.2);
        corta.rotation.z *= 0.94;
        corta.rotation.y += (0 - corta.rotation.y) * 0.05;
        const h = suave((t2 - 0.8) / 1.0);
        if (perno) {
          perno.g.visible = h > 0;
          perno.g.position.y = DOBLEZ_CORTA - 0.033 - 0.06 * (1 - h);
          perno.mats.forEach((m) => (m.opacity = h));
        }
        const phiC = Math.PI * suave((t2 - 2.0) / 1.8);
        if (vida > 0 || Math.abs(phiC - phiCortaPrev) > 1e-4) {
          formarCorta(t, vida, phiC);
          phiCortaPrev = phiC;
        }
        animaTornillo(0, suave((t2 - 3.9) / 1.2));
        animaTornillo(1, suave((t2 - 4.5) / 1.2));
        // el montaje termina: la cámara se aleja y llega la tira larga
        if (t2 > 6.0 && !voloLejos) {
          voloLejos = true;
          volar('lejos', t, 1.6);
          larga.visible = true;
        }
        if (larga.visible) {
          const a = suave((t2 - 6.2) / 1.2);
          matLarga.opacity = a;
          larga.position.set(0, LARGA_TIP + 0.12 * (1 - a), LARGA_Z + 0.05 * (1 - a));
          if (!quieto) larga.rotation.z = 0.02 * Math.sin(t * 0.45) * a;
        }
      } else if (fase === 3) {
        const t3 = quieto ? 99 : (t - t3i) * RITMO;
        // la larga se asienta en la unión
        const asienta = suave(t3 / 0.9);
        larga.position.set(0, LARGA_TIP, LARGA_Z + 0.05 * (1 - asienta) * 0);
        larga.rotation.z *= 0.9;
        larga.position.z = LARGA_Z + (larga.position.z - LARGA_Z) * (1 - asienta);
        // unión: tornillo → anillo → tornillo
        animaTornillo(2, suave((t3 - 0.9) / 1.0));
        if (!hitos3.u1 && t3 > 0.9) hitos3.u1 = true;
        if (dring) {
          const a = suave((t3 - 2.0) / 1.0);
          dring.g.visible = a > 0;
          dring.mats.forEach((m) => (m.opacity = a));
          dring.g.position.z = -0.0005 + 0.06 * (1 - a);
          dring.g.position.y = DRING_Y - 0.02 * (1 - a);
        }
        animaTornillo(3, suave((t3 - 3.1) / 1.0));
        // vuelo rápido al extremo de la larga
        if (!hitos3.volGat && t3 > 4.2) {
          hitos3.volGat = true;
          volar('gatillo', t, 0.9);
        }
        if (gatillo) {
          const a = suave((t3 - 4.6) / 0.9);
          gatillo.g.visible = a > 0;
          gatillo.g.position.y = DOBLEZ_LARGA + 0.037 + 0.06 * (1 - a);
          gatillo.mats.forEach((m) => (m.opacity = a));
        }
        if (nombre) {
          const a = suave((t3 - 6.0) / 1.0);
          nombre.g.visible = a > 0;
          nombre.g.position.y = NOMBRE_Y + 0.06 * (1 - a);
          nombre.mats.forEach((m) => (m.opacity = a));
        }
        const phiL = Math.PI * suave((t3 - 5.5) / 1.7);
        // la caída entra al final, junto con el cierre y el vuelo de cámara
        const caida = quieto ? 1 : suave((t3 - 9.2) / 1.4);
        if (Math.abs(phiL - phiLargaPrev) > 1e-4 || Math.abs(caida - caidaPrev) > 1e-4) {
          formarLarga(phiL, caida);
          phiLargaPrev = phiL;
          caidaPrev = caida;
        }
        animaTornillo(4, suave((t3 - 7.3) / 1.1));
        animaTornillo(5, suave((t3 - 7.9) / 1.1));
        ponerCaida(caida);
        if (!hitos3.g2 && t3 > 9.2) {
          hitos3.g2 = true;
          // el último paso del ritual: la correa se cierra sola mientras la
          // cámara se acomoda. Nadie tiene que adivinar que hay un botón.
          agarraderaOn = true;
          opts.onAgarradera?.(true);
          volar('final', t, 1.8);
        }
        // Respiro final de toda la pieza. Va en la ESCENA, no en las cintas:
        // los herrajes cuelgan de la escena, así que rotando solo corta/larga
        // la correa se metía y se salía mientras el herraje se quedaba
        // clavado. La luz también viaja con ella, así que el sombreado no
        // parpadea — solo se mece la silueta.
        if (t3 > 11 && !quieto) {
          scene.rotation.y = 0.04 * Math.sin((t3 - 11) * 0.35);
        }
        // agarradera: solo cuando la coreografía ya terminó de armar la pieza
        const listo = quieto || t3 > 9.2;
        const metaAro = listo && agarraderaOn ? 1 : 0;
        // Por tiempo, no por cuadro: con 0.07 por frame el cierre tardaba lo
        // que tardara el equipo en dibujar, y en una máquina lenta se quedaba
        // a medias. Ahora cierra en ~0.6 s dibuje a 60 fps o a 5.
        const dt = Math.min(0.1, Math.max(0, t - tPrev));
        aro += (metaAro - aro) * (quieto ? 1 : Math.min(1, dt * 4 * RITMO));
        if (Math.abs(aro - aroPrev) > 1e-4) {
          formarCortaAro(t, 0, Math.PI, aro);
          colocarAro(aro);
          aroPrev = aro;
        }
      }

      // vuelo de cámara guiado; al terminar, la órbita queda libre.
      // Mientras vuela NO se llama controls.update() — pisaría el lerp.
      if (rumbo) {
        const g = suave((t - rumboT0) / rumboDur);
        camera.position.lerpVectors(desde.pos, rumbo.pos, g);
        controls.target.lerpVectors(desde.mira, rumbo.mira, g);
        const roll = rollDesde + (rollHasta - rollDesde) * g;
        camera.up.set(Math.sin(roll), Math.cos(roll), 0);
        camera.lookAt(controls.target);
        if (g >= 1) {
          rumbo = null;
          controls.enabled = true;
          controls.update();
        }
      } else {
        controls.update();
      }
      renderer.render(scene, camera);
      tPrev = t;
    };
    renderer.setAnimationLoop(loop);

    let destruido = false;
    // arranca armada: la pieza llega ensamblada (paso 3), salvo autoArmar=false
    const p0 = opts.autoArmar === false ? 1 : 3;
    if (p0 >= 2) api.irPaso(2);
    if (p0 >= 3) setTimeout(() => { if (!destruido) api.irPaso(3); }, 8000 / RITMO);
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
    return { ...api, pause, resume, destroy };

}

export const version = '0.1.0';

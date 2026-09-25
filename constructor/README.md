# constructor/ — motor 3D de la Urban Leash para el tema

Aquí se empaqueta la escena del constructor (repo `kyn-catalogo`) como un
archivo del tema: `assets/kyn-3d.js` (Three.js + coreografía de armado +
agarradera + mosquetón opcional + nombre en letras + recoloreo, ~632 KB,
168 KB gzip). Sin Preact, sin interfaz: la interfaz es la página de producto.

## Cómo se usa en el tema

- `snippets/pdp-3d.liquid` pinta el control **Fotos / Diseña la tuya** en la
  galería del producto, la barra de herramientas del constructor y un JSON con
  lo que vive en Shopify: acabados con su hex (de `snippets/color-hex.liquid`),
  qué opción es la tira corta y cuál la larga, el largo del producto, las URLs
  de los modelos y los ajustes de mosquetón y nombre.
- `assets/kyn-3d-bridge.js` es el puente: carga el motor solo al tocar
  "Diseña la tuya", lo monta en el marco de la galería y traduce el evento
  `kyn:variant` (que emite `sections/main-product.liquid` al cambiar la
  variante) a `pintarCorta` / `pintarLarga`.
- Se activa en los productos con la etiqueta `constructor-3d` (ajustable en
  Personalizar › Product information › Constructor 3D).
- La barra de herramientas debajo del marco (mosquetón lobster / carabiner de
  uso rudo, y el nombre en letras con tamaño y posición) sale según los
  ajustes `mosqueton_mode` y `nombre_mode`: `off` (default), `visual` (solo
  para verlo) u `order` (viaja en el pedido como propiedad del artículo:
  `properties[Mosquetón]`, `properties[Nombre en la correa]`). Ninguno cambia
  el precio.
- Si el producto **vende el mosquetón como opción** (ajuste `option_mosqueton`,
  default "Mosquetón"), sus valores mandan sobre el 3D igual que los acabados:
  un valor que contenga "carabin" pinta el carabiner, cualquier otro el
  lobster. Los pills de la barra no se muestran y no se agrega ninguna
  propiedad: la variante ya lo dice y el precio sale de Shopify.

## Cómo se regenera

La coreografía se edita en `kyn-catalogo/src/components/ConstructorKyn.tsx`,
no aquí. Después:

```bash
cd constructor
npm install
python3 extract.py /ruta/a/kyn-catalogo/src/components/ConstructorKyn.tsx   # genera src/kyn-3d.ts
npm run typecheck
npm run build                                                             # escribe ../assets/kyn-3d.js
```

`extract.py` falla a propósito si alguno de sus anclajes ya no encaja con el
código nuevo (cada sustitución espera un número exacto de coincidencias): es
la señal de que hay que revisar qué cambió antes de reconstruir.

Los modelos (`assets/kyn3d-*.glb`: perno, gatillo/lobster, carabiner, D-ring,
tornillos, abecedario `letras-kyn`) y el descodificador Draco
(`assets/kyn3d-draco_*`) se copian de `kyn-catalogo/public/models` y
`public/draco` con el prefijo `kyn3d-`; Shopify no admite subcarpetas en
`assets/`.

## API del motor

```js
const api = KYN3D.mount(canvas, {
  colorCorta: '#8a5a3c',           // Primary Finish (tira corta = agarradera)
  colorLarga: '#5f6b32',           // Secondary Finish (tira larga)
  largo: '1.6',                    // '1.2' | '1.6', bloqueado por producto
  modelUrl: (f) => urls[f],        // 'mosqueton-perno.glb' → URL del CDN
  dracoPath: '…/assets/kyn3d-',    // prefijo de draco_wasm_wrapper.js / draco_decoder.wasm
  mosqueton: 'lobster',            // o 'carabiner'
  nombre: { texto: '', alto: 26, pos: 0, colorHex: '#D42A2A' },
  onAgarradera: (on) => {},        // la escena cierra sola el asa al terminar de armarse
  onNombreCabe: (cabe) => {},      // si el nombre cabe en la tira con ese tamaño/posición
});
api.pintarCorta(hex); api.pintarLarga(hex); api.setAgarradera(false);
api.setMosqueton('carabiner');
api.setNombreTexto('KENNA ♥'); api.irPaso(4); api.enfocarNombre();   // las letras aparecen al terminar el armado
api.setNombre({ alto: 34, pos: 40 }); api.analizarNombre('ÑUS 3');   // → { piezas, faltan: ['Ñ','3'] }
api.pause(); api.resume(); api.destroy();
```

# KYN · Plan maestro — Tienda completa + Migración del Constructor 3D

**Fecha:** 27 de agosto de 2026
**Alcance:** (A) todo lo que le falta a la tienda kynstudio.com.mx para ser una tienda Shopify seria y aprovechar las novedades 2025–26, y (B) la migración del **constructor 3D de correas** desde kyn-catalogo (Astro/Netlify) hacia la tienda Shopify — *solo el constructor, no el catálogo*.
**Base:** auditoría de 5 frentes hecha hoy — código del tema (`KYNStudioRebranded`), código del constructor (`kyn-catalogo`), tienda viva vía Admin API, novedades Shopify (Editions Winter '26 y Summer '26), y documentación técnica oficial de migración.

---

## 0. Resumen ejecutivo

**Lo que ya está bien:** la tienda está viva y cobrando (plan Basic, MXN, Shopify Payments con Shop Pay / Apple Pay / Google Pay), con 6 productos activos bien fotografiados, tema propio OS 2.0 publicado con un PDP muy completo (swatches, zonas de personalización, JSON-LD de producto), y un constructor 3D maduro en `kyn-catalogo` que ya vende por WhatsApp.

**Los 3 huecos más graves, en orden:**

1. **Legal/confianza (P0):** solo existe la política de privacidad. No hay política de devoluciones, ni de envíos, ni términos de servicio — y la tienda ya cobra con tarjeta. El footer muestra "Terms · Privacy · Accessibility" como texto plano sin enlaces.
2. **El constructor vive fuera de la tienda y no cobra:** hoy termina en un mensaje de WhatsApp. Migrarlo a `/pages/constructor` con "Agregar al carrito" real convierte la pieza más diferenciadora de KYN en una máquina de checkout — y es viable **sin app**, solo con el tema.
3. **Fricción de compra en el tema:** carrito sin AJAX (hay que recargar), sin drawer, sin cuentas de cliente (el header enlaza a una página sin plantilla), sin filtros ni búsqueda predictiva, sin cross-sell.

**La decisión técnica central de la migración:** **Ruta A — solo tema, sin app.** Los precios del constructor son discretos (por producto y largo, no por color), así que mapean a variantes de Shopify; la configuración de colores viaja como *line item properties*; y los códigos de descuento (STELAR y familia) se convierten en códigos de descuento nativos de Shopify — que hoy viven en JavaScript público y pasarían a aplicarse de verdad en el checkout. No se necesita Cart Transform, ni app proxy, ni backend.

---

## 1. Radiografía de hoy

### 1.1 Tienda viva (kynstudio.com.mx)

| Área | Estado |
|---|---|
| Plan / pagos | Basic, MXN, Shopify Payments activo con Shop Pay, Apple Pay y Google Pay |
| Productos | 8 (6 activos, 2 drafts). Urban Leash 1.6m (18 variantes, $1,380–1,450), Urban Leash 1.2m (18 variantes, $1,290–1,390), Crossbody ($1,069), Long Leash 3m ($1,100), Long Leash 5m ($1,240–1,420 ⚠ inconsistencia), Collar ($500, 1 unidad) |
| Colecciones | 4 (2 sin imagen) |
| Políticas | ⚠ Solo privacidad (mar-2026). Faltan devoluciones, envíos y términos |
| SKUs / SEO meta | ⚠ **Cero**: ~50 variantes sin SKU, 8 productos sin seo.title/description |
| Contenido | 4 páginas (serie "00/02" incompleta), 3 blogs con solo 2 artículos, blog News vacío |
| Higiene | Draft duplicado del Leash 1.6m, Traffic Handle en draft desde marzo, idiomas mezclados EN/ES |

### 1.2 Tema (KYNStudioRebranded)

- **Tiene:** 12 plantillas (home, producto, colección, carrito, búsqueda, blog, artículo, página, 404, gift card), 20 secciones, PDP de 854 líneas con swatches + zonas de personalización (line item properties) + acordeones + JSON-LD Product/BreadcrumbList, panel de accesibilidad de lectura en blog (único en su clase), newsletter funcional.
- **Falta (alta):** `templates/customers/*` (el header enlaza a cuenta y no hay plantillas), carrito AJAX/drawer, filtros y orden en colección, búsqueda predictiva, cross-sell/quick-add, enlaces legales reales en footer, `canonical`/`og:url`/`og:type`, JSON-LD Organization/WebSite.
- **Falta (media):** WOFF2+preload de fuentes propias (hoy OTF de 161KB), srcset en hero/featured, skip-link, `aria-live` en precio, `prefers-reduced-motion`, app de reviews verificadas (el hook `@app` del PDP ya existe), llaves de locales (casi todo el copy está hardcodeado).
- **Bugs menores detectados:** badge "new ♥" del PDP siempre visible (hardcodeado), swatch de tarjeta usa el nombre del color como hex (`'#'+value` — casi siempre inválido), announcement-bar fuera de `header-group.json`, llaves `reading.prev/next` inexistentes en locales.
- **Nada de 3D/constructor en el código** — este plan lo introduce.

### 1.3 Constructor 3D (kyn-catalogo → `/constructor`)

- **Stack:** isla Preact `client:only` — `src/components/ConstructorKyn.tsx` (1,485 líneas) + `ConstructorKyn.css` (325) + `src/lib/correa3d.ts` (339). Three.js **0.166 vanilla** (sin react-three-fiber). Astro solo aporta el `<head>`.
- **Assets 3D:** carga 5 GLB con Draco (~1.85 MB: mosquetón perno/gatillo, d-ring, tornillos) + decoder Draco local (756 KB en `public/draco/`). Las **tiras de biothane se generan por código** (ExtrudeGeometry 19mm×2mm deformada por vértice) — no dependen de archivos.
- **Flujo:** ritual de 3 pasos con coreografía de cámara (color tira corta + largo 1.2/1.6m → color tira larga → armado final con agarradera). Herrajes siempre dorados (regla de marca). Respeta `prefers-reduced-motion`.
- **Estado:** vive completo en la URL (`?color&color2&largo&paso`) — "Guardar" copia el link. Sin localStorage.
- **Precio:** `src/data/precios.ts` — urban-leash $1,480 línea / $1,221 persona / $989 familia. Los códigos (stelar + 8 nombres) viven **en el cliente** a propósito (no cobran nada, solo arman el mensaje).
- **Cierre:** botón "Pedirla por WhatsApp" → `wa.me/524431380260` con la config en texto. **No hay checkout.**
- **Placa del nombre:** apagada con `MOSTRAR_NOMBRE=false` (commit 20270ea); todo el código sigue listo para reactivarse.
- **Acoplamiento: bajo.** Props resolubles con fallbacks locales (`colors.ts`, `products.ts`), CSS propio + algunos tokens de marca. **Es aislable con poco esfuerzo** — la condición que hace viable esta migración.
- ⚠ **Precios desalineados:** el constructor cobra $1,480 por ambos largos; la tienda tiene $1,290–1,390 (1.2m) y $1,380–1,450 (1.6m). Hay que reconciliar antes de migrar (sesión S3).

### 1.4 Novedades Shopify 2025–26 que le aplican a KYN

| Novedad | Qué es | Acción para KYN |
|---|---|---|
| **Agentic Storefronts + Shopify Catalog** (por defecto desde mar-2026) | Tus productos pueden aparecer dentro de ChatGPT/Copilot | Requisitos casi cumplidos (título+imagen+precio+canal Online Store ✔). La palanca que falta: **vender/enviar a compradores de EE.UU.** (la elegibilidad depende del comprador, no de dónde está la tienda). Revisar Admin → Settings → Agentic |
| **Universal Commerce Protocol** (por defecto, Summer '26) | Agentes de IA leen catálogo y arman carritos | Mantener datos de producto impecables (SKU, SEO, descripciones) — exactamente el bloque S2 |
| **Shopify Payments México** (2025) → Shop Pay | Checkout acelerado disponible para tiendas MX | Ya activo ✔ — verificar canal Shop en admin |
| **TikTok Shop México** (feb-2025) + app oficial | Social commerce con sincronización de catálogo | Canal candidato (S14); 54% de usuarios MX ya compró tras ver en TikTok |
| **Meta eliminó checkout nativo** (ago-2025) | IG/FB quedan como vitrina que redirige a tu tienda | Refuerza la importancia del checkout propio rápido (S7) |
| **3D/AR nativo** (todos los planes) | GLB (web/Android) + USDZ (iOS Quick Look) como media de producto, sin apps | Reutilizar los modelos del constructor como media AR de los PDPs (S13) |
| **Bloques de tema con IA / Sidekick coworker** (Winter '26) | Genera bloques Liquid describiendo en lenguaje natural | Útil para prototipos; revisar salida (suele quedar hardcodeada) |
| **Rollouts (A/B testing nativo)** (Winter '26) | Pruebas A/B de tema sin apps | Probar hero "Arma tu correa" vs actual (S14) |
| **Límite de variantes → 2048** (Winter '26) | Más combinaciones por producto | Da margen, pero para el constructor conviene properties, no explosión de variantes |
| **Tendencia #1 para marcas artesanales premium** | Video del proceso artesanal = mayor activo de conversión; hiper-personalización | El constructor ES la apuesta de personalización; sumar video del taller (S15) |
| Fin de checkout.liquid (26-ago-2026) y Scripts (30-jun-2026) | Solo afecta personalizaciones legacy (Plus) | Nada que migrar en plan Basic ✔ |

---

## 2. Arquitectura de la migración del constructor

### 2.1 Decisión: Ruta A — solo tema, sin app

**Elegida: el constructor se compila a un bundle JS que vive en `assets/` del tema, montado por una sección Liquid en `/pages/constructor`, y agrega al carrito con `/cart/add.js` + line item properties.**

Por qué funciona para KYN:

1. **El precio no depende de los colores** — solo del producto y el largo (1.2m vs 1.6m), y esos ya existen como 2 productos publicados con precio propio. Sin precio dinámico ⇒ no se necesita Cart Transform Function ni app.
2. **Los descuentos son porcentajes consistentes:** persona ≈ −17.5% y familia ≈ −33% sobre línea, en toda la tabla. Se convierten en **códigos de descuento nativos** (STELAR, etc.) que el checkout aplica de verdad — hoy solo maquillan el mensaje de WhatsApp y viajan en JS público.
3. **Los assets caben de sobra:** ~1.85 MB de GLB + decoder van al CDN de Shopify (Files o media de producto); `assets/` del tema no cuenta en el límite de 250 MB de código y el paquete admite 50 MB.
4. **Sin servidor que mantener:** todo estático, deploy con GitHub integration que ya usa el tema.

**Descartadas:**
- *Ruta B (app custom + theme app extension + Cart Transform):* solo necesaria con precio calculado server-side o subida de archivos vía Admin API. Overkill hoy; queda documentada como evolución si algún día el precio depende de la configuración (p. ej. largo al centímetro).
- *Ruta C (app proxy / iframe hacia Netlify):* exige crear una app igualmente, mantiene doble infraestructura y trae UX de iframe. Solo tendría sentido como puente urgente — no lo es.

### 2.2 Diseño concreto

```
kynstudio.com.mx/pages/constructor
└─ templates/page.constructor.json
   └─ sections/constructor-3d.liquid        ← nueva sección
      ├─ settings: producto 1.2m, producto 1.6m, nº WhatsApp, JSON de colores
      ├─ inyecta <script type="application/json" id="kyn-constructor-data">
      │    { variantes con id+precio reales (Liquid), colores, URLs de GLB/draco }
      ├─ <div id="kyn-constructor"> + poster/estado de carga
      └─ carga diferida de assets/constructor-kyn.js + .css   ← bundle Vite (Preact+Three)
```

- **Mapeo config → carrito:** se agrega el producto del largo elegido (1.2m o 1.6m) con una **variante "Personalizada (Constructor)"** creada en cada producto, más properties legibles para Paulette y el cliente:
  - `Tira corta: Brownstone` · `Tira larga: Petrol Blue` · `Largo: 1.6 m`
  - `_config`: JSON compacto (privado, prefijo `_`)
  - `_url`: permalink del constructor con los query params — **Paulette abre el link desde el pedido y ve la correa exacta en 3D**. Vista previa reproducible sin infraestructura de capturas.
  - Por qué variante dedicada y no las 18 existentes: el constructor permite ~99 combinaciones (11 colores de tira larga × colores de tira corta) — explosión de variantes innecesaria cuando el precio no cambia por color. Las 18 variantes actuales siguen sirviendo al PDP clásico.
- **Datos de color:** v1 congela la paleta en el bundle (fuente: `src/data/colors.ts`, que ya es el fallback de Notion) con override opcional por settings de la sección. Evolución futura: metaobjects.
- **GLB + Draco:** subir los 5 GLB a Shopify Files. El decoder Draco: probar Files primero; si el CDN rechaza `.wasm`, fallbacks en este orden — decoder JS de Draco, o re-exportar los GLB sin compresión Draco (pesan poco; sin Draco seguirían siendo manejables).
- **WhatsApp no muere:** queda como CTA secundario ("¿Dudas? Pídela por WhatsApp") — es el canal que hoy vende.
- **Estado en URL se conserva** (`?color&color2&largo&paso`): funciona idéntico en `/pages/constructor` y alimenta `_url`.
- **Placa del nombre:** migra tal cual, apagada (`MOSTRAR_NOMBRE=false`), reactivable con el flag.
- **Netlify:** el constructor original queda vivo hasta validar el nuevo; al final, redirect 301 de `kyn-catalogo.netlify.app/constructor` → `kynstudio.com.mx/pages/constructor`.

### 2.3 Riesgos técnicos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Peso del bundle (Three.js ≈ 150 KB gzip + componente) | Solo se carga en la plantilla del constructor; `defer` + montaje bajo demanda; poster estático mientras carga (pendiente de la Fase 5 del plan original — se salda aquí) |
| Dependencias de Astro (`import.meta.env`, ClientRouter) | El entry nuevo elimina todo rastro de Astro; config por JSON del DOM, no env vars |
| Tokens CSS de marca distintos entre sitios (`--pop-magenta`, `.kyn-btn` del catálogo vs `theme.css` del tema) | Shim CSS de ~20 líneas que mapea tokens del catálogo a los del tema |
| `.wasm` de Draco en el CDN | Fallbacks del §2.2 (decoder JS o GLB sin Draco) |
| Precios desalineados ($1,480 vs $1,290–1,450) | Se reconcilia en S3 **antes** de escribir código |
| Validación de configuración es 100% cliente | Aceptado (igual que hoy): el precio lo fija la variante server-side; `_config`/`_url` permiten verificación manual. La correa es made-to-order — Paulette revisa cada pedido de todos modos |
| iOS Safari / WebGL memoria | El componente ya capea pixel ratio a 2 y respeta reduced-motion; QA en S6 |

---

## 3. Plan de ejecución paso a paso

Cada sesión = una conversación de Claude Code sobre el repo indicado, con su modelo recomendado. Las sesiones producen PRs que Paulette revisa. Orden recomendado: **S1–S2 en paralelo con S3, luego S4→S5→S6 (lineal). Los bloques 3–5 después, en cualquier orden.**

**Criterio de asignación de modelo:** `Fable 5` para las dos sesiones críticas del port 3D (razonamiento profundo sobre 1,485 líneas de Three.js imperativo y arquitectura de integración); `Sonnet 5` como caballo de batalla de implementación bien definida; `Haiku 4.5` para lotes mecánicos con especificación cerrada.

---

### BLOQUE 1 — Tienda en regla (P0, ~1 sesión c/u)

#### S1 · Políticas legales completas — **Sonnet 5**
- **Repos:** tienda (Admin API) + `KYNStudioRebranded` (footer).
- **Tareas:** redactar en español de México: política de devoluciones (consistente con el acordeón del PDP: producto personalizado sin cambios/devoluciones salvo defecto), política de envíos (tiempos de fabricación artesanal + envío nacional), términos de servicio, y aviso de privacidad conforme LFPDPPP (revisar/actualizar el existente). Cargarlas como políticas de Shopify (Admin → Settings → Policies, o vía API). En el tema: reemplazar el texto plano del footer (`sections/footer.liquid:42`) por enlaces reales usando `shop.policies` + menú legal.
- **Hecho cuando:** las 4 políticas existen en `shop.shopPolicies`, el footer las enlaza, y el checkout las muestra.
- **Prompt sugerido:** «Redacta y sube las 4 políticas legales de kynstudio.com.mx (devoluciones, envíos, términos, aviso de privacidad LFPDPPP) coherentes con producto artesanal personalizado made-to-order, y enlázalas desde el footer del tema con shop.policies. El acordeón de envíos del PDP tiene el texto base.»

#### S2 · Higiene de catálogo vía API — **Sonnet 5**
- **Repo:** ninguno (Admin API / MCP de Shopify).
- **Tareas:** (1) SKUs para las ~50 variantes con esquema `KYN-{PROD}-{LARGO}-{COLOR}` (p. ej. `KYN-UL16-BRW-SKY`); (2) `seo.title` + `seo.description` para los 8 productos (60/155 caracteres, keywords: correa biothane México, correa personalizada perro, latón sólido); (3) corregir el precio de la Long Leash 5m ($1,240 vs $1,420 — confirmar cuál es el bueno con Paulette); (4) borrar el draft duplicado "Urban Leash 1.6m — Brownstone / Olive District"; (5) decidir Traffic Handle (publicar o archivar); (6) subir imagen a las colecciones Accessories y Best Sellers; (7) unificar idioma de descripciones a español (o dejar bilingüe deliberado); (8) darle opciones de color al Urban Collar (hoy "Default Title").
- **Hecho cuando:** cero variantes sin SKU, cero productos sin SEO meta, cero drafts basura, 4/4 colecciones con imagen.

---

### BLOQUE 2 — Migración del constructor 3D ⭐

#### S3 · Cimientos en Shopify para el constructor — **Sonnet 5**
- **Repo:** ninguno (Admin API) + decisiones con Paulette.
- **Tareas:**
  1. **Reconciliar precios** (decisión de Paulette): el constructor cobra $1,480 para ambos largos; la tienda $1,290–1,390 / $1,380–1,450. Definir el precio de línea canónico por largo y actualizar `precios.ts` o la tienda para que coincidan.
  2. Crear en cada producto Urban Leash (1.2m y 1.6m) la variante **"Personalizada (Constructor)"** con el precio de línea, sin tracking de inventario por color (made-to-order), y anotar sus `variant_id`.
  3. Crear códigos de descuento nativos: `STELAR` (−17.5%) y los 8 de familia (−33%), limitados si se quiere a los productos Urban Leash.
  4. Crear la página `/pages/constructor` (placeholder "próximamente" oculta del menú) para reservar la URL.
- **Hecho cuando:** existen los 2 variant_ids, los 9 códigos funcionan en un checkout de prueba, y los precios coinciden entre repos y tienda.

#### S4 · Extraer y empaquetar el constructor — **Fable 5**
- **Repo:** `kyn-catalogo`, rama `claude/kyn-store-plan-3d-migration-7tnhh3`.
- **Tareas:**
  1. Crear build Vite en modo librería (IIFE) con entry nuevo `src/embed/constructor-embed.tsx`: monta `ConstructorKyn` en `#kyn-constructor` leyendo su configuración de `#kyn-constructor-data` (JSON en el DOM): colores, variantes `{largo → {variantId, precio}}`, URLs de GLB, ruta del decoder Draco, número de WhatsApp.
  2. Refactor mínimo de `ConstructorKyn.tsx`: sustituir imports de `precios.ts`/props de Astro por la config inyectada; parametrizar las rutas `/models/*` y `/draco/`; **eliminar la lógica de códigos de descuento del cliente** (la reemplaza el checkout; el campo de código puede quedar como "tu código se aplica al pagar" o desaparecer); añadir callback `onAddToCart(config)` que el host conecta (en el catálogo seguirá siendo WhatsApp; en Shopify será `/cart/add.js`).
  3. Shim CSS de tokens (`--pop-magenta` etc. → variables del tema) como archivo aparte.
  4. Salida: `dist-shopify/constructor-kyn.js` + `constructor-kyn.css` + manifiesto de assets a subir (lista de GLB + draco). Harness HTML local (`dist-shopify/preview.html`) con datos mock para probarlo sin Shopify.
  5. **No romper el sitio actual:** `/constructor` en Netlify sigue funcionando con el mismo componente refactorizado.
- **Hecho cuando:** `preview.html` local muestra el ritual completo idéntico al de producción, el callback dispara con la config correcta, y `npm run build` del sitio Astro sigue verde.
- **Por qué Fable 5:** es el corazón del proyecto — refactor quirúrgico de un componente de 1,485 líneas con coreografía de cámara y deformación de mallas por frame, donde un error sutil (disposal de la escena, dependencias del useEffect, rutas de assets) rompe la experiencia sin lanzar errores.

#### S5 · Integración al tema Shopify — **Fable 5**
- **Repo:** `KYNStudioRebranded`, rama `claude/kyn-store-plan-3d-migration-7tnhh3`.
- **Tareas:**
  1. Copiar el bundle a `assets/` y crear `sections/constructor-3d.liquid` con schema: pickers de los 2 productos, nombre de la variante "Personalizada", número de WhatsApp, JSON de colores (override opcional), URLs de assets 3D.
  2. La sección genera el JSON de datos con Liquid (variant ids + precios **reales** del producto — nunca hardcodeados), renderiza `#kyn-constructor` con poster/skeleton de carga, y carga JS/CSS con `defer` solo en esta plantilla.
  3. `templates/page.constructor.json` + asignarla a la página creada en S3.
  4. Subir GLB + decoder a Shopify Files (con los fallbacks Draco del §2.3) y cablear las URLs.
  5. Implementar `onAddToCart`: POST `/cart/add.js` con la variante del largo elegido + properties (`Tira corta`, `Tira larga`, `Largo`, `_config`, `_url`) → redirigir a `/cart` (cuando exista el drawer de S7, abrirlo en su lugar). CTA secundario de WhatsApp intacto.
  6. Verificar que `main-cart.liquid` y las notificaciones de pedido muestran las properties legibles y ocultan las `_privadas`.
- **Hecho cuando:** en el theme preview, un usuario arma una correa, la agrega al carrito con el precio correcto de la variante, el pedido de prueba muestra colores y `_url` en el admin, y abrir `_url` reproduce la correa en 3D.

#### S6 · QA, lanzamiento y redirect — **Sonnet 5**
- **Repos:** ambos + Netlify + admin.
- **Tareas:** pedido real de prueba end-to-end (con y sin código de descuento, móvil iOS + Android, `prefers-reduced-motion`); Lighthouse móvil de `/pages/constructor` (meta: LCP < 3s con poster); revisar peso transferido; apuntar el CTA del hero del home ("Arma tu set") al constructor; añadirlo al menú principal; redirect 301 en `netlify.toml` de `/constructor` → `kynstudio.com.mx/pages/constructor`; avisar en redes (con la skill kyn-social).
- **Hecho cuando:** hay al menos un pedido de prueba completado y reembolsado, el redirect vive, y el hero enlaza al constructor.

---

### BLOQUE 3 — Conversión (P1)

#### S7 · Carrito AJAX + drawer — **Sonnet 5**
`KYNStudioRebranded`: mini-cart drawer (abre al agregar desde PDP y constructor), actualización de cantidades y eliminación de línea vía `/cart/change.js` sin recargar, contador burbuja en el header, nota de pedido, barra de progreso de envío. Respetar el render de properties del constructor.

#### S8 · Cuentas de cliente — **Sonnet 5**
**Recomendación: activar las cuentas nuevas de Shopify** (login por código, alojadas — no requieren plantillas) y verificar que `routes.account_url` del header aterrice bien. Alternativa solo si se quiere branding total: crear `templates/customers/*` (login, register, account, order, addresses, reset_password) — 6 plantillas, una sesión completa.

#### S9 · Colección pro + búsqueda predictiva — **Sonnet 5**
Filtros con `collection.filters` (configurar facetas en la app gratuita Search & Discovery: color, largo, precio), `sort_by`, conteo de resultados; overlay de búsqueda predictiva (Predictive Search API) desde el icono del header.

#### S10 · Cross-sell + quick-add + reviews — **Sonnet 5**
Sección "Combina con" en PDP usando la Product Recommendations API (el Crossbody con la Leash — los bundles de `precios.ts` son la guía de qué recomendar); quick-add en `product-card.liquid` (y de paso corregir el bug del swatch hex); instalar app de reseñas verificadas (Judge.me gratuito) en el bloque `@app` del PDP que ya existe — sin tocar la sección de testimonios manuales (el README ya advierte no marcarlos como schema Review).

---

### BLOQUE 4 — SEO / Performance / A11y (P1–P2)

#### S11 · Lote mecánico de fixes — **Haiku 4.5**
Especificación cerrada, en `KYNStudioRebranded`:
- `layout/theme.liquid`: `<link rel="canonical" href="{{ canonical_url }}">`, `og:url`, `og:type` condicional (product/article/website), JSON-LD Organization (logo, sameAs con las 5 redes) y WebSite.
- `main-product.liquid:52`: condicionar el badge "new ♥" al tag `new`.
- `header-group.json`: incluir announcement-bar.
- `aria-live="polite"` en el precio del PDP; skip-link en `theme.liquid`; `prefers-reduced-motion` para los videos autoplay de story/video-spotlight.
- Añadir llaves faltantes a `locales/` (`reading.prev/next`, textos de búsqueda en inglés hardcodeados).

#### S12 · Performance de fuentes e imágenes — **Sonnet 5**
Convertir Farmhouse/Friendship a WOFF2 + `preload`; `srcset` en hero del home, featured-products y banner de colección; mover el JS inline repetido de secciones a `assets/` con `defer`; hacer configurable el texto de meses sin intereses de Mercado Pago (hoy hardcodeado).

---

### BLOQUE 5 — Crecimiento y novedades (P2)

#### S13 · 3D/AR nativo en los PDPs — **Sonnet 5**
Exportar un GLB de la correa armada (reutilizando `correa3d.ts`/laboratorio) + USDZ, subirlos como media de producto y dejar que la galería del PDP los muestre con `model_viewer_tag` → botón "Ver en tu espacio" (AR) gratis en todos los planes. Diferenciador premium de costo casi cero una vez migrado el constructor.

#### S14 · Canales y comercio agéntico — **Sonnet 5** (mitad guía para Paulette)
Checklist Admin → Settings → Agentic (toggles de Catalog por canal); evaluar abrir mercado EE.UU. con Shopify Markets (la palanca para aparecer en ChatGPT/Copilot — decisión de negocio: envíos internacionales); conectar TikTok Shop México con la app oficial; verificar canal Shop; probar Rollouts (A/B nativo) con el hero del constructor.

#### S15 · Contenido — **Paulette + skills kyn-social / dopaminique**
Publicar los borradores listos en `blog-borradores/` (el 03 nunca se publicó; incluyen HTML + guía de pegado); llenar el blog News o eliminarlo; completar la serie de páginas 00/01/02 (falta la 01); video corto del proceso artesanal (biothane + latón + costura) — la tendencia de mayor conversión 2026 para marcas artesanales — enlazado a producto con la sección video-spotlight que ya existe.

---

## 4. Mapa de dependencias y orden sugerido

```
Semana 1:  S1 (políticas)  ─┐
           S2 (catálogo)   ─┼─ independientes entre sí
           S3 (cimientos)  ─┘
Semana 2:  S4 (bundle)  →  S5 (tema)          ← lineales, el corazón
Semana 3:  S6 (QA + lanzamiento constructor)
Después:   S7 → mejora el add-to-cart del constructor (drawer)
           S8–S12 en cualquier orden
           S13 reutiliza los GLB del constructor
           S14–S15 continuo
```

**Definición de éxito del proyecto:** una clienta arma su correa en `kynstudio.com.mx/pages/constructor`, paga con Shop Pay aplicando (o no) un código, y Paulette abre `_url` desde el pedido y ve exactamente la correa que tiene que fabricar — sin WhatsApp de por medio, con WhatsApp aún disponible para quien lo prefiera.

---

## Anexo · Fuentes de la auditoría

- Código: `KYNStudioRebranded` (rama main @ f216a07) y `kyn-catalogo` (main @ 578fc9a, incluye su `PLAN.md` de 6 fases del constructor).
- Tienda viva: Admin API (productos, colecciones, políticas, tema publicado, pagos, páginas, blogs) — 27-ago-2026.
- Novedades Shopify: Editions Winter '26 "RenAIssance" (10-dic-2025) y Summer '26 (17-jun-2026), changelog y help center de Shopify Catalog/Agentic, cobertura del ecosistema (fechas trianguladas en múltiples fuentes).
- Técnica de migración: shopify.dev — arquitectura de temas y límites de assets, Ajax Cart API y line item properties, Cart Transform Functions, media 3D (`model_viewer_tag`), app proxies, theme app extensions.

# KYN · Revisión de lanzamiento del rebrand

**Fecha:** 8 de septiembre de 2026
**Tienda:** kynstudio.com.mx (plan Basic, MXN, idioma único: español)
**Tema revisado:** este repo, conectado a Shopify como `KYNStudioRebranded/main` (sin publicar). El tema vivo hoy es `kynStudio/main` (repo anterior). Lanzar = publicar este tema.

## 1. Resumen en tres líneas

1. **El tema no podía lanzarse como estaba.** La página de producto y la búsqueda tenían errores de sintaxis Liquid (Shopify muestra un error en lugar de la galería y el botón de compra), el carrito no permitía cambiar cantidades ni quitar productos, no existía plantilla de contraseña ni de contacto, y buena parte de la interfaz estaba en inglés.
2. **Este PR deja el código listo para publicar.** Todo lo anterior está corregido y validado (theme-check sin errores, parser Liquid estricto sin errores, esquemas JSON verificados contra las plantillas). Los detalles están en la sección 2.
3. **Lo que falta no es código: son decisiones y configuración en el admin de Shopify.** Políticas legales, menús, textos del home, reseñas, etiquetas de productos y verificar los meses sin intereses. Está todo en la sección 3, en orden de prioridad, con el paso exacto en el admin.

## 2. Corregido en este PR

### Bloqueantes (la tienda no funcionaba)

| # | Problema | Dónde | Arreglo |
|---|---|---|---|
| 1 | Error de sintaxis Liquid en la galería del PDP: filtros encadenados dentro de argumentos de `image_tag`. Toda la página de producto fallaba. | `sections/main-product.liquid` | Los valores se calculan con `assign` antes del tag. Verificado con el parser estricto de Liquid. |
| 2 | Error de sintaxis en la búsqueda: el texto `{{ terms }}` dentro de un string cerraba el tag. La página /search fallaba en cada consulta. | `sections/main-search.liquid` | El marcador ahora es `[terms]` (en el ajuste y en el código). |
| 3 | Carrito sin forma de aplicar cambios: los botones +/− solo cambiaban el número; el único submit era "Finalizar compra". | `sections/main-cart.liquid` | Los cambios de cantidad se aplican al instante (recarga), hay enlace "Quitar" por línea, botón "Actualizar carrito", nota de pedido y descuentos visibles. |
| 4 | Sin enlaces legales: el pie decía "Terms · Privacy · Accessibility" como texto plano y la Política de privacidad no se enlazaba en ningún lado. | `sections/footer.liquid` | Columna "Legales" automática con las políticas publicadas de Shopify y enlace a privacidad en la línea inferior. |
| 5 | Sin plantilla de contraseña: `layout/password.liquid` existía pero no había `templates/password.*`, así que Shopify no podía usar la página propia. | `templates/password.json`, `sections/main-password.liquid` | Página de contraseña nueva en español, con mensaje del admin, captura de email y redes. |
| 6 | Claves de traducción `reading.prev/next` inexistentes: los artículos mostrarían "Translation missing". | `locales/*.json` | Claves agregadas. |

### Compra y producto

- El selector de variantes arrancaba siempre desde la primera variante, ignorando `?variant=` y la variante preseleccionada por Shopify. Ahora usa la variante real.
- El cambio de foto por variante comparaba ids de imagen contra ids de media (nunca coincidían). Ahora usa `featured_media` y conserva `srcset`.
- Precio tachado que no se actualizaba al cambiar variante. Ahora sí.
- Cantidad sin tope: para productos con inventario controlado (el collar tiene 1) el stepper respeta el máximo.
- El campo de personalización "Obligatorio" no hacía nada (`novalidate`). Ahora bloquea el envío, abre la zona y marca el campo.
- La zona de personalización no podía cerrarse (`display:flex` ganaba al atributo `hidden`). Corregido con un reset global de `[hidden]`.
- El formulario ahora es `{% form 'product' %}`, así que "Comprar ahora" (Shop Pay, Apple Pay, Google Pay) funciona de verdad cuando se activa.
- El badge "new ♥" salía en todos los productos; ahora solo con etiqueta `new` o `new-drop`.
- La leyenda de meses sin intereses y el texto de "Pago seguro" ahora son ajustes de la sección (se pueden apagar o editar). Ver sección 3, punto 5.
- Las pestañas Materiales / Cuidado / Envío ahora son editables desde el personalizador y enlazan las políticas de envío y devoluciones cuando existen. Se quitó la afirmación de que el latón es "sin zinc" (el latón es cobre + zinc).
- La vista previa del grabado usaba Farmhouse, que convierte é→e y ñ→n ("Piñón" se veía "Pinon"). Ahora usa Friendship, que sí tiene acentos.
- Las tarjetas de producto muestran "Agotado", los puntos de color de los acabados reales (Primary/Secondary Finish) y precio "desde" cuando varía.
- La subida de imagen en personalización usaba un nombre de propiedad inválido (`[image]`). Corregido.

### Interfaz en español

Header (Carrito, Menú, Buscar, Cuenta), búsqueda completa, página 404, lista de colecciones ("N productos"), blog ("Leer más", fechas localizadas), paginación ("Anterior/Siguiente"), títulos de pestaña ("Página 2"), badges de producto, pie de página, barra de anuncios, página de contraseña y los textos por defecto de todas las secciones. Todo vive en `locales/es.json` (y `en.default.json`).

### SEO y redes

- `canonical`, `og:url`, `og:type`, `og:locale`, precio del producto en Open Graph.
- `og:image` era una URL sin protocolo (`//…`); WhatsApp, Facebook e Instagram no mostraban imagen. Ahora es `https://…`. El fallback ya no es un SVG.
- JSON-LD: `Organization` + `WebSite` en el home, `BlogPosting` en artículos, `AggregateRating` en producto cuando Judge.me tiene reseñas, URL canónica del producto (sin la colección) en el JSON-LD.

### Accesibilidad y móvil

- Enlace "Ir al contenido", `<nav>` con etiqueta, foco visible en botones, swatches, miniaturas, campos e inputs de cantidad.
- `aria-live` en el precio (los lectores de pantalla anuncian el cambio de variante), etiquetas en los campos de personalización y en los controles del carrito, estrellas de reseñas con texto alternativo.
- El menú móvil ahora aparece hasta 1100 px (antes, entre 900 y ~1150 px el menú se encimaba con los íconos).
- Miniaturas del PDP con scroll horizontal en móvil (antes forzaban scroll de toda la página).
- Fotos de producto con `object-fit: contain` en PDP y tarjetas (las correas largas perdían ~40 % de la imagen con `cover`).
- Botón de opciones de lectura ya no tapa la primera línea del artículo en móvil; los controles de lectura ya no anulan el tamaño de texto del personalizador.
- Hero con `srcset` y `fetchpriority`, imágenes de tarjetas responsivas, fuente Friendship precargada, `playsinline`/`preload` en videos.

### Personalizador (theme editor)

- Las secciones `main-*` solo aparecen en su plantilla (`enabled_on`); las secciones de marketing no aparecen en header/footer.
- Barra de anuncios ahora tiene preset (se puede agregar desde el editor) y textos en español.
- Sección de reseñas acepta bloques de app (Judge.me) y ya no trae testimonios inventados por defecto. En el home quedó **desactivada** porque no tenía bloques (mostraba un título sobre un espacio vacío).
- Plantilla de contacto (`page.contact`) con formulario real.
- Enlaces del home: "Ver todo" → /collections/all, "Conoce la historia" → /pages/our-story, y los swatches de colores ya no son enlaces vacíos. Se quitó el letrero "P R O X I M A M E N T E" del hero (estaba junto al botón que vende el collar).
- Tarjeta de regalo: el QR usaba la API de Google Charts (apagada); ahora usa la librería de Shopify.

## 3. Lo que falta para lanzar (plan)

Orden sugerido: **P0 antes de publicar el tema, P1 la primera semana, P2 después.** Cada punto dice quién y dónde.

### P0 · Antes de publicar (Shopify admin)

**Estado al 9 de septiembre, verificado contra la tienda por API:** ✅ ya quedó hecho (por API o en este repo); ⏳ sigue en tus manos porque esta sesión no tiene ese permiso o es una decisión tuya.

1. ⏳ **Políticas legales.** En la tienda solo existe el Aviso de privacidad (la plantilla de Shopify). Faltan Política de envíos, Política de cambios y devoluciones y Términos del servicio: los tres textos están en `POLITICAS-PARA-PEGAR.md`, listos para Configuración › Políticas (el acceso de esta sesión no incluye `write_legal_policies`). **La tarifa de envío gratis ya existe**, pero su umbral es **$1,050**, no $1,000: "Estándar" cuesta $0 desde $1,050 y $150 abajo de eso (Expreso $195, Internacional $330). El home, la pestaña de envío del PDP y las políticas dicen "mayores a $1,000", así que un pedido de $1,020 pagaría envío. Elige: bajar la condición a $1,000 en Configuración › Envíos y entregas, o me dices y cambio los textos a $1,050.
2. ✅ **Menú del pie "Nosotros".** Creado por API: Nuestra historia, Por qué Biothane, Por qué latón sólido, Contacto, Buscar.
3. ✅ **Página de contacto.** Título "Contacto" y plantilla `page.contact` asignada.
4. ✅ **Logo del header.** El tema usa el wordmark horizontal incluido (`assets/kyn-logo.png`). Si quieres otro archivo, súbelo en Personalizar › Header.
5. ✅ **Meses sin intereses.** Decisión: 6 MSI con Mercado Pago; la leyenda del PDP sigue activa. Solo confirma en Configuración › Pagos que Mercado Pago tenga las cuotas activadas.
6. ⏳ **Reseñas.** No hace falta Judge.me: la sección Reviews del home acepta bloques manuales (estrellas, cita, nombre, nombre del perro y foto opcional). Mándame las reseñas reales, con permiso de las clientas, y las cargo en `templates/index.json`; o agrégalas tú en Personalizar › Reviews › Agregar bloque y activa la sección (hoy está desactivada). Judge.me queda como opción para más adelante, si quieres que las clientas las escriban solas desde el correo posterior a la compra.
7. ✅ **Textos del home.** Corregidos en `templates/index.json`. Queda uno: el título del video spotlight sigue diciendo "Algo lindo está por llegar" (era teaser de prelanzamiento). Dime el texto nuevo o cámbialo en Personalizar › Video spotlight. El video se queda.
8. ✅ **Color story.** Skyline Blue / Olive District / Brownstone, notas en español y enlace a la colección.
9. ⏳ **Nombres de archivos.** Imágenes: listo. Las tres `ChatGPT_Image_…png` de The Urban Leash ahora se llaman `kyn-urban-leash-01/02/03.png` y tienen texto alternativo. Videos: la API de Shopify solo permite renombrar imágenes y archivos genéricos, no videos, y esta sesión no puede descargarlos del CDN para resubirlos con otro nombre. El paso es tuyo: en Contenido › Archivos sube los mismos videos con estos nombres y avísame para apuntar el tema a los nuevos (o elígelos tú en Personalizar › Story y Video spotlight). Los originales no se tocaron porque el tema publicado hoy los usa.

   | Video actual | Súbelo como | Dónde se usa |
   |---|---|---|
   | `mp_.mp4` | `kyn-historia-01.mp4` | Story, video 1 (tema nuevo y tema en vivo) |
   | `Puedes_cambiar_el_fondo_a_Peri.mp4` | `kyn-historia-02.mp4` | Story, video 2 (tema nuevo y tema en vivo) |
   | `gemini_generated_video_207DBF5A.mp4` | `kyn-spotlight.mp4` | Video spotlight (tema nuevo) |
   | `Whisk_m2n3ymnlbznmljz40iykjgotitm0qtl1mgn40so.mov` | `kyn-clip-01.mov` | Tema en vivo |
   | `Whisk_m2n3ymnlbznmljz40iykjgotitm0qtl1mgn40so.mp4` | `kyn-clip-01.mp4` | Sin uso |
   | `gemini_generated_video_2C3E92CC.mp4` | `kyn-clip-02.mp4` | Sin uso |

   Cuando el tema nuevo esté publicado, los archivos viejos se pueden borrar desde Contenido › Archivos.
10. ✅ **Personalización.** El bloque de grabado se quitó de la plantilla de producto (ningún producto se graba por ahora). Sigue disponible en el editor para cuando vuelva.
11. ✅ **Etiquetas.** `best-seller` en The Urban Crossbody y The Urban Leash 1.6 m. Si quieres el badge "new ♥" en algún producto, etiquétalo `new`.
12. ⏳ **Catálogo.** Siguen en borrador Traffic Handle y el duplicado "The Urban Leash 1.6m — Brownstone / Olive District" (borrar o activar). La Long Leash 5m tiene Olive District a $1,240 y los otros dos acabados a $1,420: confirmar cuál es el bueno. El Urban Collar ya tiene 20 piezas a $500 (resuelto). Sin SKUs ni títulos SEO (ver PR #42).
13. ⏳ **Publicar y redirigir.** El tema en vivo sigue siendo `kynStudio/main`; `KYNStudioRebranded/main` ya tiene todo lo mergeado hasta el PR #45 (incluidos los modelos `.glb` y el descodificador `.wasm` del constructor, verificado por API). Antes de publicar, anotar las URLs del tema anterior que cambian y crear redirecciones (Navegación › Redirecciones de URL). Quitar la contraseña de la tienda al final.
14. ✅ **Constructor 3D (PR #45).** "Diseña la tuya" en la galería de las dos Urban Leash, pintado por los círculos de acabado. Pendientes suyos, ninguno bloquea el lanzamiento: probarlo en un iPhone y un Android reales (aquí solo hubo render por software), conectar el slider cuando exista el modelo en kyn-catalogo, y si quieres saber cuánta gente lo usa, agregar un evento de analítica al tocar "Diseña la tuya".

### P1 · Primera semana (código, este repo)

- **Carrito AJAX / drawer.** Hoy cada cambio de cantidad recarga la página y agregar al carrito manda a /cart. Está planeado como sesión S7 en el PR #42.
- **Contraste de marca (decisión de diseño).** Blanco sobre periwinkle #8795D2 da 2.89:1 en los botones primarios y en el hero; el spark word periwinkle sobre crema da 2.77:1. WCAG pide 4.5:1 (3:1 en texto grande). La opción con menos cambio visual es usar periwinkle-700 (#5562A4) para botones, spark y hero. No lo cambié porque altera el look de la marca: es una decisión de Paulette.
- **Fondo de página.** El body usa periwinkle-200 fijo y el ajuste "Page background" del tema no hace nada. Si el lila es intencional, quitar el ajuste; si no, hacer que el body use `--surface-page`.
- **Fuentes.** Convertir Friendship y Farmhouse a WOFF2 (hoy OTF, 160 KB) y revisar la regla del sistema de diseño "títulos en Friendship" vs. los H1/H2 en Hanken 800 que usa el tema.
- **Colección.** Filtros y ordenamiento (`collection.filters` + Search & Discovery), búsqueda predictiva desde el ícono del header.
- **Movimiento.** Pausar videos con `prefers-reduced-motion` y ofrecer control de pausa (WCAG 2.2.2).
- **Encabezados.** Revisar jerarquía h1→h2 en el home (trust band ya no usa h4; el pie usa h2 con estilo de eyebrow).

### P2 · Después

- Ver el plan maestro del PR #42 (constructor 3D, cross-sell, canales, 3D/AR, contenido). Nada de eso bloquea el lanzamiento.
- Metafields opcionales que el tema ya lee: `custom.tagline` (texto), `custom.materials` y `custom.care` (texto enriquecido), `kyn.short_desc` (texto corto para la tarjeta). Definirlos en Configuración › Datos personalizados › Productos si quieres textos por producto.
- Publicar el tercer borrador del blog (`blog-borradores/03-…`) y borrar u ocultar el blog "News" (vacío).

## 4. Checklist del día del lanzamiento

- [ ] Políticas pegadas desde `POLITICAS-PARA-PEGAR.md` (abrir el pie y la pestaña de envío del PDP).
- [ ] Umbral de envío gratis alineado: hoy la tarifa arranca en $1,050 y el sitio promete $1,000.
- [x] Menú "Nosotros" del pie completo.
- [x] Página Contacto con plantilla `page.contact`.
- [ ] Enviar un mensaje de prueba desde /pages/contact.
- [x] Logo horizontal en el header (revisar que se vea bien en móvil).
- [ ] Cuotas de Mercado Pago confirmadas en Configuración › Pagos.
- [ ] Sección Reviews: con reseñas reales o desactivada (hoy está desactivada).
- [ ] Título del video spotlight cambiado ("Algo lindo está por llegar").
- [ ] Videos resubidos con los nombres nuevos y el tema apuntando a ellos.
- [ ] Pedido de prueba completo: elegir acabados en una correa de 18 variantes, cambiar cantidad en el carrito, quitar un producto, pagar con Shop Pay y reembolsar.
- [ ] Probar en iPhone y Android: hero, PDP (miniaturas y "Diseña la tuya"), carrito, menú.
- [ ] Compartir un enlace de producto por WhatsApp y confirmar que sale la imagen.
- [ ] Decidir el catálogo: Traffic Handle y el duplicado de la Urban Leash (borrador), precio de la Long Leash 5m Olive District.
- [ ] Publicar el tema, crear redirecciones, quitar contraseña.

## 5. Cómo se hizo esta revisión

Lectura completa del tema (~6,700 líneas), theme-check de Shopify, parser Liquid estricto, verificación cruzada de plantillas JSON contra esquemas, datos reales de la tienda por Admin API (productos, variantes, colecciones, menús, políticas, metafields, apps), y una auditoría en paralelo de ocho revisores (Liquid, compra, SEO, accesibilidad, contenido, editor, JavaScript y marca) que produjo 200 hallazgos; cada uno se contrastó contra el código antes de corregirlo o pasarlo a este plan.

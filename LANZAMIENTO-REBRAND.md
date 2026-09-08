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

### P0 · Antes de publicar (Shopify admin, ~2 horas)

1. **Políticas legales.** Configuración › Políticas. Crear *Política de envíos*, *Política de devoluciones* y *Términos del servicio*, y revisar el *Aviso de privacidad* (LFPDPPP). El tema ya las enlaza solo (pie de página y pestaña "Envío y devoluciones" del PDP). Deben coincidir con lo que promete el home: "Envíos gratis en todos nuestros productos" y "1 año de garantía en defectos de construcción" (sección Trust band). Si alguna de esas dos promesas no va, editar la sección.
2. **Menú del pie "Nosotros".** Tienda online › Navegación › menú "footer" (hoy solo tiene "Search"). Sugerido: Nuestra historia (/pages/our-story), Por qué Biothane (/pages/why-biothane), Por qué latón sólido (/pages/why-solid-brass), Contacto (/pages/contact), Buscar (/search). Opcional: renombrar "All About Our Dogs" en el menú principal.
3. **Página de contacto.** Tienda online › Páginas › "Contact": cambiar el título a "Contacto" y asignarle la plantilla **page.contact** (aparece después de publicar/sincronizar este tema).
4. **Logo del header.** El archivo actual (A-2.png) es 4:3 y a 30 px de alto se ve como un cuadrito de 40 px. Subir un wordmark horizontal (PNG transparente o SVG) en Personalizar › Header, y ajustar "Logo height".
5. **Meses sin intereses.** Configuración › Pagos: confirmar que Mercado Pago (o el proveedor activo) tiene meses sin intereses. Si no, desactivar "Mostrar leyenda de pagos a meses" en Personalizar › Product information. Publicar una promesa de MSI que el checkout no cumple es un riesgo con PROFECO.
6. **Reseñas.** Decidir: (a) agregar el bloque de app de Judge.me a la sección Reviews del home y a la plantilla de producto (ya soportan bloques de app), o (b) escribir reseñas reales con permiso de las clientas, o (c) dejar la sección oculta como quedó. No usar nombres inventados.
7. **Textos del home.** Revisar en Personalizar › Página de inicio: "Algo lindo está por llegar." (video spotlight: era teaser de prelanzamiento), eyebrow "Best sellers" (en inglés y la colección mostrada es The KYN Walking System), "Construídos por orden" → "Construidos bajo pedido", "increible." → "increíble.", "Enjuaga y listo!" → "¡Enjuaga y listo!", "Batches pequeños… in-house" → "Lotes pequeños, cortado y ensamblado en casa".
8. **Color story.** Los swatches dicen Periwinkle / Dark Navy / Olive / Camel con notas en inglés, pero los acabados que se venden son Skyline Blue / Olive District / Brownstone. Renombrar, poner notas en español y enlazar cada uno (por ejemplo a /collections/all).
9. **Videos generados por IA.** El video spotlight (`gemini_generated_video…`) y uno de los videos de la sección Story (`Puedes_cambiar_el_fondo_a_Peri.mp4`) son generados. Para una marca hecha a mano conviene material real del taller o quitar la sección.
10. **Personalización por producto.** El bloque "Personalizar nombre" sale en todos los productos (correas largas, crossbody, collar). Decidir cuáles se graban. Si no son todos: duplicar la plantilla de producto (product.personalizable) con el bloque y asignarla solo a los grabables, y quitar el bloque de la plantilla base. Conciliar con la opción "Personalization: No/Si" del producto en borrador.
11. **Etiquetas de productos.** El tema usa `new` / `new-drop` (badge "new ♥"), `best-seller` y `personalize`. Hoy ningún producto las tiene. Etiquetar lo que corresponda.
12. **Catálogo.** Traffic Handle está en borrador desde marzo; hay un borrador duplicado "Urban Leash 1.6m — Brownstone / Olive District"; la Long Leash 5m tiene variantes a $1,240 y $1,420 (confirmar cuál es el bueno); el Urban Collar (destino del botón secundario del hero) tiene 1 unidad y una sola variante sin acabados. Sin SKUs ni títulos SEO (ver PR #42, sesión S2).
13. **Publicar y redirigir.** Tienda online › Temas › publicar `KYNStudioRebranded/main`. Antes, anotar las URLs del tema anterior que cambian y crear redirecciones (Navegación › Redirecciones de URL). Quitar la contraseña de la tienda al final.

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

- [ ] Políticas creadas y enlazadas (abrir el pie y la pestaña de envío del PDP).
- [ ] Menú "Nosotros" del pie completo.
- [ ] Página Contacto con plantilla `page.contact` (enviar un mensaje de prueba).
- [ ] Logo horizontal en el header, visible en móvil.
- [ ] Leyenda de meses sin intereses confirmada o apagada.
- [ ] Sección Reviews: con reseñas reales o desactivada.
- [ ] Textos del home revisados (sin "próximamente", sin inglés, sin typos).
- [ ] Pedido de prueba completo: elegir acabados en una correa de 18 variantes, personalizar nombre con acento, cambiar cantidad en el carrito, quitar un producto, pagar con Shop Pay y reembolsar.
- [ ] Probar en iPhone y Android: hero, PDP (miniaturas), carrito, menú.
- [ ] Compartir un enlace de producto por WhatsApp y confirmar que sale la imagen.
- [ ] Publicar el tema, crear redirecciones, quitar contraseña.

## 5. Cómo se hizo esta revisión

Lectura completa del tema (~6,700 líneas), theme-check de Shopify, parser Liquid estricto, verificación cruzada de plantillas JSON contra esquemas, datos reales de la tienda por Admin API (productos, variantes, colecciones, menús, políticas, metafields, apps), y una auditoría en paralelo de ocho revisores (Liquid, compra, SEO, accesibilidad, contenido, editor, JavaScript y marca) que produjo 200 hallazgos; cada uno se contrastó contra el código antes de corregirlo o pasarlo a este plan.

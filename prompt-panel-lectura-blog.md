# Prompt: Panel de lectura accesible para el blog de KYN

Copia y pega esto en Claude (o tu agente de código) con acceso al tema:

---

Implementa un **panel de "Opciones de lectura"** en los artículos del blog de mi tema Shopify (KYN, Online Store 2.0). El diseño se basa en evidencia científica sobre legibilidad para personas neurodivergentes (TDAH, dislexia): lo que ayuda es dar **control al usuario** sobre tamaño, interlineado y espaciado — no fuentes "mágicas". Incluye además un modo de resaltado biónico, pero claramente marcado como **experimental**, apagado por defecto.

## Archivos del tema

- `sections/main-article.liquid` — el cuerpo del artículo es `<div class="article-body rte">{{ article.content }}</div>`. Inserta el panel justo antes, dentro del mismo `container`.
- Crea `snippets/reading-controls.liquid` (el panel) y renderízalo desde `main-article.liquid`.
- Crea `assets/kyn-reading.css` y `assets/kyn-reading.js`; cárgalos **solo** en `main-article.liquid` (con `stylesheet_tag` / `script_tag` + `defer`), no en `layout/theme.liquid`.
- Textos en `locales/` (es y en). Español mexicano por defecto, tono cálido de KYN.

## Controles (todos aplican solo a `.article-body`)

1. **Tamaño de texto**: A− / A / A+ (3 niveles: 1rem, 1.125rem ≈18px por defecto, 1.375rem). La evidencia muestra que 18pt+ mejora velocidad y comprensión.
2. **Interlineado**: normal (1.6) / amplio (1.9). Evitar extremos — interlineados <1.3 o >2 deterioran comprensión.
3. **Espaciado**: toggle "texto espaciado" que aplica los valores WCAG 1.4.12: `letter-spacing: 0.12em`, `word-spacing: 0.16em`, espacio entre párrafos 2× el tamaño de fuente.
4. **Fuente**: toggle "fuente simple" que cambia el cuerpo a la sans-serif del tema (Hanken Grotesk, ya cargada) — la evidencia favorece sans-serif sobre serif/cursivas para dislexia. No agregues OpenDyslexic ni fuentes nuevas.
5. **Resaltado biónico (experimental)**: toggle apagado por defecto, etiquetado "Experimental". Al activarlo, un script recorre los nodos de texto de `.article-body` y envuelve el primer ~40% de cada palabra (mínimo 1 letra, redondeo hacia arriba en palabras de ≤3 letras) en `<b class="rd-bionic">` con `font-weight: 600` (no 800 — el peso extremo reduce velocidad de lectura). Debe ser **totalmente reversible** al desactivarlo: guarda el HTML original y restáuralo, no intentes des-envolver. Incluye una nota breve en el tooltip/label: "la evidencia sobre esta técnica es limitada".

## Requisitos técnicos

- **Persistencia**: guarda las preferencias en `localStorage` (`kyn-reading-prefs`) y reaplícalas al cargar cualquier artículo.
- **Implementación CSS**: usa variables CSS en `.article-body` (`--rd-size`, `--rd-leading`, etc.) y clases modificadoras (`rd-spaced`, `rd-sans`), no estilos inline por elemento.
- **Accesibilidad**: botones reales con `aria-pressed`, área táctil ≥44px, foco visible, panel como `<details>` o grupo con `role="group"` y label "Opciones de lectura". El modo biónico no debe romper lectores de pantalla: `<b>` sin atributos ARIA, sin alterar puntuación ni espacios; no lo apliques dentro de `a`, `code`, `pre`.
- **No dañar nada**: no toques imágenes, embeds, blockquotes ni el resto del tema. Sin dependencias externas, JS vanilla, <5KB.
- **Ajustes del editor**: agrega en el schema de `main-article.liquid` un checkbox `show_reading_controls` (default true) y un checkbox `enable_bionic` (default true) para poder ocultar el modo experimental sin tocar código.
- **Estilo visual**: el panel debe verse KYN — usa los tokens/estilos existentes de `theme.css` (bordes redondeados, colores de marca), discreto, arriba del artículo, colapsado por defecto en móvil.

Verifica al final: renderizado correcto del Liquid, sin errores de consola, preferencias persistentes entre artículos, y que activar/desactivar biónico deja el HTML idéntico al original.

---

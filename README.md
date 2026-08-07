# KYN — Shopify theme

Shopify Online Store 2.0 theme built from the **KYN Design System**. Renders the brand's premium-whimsy site — home, collection, product (PDP), cart, blog, search — everything editable from the Shopify customizer.

> This file is a snapshot of what's actually in the repo. If you add or remove templates/sections, update this file in the same PR — an outdated README here has already caused confusion once (it said the PDP didn't exist when it did).

## What's built

- **Layout** — `layout/theme.liquid` (global wrapper: fonts, meta tags/OG, product structured data), `layout/password.liquid`
- **Templates** — home (`index.json`), product (`product.json`), collection, cart, search, blog, article, page, list-collections, 404, gift card
- **Sections** — announcement bar, header/footer (+ groups), hero, trust band, featured products, color story, story, video spotlight, reviews (manual testimonial blocks — not a reviews app), newsletter, and the `main-*` sections backing every template above
- **Snippets** — `product-card`, `product-swatches` (variant/color pills), `pdp-personalization-zone` (engraving/personalization line-item properties), `structured-data-product` (schema.org Product JSON-LD), `font-stack`, `icon`, `reading-controls`
- **Assets** — `theme.css`, `kyn-pdp.css`, `kyn-reading.css`/`.js`, brand fonts (`Farmhouse.otf`, `Friendship-Medium.otf`), `kyn-logo.png`, `kyn-preview.svg`

## Known gaps / things worth optimizing on the PDP

Found during an SEO/structured-data pass (Aug 2026):

- [ ] **App blocks not supported in `main-product`** — the section's `blocks` schema only defines `personalization_zone`; there's no `{ "type": "@app" }` block or matching `case` branch, so merchants can't add a reviews app (Judge.me, Loox), upsell widget, etc. to the PDP from the theme editor without a code change.
- [ ] **No quantity selector on the product form** — every "Agregar al carrito" click adds qty 1; there's no `<input name="quantity">`.
- [x] ~~PDP images aren't responsive~~ — fixed: gallery/hero now use `image_tag` with a `widths`/`sizes` srcset.
- [x] ~~JS price formatter hardcodes `$` + `MXN`~~ — fixed: now driven by `shop.money_format`.
- [x] ~~No `BreadcrumbList` structured data~~ — fixed: added alongside the Product JSON-LD.
- ⚠️ **Do not add `Review`/`AggregateRating` schema to `sections/reviews.liquid`** — those blocks are manually-authored marketing testimonials, not a verified-purchase reviews app. Marking them up as schema.org reviews would violate Google's structured-data guidelines (risk of a manual action).

## How to upload to Shopify

**Option A — Connect this folder to your GitHub repo, then connect Shopify to GitHub**
1. Push to `paulettecb/KYNStudioRebranded` (this repo's root **is** the theme root — no `shopify-theme/` prefix).
2. Shopify admin → Online Store → Themes → Add theme → Connect from GitHub → pick `paulettecb/KYNStudioRebranded` + branch.
3. Shopify auto-syncs on every push to that branch.

**Option B — Manual upload (faster for first preview)**
1. Zip the contents of the repo root (`assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/` — not a wrapping folder).
2. Shopify admin → Online Store → Themes → Add theme → Upload zip file.
3. Preview before publishing.

## First-time setup inside Shopify

1. **Customize → Theme settings** — add a favicon (optional).
2. **Customize → Header section** — pick your Shopify logo image (or leave blank to use the bundled `kyn-logo.png`). Pick the menu (defaults to "main-menu").
3. **Customize → Hero section** — eyebrow, title, **spark word** (must literally appear in the title, renders in Friendship script), lead, 2 CTAs, product image, "new ♥" badge toggle.
4. **Customize → Trust band** — edit/reorder/delete the 4 features; each has an icon selector.
5. **Customize → Featured products** — pick a collection; tag products `new` / `best-seller` / `personalize` to surface auto badges; optional `kyn.short_desc` metafield for the card's small description line.
6. **Product page (PDP)** — add a `personalization_zone` block per engraving/customization field you want to offer; optional metafields `custom.tagline`, `custom.materials`, `custom.care` override the default copy in those tabs.
7. **Customize → Footer** — set Instagram / TikTok / YouTube URLs; configure the 3 link columns.
8. **Announcement bar** — edit/reorder/add up to 4 messages.

## Notes on fonts & swashes

- **Hanken Grotesk** loads from Google Fonts — the workhorse font, used for everything structural.
- **Friendship** (`assets/Friendship-Medium.otf`) is referenced via `@font-face` — used for the *spark word* in hero/section headlines.
- **Farmhouse** (`assets/Farmhouse.otf`) is the signature script with PUA swash alternates. The "new ♥" hero badge uses the swash recipe: U+F00E (n.alt1) + e + U+F031 (w.alt2).
- Custom fonts are served from the Shopify CDN.

## Content drafts

`blog-borradores/` and `blog-drafts/` hold blog copy written for the storefront blog (not theme code) — leash-type comparisons, decompression walks, and an honest KYN pros/cons piece — with APA citations. `blog-borradores/shopify-html/` has the HTML-ready versions plus a paste-into-Shopify guide.

## Folder structure

```
.
├── assets/
├── config/
│   ├── settings_data.json
│   └── settings_schema.json
├── layout/
│   ├── theme.liquid
│   └── password.liquid
├── locales/
│   ├── en.default.json
│   └── es.json
├── sections/
├── snippets/
└── templates/
```

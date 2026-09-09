# KYN — Shopify theme

Shopify Online Store 2.0 theme built from the **KYN Design System**. Renders the brand's premium-whimsy site — home, collection, product (PDP), cart, blog, search, contact, password page — everything editable from the Shopify customizer. The storefront is Spanish-only (locale `es`, MXN).

> This file is a snapshot of what's actually in the repo. If you add or remove templates/sections, update this file in the same PR.

**Launch status:** see [`LANZAMIENTO-REBRAND.md`](LANZAMIENTO-REBRAND.md) — what was fixed for launch and the admin/content checklist that is still pending.

## What's built

- **Layout** — `layout/theme.liquid` (global wrapper: canonical, Open Graph, fonts, skip link, structured data), `layout/password.liquid` (shell for the password page)
- **Templates** — home (`index.json`), product (`product.json`), collection, cart, search, blog, article, page, `page.contact.json` (contact form), list-collections, 404, `password.json`, gift card
- **Sections** — announcement bar, header/footer (+ groups), hero, trust band, featured products, **bundle sets** (named sets whose price is computed from the real product prices and the pieces rule; must match the store's automatic "Arma tu set" discounts), color story, story, video spotlight, reviews (manual testimonial blocks + app blocks — not a reviews app by itself), newsletter, and the `main-*` sections backing every template above (`main-product`, `main-cart`, `main-collection`, `main-search`, `main-blog`, `main-article`, `main-page`, `main-contact`, `main-list-collections`, `main-404`, `main-password`). `main-*` sections are restricted to their template with `enabled_on`.
- **Snippets** — `product-card`, `product-swatches` (variant/colour pills), `color-hex` (single colour-name → hex map shared by cards, swatches and the 3D constructor), `pdp-3d` (the "Diseña la tuya" 3D constructor inside the product gallery, see below), `pdp-personalization-zone` (engraving/personalization line-item properties), `structured-data-product` (schema.org Product + BreadcrumbList + AggregateRating from `reviews.*` metafields), `structured-data-organization` (Organization + WebSite on the home page), `font-stack`, `icon`, `reading-controls`
- **Locales** — `locales/es.json` (the published locale) and `locales/en.default.json`. All shopper-facing chrome strings go through `| t`; section copy lives in section settings.
- **Assets** — `theme.css`, `kyn-pdp.css`, `kyn-reading.css`/`.js`, brand fonts (`Farmhouse.otf`, `Friendship-Medium.otf`), `kyn-logo.png`, `kyn-preview.svg`
- **3D constructor** — `assets/kyn-3d.js` (Three.js engine built from `constructor/`, loaded on demand), `assets/kyn-3d-bridge.js` (glue between the gallery and the engine), `assets/kyn3d-*.glb` (hardware models) and `assets/kyn3d-draco_*` (Draco decoder). Products tagged `constructor-3d` get a **Fotos / Diseña la tuya** switch in the gallery; the product's finish swatches paint the leash live (short strap = Primary Finish, long strap = Secondary Finish). See [`constructor/README.md`](constructor/README.md) for how the engine is regenerated from the `kyn-catalogo` repo.

## Validation

Run before pushing (all three are what CI would do if we had it):

```bash
# theme-check (Shopify) — expects 0 errors; RemoteAsset warnings for Google Fonts are known
npm i @shopify/theme-check-node && node -e "import('@shopify/theme-check-node').then(async m=>{const {offenses}=await m.themeCheckRun(process.cwd());console.log(offenses.filter(o=>o.severity===0))})"
# strict Liquid parse (Ruby liquid gem, Shopify-only tags stubbed) — expects 0 syntax errors
# JSON: every templates/*.json, sections/*-group.json, config/*.json, locales/*.json and {% schema %} block must parse
```

Two Liquid rules that already bit this theme once:

- Never chain filters inside a filter's named argument (`image_tag: alt: x | default: y` breaks the page). Pre-compute with `{% assign %}`.
- Never put a literal `}}` inside a string in an output tag (`replace: '{{ terms }}'` closes the tag). The search section uses `[terms]`.

## How to upload to Shopify

**Option A — GitHub integration (what the store uses today)**
1. This repo is connected to the store as theme `KYNStudioRebranded/main`; every push to `main` syncs.
2. Shopify admin → Online Store → Themes → preview `KYNStudioRebranded/main` → Publish when ready.

**Option B — Manual upload**
1. Zip the contents of the repo root (`assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/` — not a wrapping folder).
2. Shopify admin → Online Store → Themes → Add theme → Upload zip file.

## First-time setup inside Shopify

1. **Theme settings** — favicon, social sharing image (PNG/JPG), social URLs.
2. **Header** — upload a horizontal wordmark logo (tightly cropped), set logo height, pick the menu (defaults to "main-menu").
3. **Hero** — eyebrow, title, **spark word** (must literally appear in the title, renders in Friendship script), lead, 2 CTAs, product image, "new ♥" badge toggle.
4. **Trust band** — edit/reorder/delete the 4 features; each has an icon selector. Keep the claims consistent with your shipping/refund policies.
5. **Featured products** — pick a collection; "Ver todo" defaults to `/collections/all`. Tag products `new` / `new-drop` / `best-seller` / `personalize` to surface badges; optional `kyn.short_desc` metafield for the card's description line.
6. **Product page (PDP)** — add a `personalization_zone` block per engraving field; add app blocks (Judge.me widget/badge) from the editor; the installments line, trust icons and the Materials/Care/Shipping tabs are section settings; optional metafields `custom.tagline`, `custom.materials`, `custom.care` override the tabs per product. Shipping/refund policies are linked automatically when they exist.
7. **Footer** — two link columns (menus), automatic "Legales" column from `shop.policies`, Instagram / TikTok / YouTube URLs.
8. **Contact** — assign the `page.contact` template to the Contact page.
9. **Password page** — the customizer shows a "Password page" section when the store is password-protected; the admin password message takes precedence over the section text.
10. **Announcement bar** — add it to the header group from the editor (up to 4 messages).

## 3D constructor ("Diseña la tuya")

- **Where:** product gallery, only for products tagged `constructor-3d` (The Urban Leash 1.2 m and 1.6 m today) and only when the product has both finish options. Everything else is untouched; without WebGL2 or JavaScript the gallery stays as it is.
- **What drives it:** the normal variant swatches. `sections/main-product.liquid` dispatches a `kyn:variant` event on every variant change; `assets/kyn-3d-bridge.js` maps the selected values to hex through `snippets/color-hex.liquid` and repaints the 3D leash. Nothing to save: what the shopper sees is the variant that goes to the cart.
- **Length:** locked per product. Read from the `kyn.largo_m` metafield when present, otherwise `1.2` if the handle/title mentions 1.2, else `1.6`.
- **Settings:** Customizer › Product information › *Constructor 3D* — enable/disable, activating tag, and the option names for the short strap (handle) and long strap.
- **Weight:** the engine (626 KB, 165 KB gzip), decoder and models download only when someone opens "Diseña la tuya"; the product page itself does not get heavier.

## Notes on fonts & swashes

- **Hanken Grotesk** loads from Google Fonts — the workhorse font, used for everything structural.
- **Friendship** (`assets/Friendship-Medium.otf`) — used for the *spark word* in headlines and for the engraving preview (it has the Spanish accented glyphs).
- **Farmhouse** (`assets/Farmhouse.otf`) — signature script with PUA swash alternates; **it maps é→e and ñ→n and has no ♥**, so never use it for user-typed text. The "new ♥" badge uses the swash recipe: U+F00E (n.alt1) + e + U+F031 (w.alt2).
- `font-synthesis: none` is set globally so single-weight Friendship is never fake-bolded.

## Content drafts

`blog-borradores/` and `blog-drafts/` hold blog copy written for the storefront blog (not theme code) — leash-type comparisons, decompression walks, and an honest KYN pros/cons piece — with APA citations. `blog-borradores/shopify-html/` has the HTML-ready versions plus a paste-into-Shopify guide.

## Folder structure

```
.
├── assets/
├── constructor/        # source + build of assets/kyn-3d.js (not uploaded to Shopify)
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

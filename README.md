# KYN — Shopify theme (v0.1)

A new Shopify Online Store 2.0 theme built from the **KYN Design System**. Renders the brand's premium-whimsy landing page with everything editable from the Shopify customizer.

## What's in this turn (v0.1)

✅ **Theme shell, deployable**
- `layout/theme.liquid` — global wrapper with Hanken Grotesk (Google Fonts), Friendship (OTF asset), Farmhouse signature script (OTF asset)
- `assets/theme.css` — all design-system tokens + components + section layouts in one file
- `config/settings_schema.json` + `config/settings_data.json` — bare-bones global theme settings
- `locales/en.default.json` — English strings
- `templates/index.json` — homepage section order
- `templates/404.liquid` — branded 404
- `sections/announcement-bar.liquid` — promo bar with up to 4 messages (blocks)
- `sections/header.liquid` — sticky header with logo (image picker), menu (link list), search/account/cart
- `sections/hero.liquid` — full hero: eyebrow, title with **spark word** (renders in Friendship), lead, 2 CTAs, image, **script "new ♥" badge** toggle, 3 trust mini blocks
- `sections/trust-band.liquid` — 4 icon features as blocks; icon picker per block (droplets / gem / hand / truck / heart / star)
- `sections/featured-products.liquid` — collection picker, product-card grid with auto badges (`new` tag → script swash badge, `best-seller` tag → brand badge, `personalize` tag → soft badge)
- `sections/footer.liquid` — brand column + 3 configurable link columns + social URLs (Instagram / TikTok / YouTube)
- `snippets/product-card.liquid` — handles real products + placeholder fallback
- `snippets/icon.liquid` — Lucide-style inline SVG icons (search, user, shopping-bag, heart, droplets, gem, hand, truck, arrow-right, star, instagram, tiktok, youtube, check, x)
- `assets/Farmhouse.otf`, `assets/Friendship-Medium.otf`, `assets/kyn-logo.png`

## Still to build (next turns)

- `sections/personalize.liquid` — pastel-blush "Daisy" signature section
- `sections/brand-story.liquid` — oat-background story section
- `sections/reviews.liquid` — review cards (manual blocks or product reviews integration)
- `sections/newsletter.liquid` — periwinkle full-bleed signup
- `templates/product.json` + `sections/main-product.liquid` — **PDP with gallery, variant picker, charm picker** (we'll do this one together)
- `templates/collection.json`, `templates/cart.json`, `templates/page.json`, `templates/search.json`
- Optional: `templates/customers/*.liquid`

## How to upload to Shopify

**Option A — Connect this folder to your GitHub repo, then connect Shopify to GitHub**
1. Push `shopify-theme/*` to `paulettecb/KYNStudioRebranded` (this folder becomes the root of the theme — when you push, the `shopify-theme/` prefix should NOT be inside the repo; either move the contents to the root of the repo, or set Shopify's branch path to `shopify-theme`).
2. Shopify admin → Online Store → Themes → Add theme → Connect from GitHub → pick `paulettecb/KYNStudioRebranded` + branch.
3. Shopify auto-syncs on every push to that branch.

**Option B — Manual upload (faster for first preview)**
1. Zip the **contents** of `shopify-theme/` (the folders `assets/`, `config/`, `layout/`, etc., NOT the wrapping `shopify-theme/` folder itself).
2. Shopify admin → Online Store → Themes → Add theme → Upload zip file.
3. Preview before publishing.

## First-time setup inside Shopify

After installing the theme:

1. **Customize → Theme settings** — add a favicon (optional).
2. **Customize → Header section** — pick your Shopify logo image (or leave blank to use the bundled `kyn-logo.png`). Pick the menu (defaults to "main-menu" — make sure that exists under Online Store → Navigation).
3. **Customize → Hero section**:
   - Eyebrow, title, **spark word** (the brand word, e.g. "good", that renders in Friendship — must literally appear in the title)
   - Lead, button labels/links
   - Product image (1000px wide+ recommended)
   - Toggle the script "new ♥" badge
4. **Customize → Trust band** — edit/reorder/delete the 4 features; each has an icon selector.
5. **Customize → Featured products**:
   - Pick a **collection** (e.g. "Best Sellers") in the customizer; without one, the grid shows 4 placeholders.
   - Tag products as `new`, `best-seller`, or `personalize` to surface auto badges.
   - Add product metafield `kyn.short_desc` for the small description line on cards (optional).
6. **Customize → Footer** — set Instagram / TikTok / YouTube URLs; configure the 3 link columns (each picks a Shopify navigation).
7. **Announcement bar** — edit/reorder/add up to 4 messages.

## Notes on fonts & swashes

- **Hanken Grotesk** loads from Google Fonts (your design system's workhorse, used for everything structural).
- **Friendship** (`assets/Friendship-Medium.otf`) is referenced via `@font-face` — used for the *spark word* in hero/section headlines.
- **Farmhouse** (`assets/Farmhouse.otf`) is the signature script with PUA swash alternates. The "new ♥" hero badge already uses the swash recipe: U+F00E (n.alt1) + e + U+F031 (w.alt2).
- Custom fonts are served from your Shopify CDN — fast & reliable.

## Folder structure

```
shopify-theme/
├── assets/
│   ├── theme.css
│   ├── Farmhouse.otf
│   ├── Friendship-Medium.otf
│   └── kyn-logo.png
├── config/
│   ├── settings_data.json
│   └── settings_schema.json
├── layout/
│   └── theme.liquid
├── locales/
│   └── en.default.json
├── sections/
│   ├── announcement-bar.liquid
│   ├── featured-products.liquid
│   ├── footer.liquid
│   ├── header.liquid
│   ├── hero.liquid
│   └── trust-band.liquid
├── snippets/
│   ├── icon.liquid
│   └── product-card.liquid
└── templates/
    ├── 404.liquid
    └── index.json
```

## Known gaps / to-do tracker

- [ ] Personalize section (pastel-blush, Daisy signature)
- [ ] Brand story section
- [ ] Reviews section
- [ ] Newsletter section
- [ ] **Product page (PDP)** — building this together next
- [ ] Collection / cart / page / search templates
- [ ] Mobile nav (hamburger menu — currently desktop-only)
- [ ] Variant swatch metafield documentation (mapping variant `Color` option value → hex)

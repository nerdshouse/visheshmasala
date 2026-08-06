# Project: Vishesh Masala - Shopify Theme

Repo: `nerdshouse/visheshmasala` · Branch: `shopify-main`

This file is project context for Claude Code. Read it before making changes, and follow the build order in §6 unless the user directs otherwise.

## What this project is

Vishesh Masala (Dhanhar Vishesh Masala) is a 50-year-old Surat-based spice/masala D2C brand (Wankawala family). The goal: replace the current flat, static, non-animated storefront at visheshmasala.com with a fast, animation-rich Shopify theme.

Design/motion reference: thehealthfactory.in (a premium D2C food brand). Clone their animation techniques, section rhythm, and layout patterns only - never their copy, colors, fonts, icons, or product photography. Every visual element below has already been reskinned for a spice brand; don't reintroduce the reference site's cream/orange/maroon palette or health-brand language.

## 0. Setup

- Use Shopify CLI (`shopify theme init` / `shopify theme dev`) starting from the Dawn theme as the base (latest stable Dawn from Shopify/dawn on GitHub).
- Add via npm (bundled through the theme's existing asset pipeline, or a `/assets` vendor drop if no bundler is present):
  - `gsap` (+ `ScrollTrigger` plugin) - scroll-driven animation
  - `swiper` - carousels
  - `lenis` - smooth/inertia scrolling
- Set up a `theme.liquid` head include that respects `prefers-reduced-motion: reduce` - disable Lenis + gate GSAP animations behind a media-query check.
- Performance budget: mobile Lighthouse ≥ 85. Lazy-load all below-the-fold images/sections. India-first mobile network assumption (don't assume fibre-speed connections).

## 1. Design tokens

Add as CSS custom properties in `assets/base.css` (or theme settings in `config/settings_schema.json` so the merchant can tweak in theme editor):

```css
:root {
  --color-primary: #6B1E1E;      /* deep masala maroon - headers, footer, primary buttons */
  --color-accent: #E8A63A;       /* turmeric mustard - CTAs, highlights, badges */
  --color-bg: #FBF3E7;           /* warm cream - page background */
  --color-dark: #2B1A12;         /* espresso brown - full-bleed quote/footer sections */
  --color-terracotta: #C1592C;   /* category tag color 1 */
  --color-saffron: #F4C95D;      /* category tag color 2 */
  --color-sage: #6E8B5A;         /* category tag color 3 (herbs) */
  --font-display: 'Fraunces', serif;   /* headings - bold condensed slab/serif */
  --font-body: 'Inter', sans-serif;    /* body copy */
}
```

Load `Fraunces` + `Inter` via Google Fonts or self-hosted woff2 in `theme.liquid`.

## 2. Animations to implement (GSAP ScrollTrigger + Swiper + Lenis)

Build each as a reusable Liquid section + a scoped JS module:

1. **Hero kinetic headline** (`sections/hero.liquid` + `assets/hero.js`) Split the hero `<h1>` into individual `<span>` letters (SplitText pattern - GSAP SplitText or a manual span-wrap util). On page load, animate each letter from a randomized `y` offset + `rotation` (±15deg) to `y:0, rotation:0` with a staggered `ease: "power3.out"`, stagger ~0.02s. Trigger on load, not on scroll, so it fires immediately above the fold.
2. **Pinned ingredient/promise reveal** (`sections/purity-promise.liquid`) Use `ScrollTrigger.create({ pin: true, trigger: '.purity-pin', start: 'top top', end: '+=800', scrub: true })`. As the user scrolls through the pinned duration: reveal the heading text progressively (word-by-word opacity/y stagger) and scale 5 icon circles in sequentially (`0.8 → 1`, opacity `0 → 1`, staggered). Content: 5 icons = "No Fillers", "No Artificial Colour", "Stone-Ground", "Hygienically Packed", "50+ Yrs Legacy".
3. **Horizontal product/category carousels** (`sections/category-carousel.liquid`, `sections/bestsellers-carousel.liquid`) Swiper.js, `slidesPerView: 'auto'`, free-drag on touch, circular prev/next arrow buttons (round, brand-maroon bg, cream icon) on desktop, peek-next-card spacing (~15% of next card visible). Add a subtle scale-up (1 → 1.03) + shadow on the active/hovered card.
4. **Section entry animations** (global, applied via a data-attribute + IntersectionObserver-driven GSAP timeline) Any element with `data-animate="fade-up"` fades in + translates up 24px on scroll into view, once, using ScrollTrigger with `start: 'top 85%'`.
5. **Number counters** (used in trust strip: "50+ Years", "1000+ Retailers") GSAP `gsap.to()` tweening a `textContent` numeric value from 0 to target, triggered on scroll-into-view.
6. **India/Surat map pins** (`sections/reach-map.liquid`, optional - only if distribution data is confirmed with the merchant) SVG map, `<circle>` pins with staggered fade+scale-in via ScrollTrigger as the section scrolls into view.
7. **Micro-interactions** Primary buttons: hover = background fill wipes in from center (CSS `::after` scale transform, no JS needed). Add-to-cart button: on success, morph label to a checkmark icon for 1.5s then revert (small state-driven JS, no page reload - use Shopify's Cart AJAX API).
8. **Page/section transitions** Since this is Liquid (not headless), skip full page-transition routing - instead fade the `<main>` container in on `DOMContentLoaded` (150ms) to avoid flash-of-unstyled-content between navigations.

Respect `prefers-reduced-motion` everywhere above - replace stagger/scatter effects with a simple opacity fade when it's set.

## 3. Sections to scaffold (Liquid sections + matching JSON templates)

Build these as independent, theme-editor-configurable sections:

- `sections/announcement-bar.liquid`
- `sections/header.liquid` - nav items: Shop, Asafoetida (Hing), Blended Masalas, Easy-to-Cook, Herbs, Essentials, HORECA, Upwas, Our Story, Contact
- `sections/hero.liquid` (animation #1)
- `sections/trust-strip.liquid` (counters - animation #5): "50+ Years", "3rd Generation", "100% Vegetarian / Jain-Friendly", "FSSAI Certified"
- `sections/category-carousel.liquid` (animation #3) - 7 category cards, color-tagged per §1 tokens: Asafoetida, Authentic Blended Spice, Easy to Cook, Herbs, Essential Products, H.O.R.E.C.A. Products, Upwas Products
- `sections/purity-promise.liquid` (animation #2)
- `sections/bestsellers-carousel.liquid` (animation #3) - pull from a "Bestsellers" collection
- `sections/heritage-quote.liquid` - full-bleed `--color-dark` background, oversized quote marks, centered serif quote from the Wankawala family
- `sections/recipe-grid.liquid` - 4-image "Cooked with Vishesh" grid (pav bhaji, dal, chai, farsan)
- `sections/upwas-spotlight.liquid` - seasonal banner, editable start/end date in section settings so it can be toggled around fasting periods
- `sections/horeca-cta.liquid` - bulk-order banner linking to a contact/quote form
- `sections/stockist-logos.liquid` - logo strip (placeholder logos until brand supplies real ones)
- `sections/newsletter-whatsapp.liquid`
- `sections/footer.liquid` - columns: Shop / About / Products / Help / Legal, + newsletter field, + brand seal line
- Global: floating WhatsApp button embedded in `theme.liquid` (persistent, bottom-right, all pages)

Product template (`templates/product.json` + `sections/main-product.liquid` overrides):

- sticky add-to-cart bar on mobile scroll
- image gallery with zoom + pack-size variant selector
- accordion: Ingredients / FSSAI & Nutrition / How to Use
- cross-sell carousel ("Pairs well with") reusing the carousel component
- reviews block (use Shopify's native product reviews or a lightweight app embed)

Collection template: category hero banner (short story per category) + animated product grid (`data-animate="fade-up"`, staggered by grid position).

## 4. Content/copy to seed (placeholder - confirm final copy with brand before launch)

- Hero line: "Asli Masala. Ghar Jaisa Swaad." / subline: "50 saal, ek hi Vishesh - hand-blended in Surat since [founding year]."
- Brand seal (footer): "Asli Masala. Ghar Jaisa Swaad."
- Product card callouts: purity-first language ("100% Pure Hing", "No Artificial Colour", "Stone-Ground"), not health-stat language.
- Tone: warm, heritage-rooted, trustworthy - avoid clinical "zero X" health-brand phrasing (that's the reference site's language, not this brand's).
- Clearly label Jain-friendly / Upwas-appropriate / no onion-garlic where applicable - high-trust signal for the core Gujarati audience.
- Treat any hero line, tagline, or founding-year placeholder above as a draft - flag it for the user to approve rather than shipping it unconfirmed.

## 5. Product/category data (from the current live site, visheshmasala.com)

Categories: Asafoetida (Hing) · Authentic Blended Spice · Easy to Cook · Herbs · Essential Products · H.O.R.E.C.A. Products · Upwas Products

Known SKUs: Premium Hing, No.300 Hing, Black Hing, Special Garam Masala, Pavbhaji Masala, Pasta Masala, Shingoda Atta, Cold Coco Powder, Chutney Powder, Special Tea Masala, Kashmiri Chilli Powder, Chilli Flakes, Oregano Leaves, Rock Salt.

This list is incomplete - pull the authoritative SKU/price/weight list from the merchant (Shopify admin CSV export, if available) before final migration. Don't hardcode guessed prices or invent SKUs.

## 6. Build order

Work through these as sequential milestones; verify each before moving to the next.

1. Scaffold Dawn fork, wire up design tokens + fonts, confirm `shopify theme dev` runs clean.
2. Build header/footer/announcement-bar + global nav, verify responsive.
3. Build hero section + kinetic-text animation, verify on mobile (touch) and with `prefers-reduced-motion` on.
4. Build category-carousel + bestsellers-carousel (Swiper), verify drag + arrow nav on mobile/desktop.
5. Build purity-promise pinned-scroll section, verify pin/scrub behavior doesn't jank on mid-tier Android (test in Chrome DevTools throttled CPU/network).
6. Build remaining homepage sections (trust strip, heritage quote, recipe grid, upwas spotlight, HORECA CTA, stockist logos, newsletter).
7. Build collection + product templates with their animations and interactions.
8. Wire up Shopify Cart AJAX for add-to-cart micro-interaction.
9. Run Lighthouse mobile audit - fix anything under 85 before calling it done.
10. Final pass: confirm every animated element degrades correctly under `prefers-reduced-motion`.

## Notes for Claude Code

- Don't invent brand facts (founding year, retailer counts, distribution map data) - placeholders above are marked; surface them to the user for confirmation rather than guessing.
- Ask the user for a `.env`/Shopify store connection (store URL + theme access) before running `shopify theme dev` or pushing live, if not already configured.

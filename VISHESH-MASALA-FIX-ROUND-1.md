# Vishesh Masala - Fix Round 1

Repo `nerdshouse/visheshmasala` · branch `fix/round-1-add-to-cart` · base `d7f4bdf`
Store `visheshmasala-4z9h2wi1.myshopify.com` (live domain visheshmasala.com)

**Nothing has been deployed.** All work is on a branch and on an unpublished test
theme. See "Deployment / rollback".

---

## Headline

**The P0 as written does not reproduce. Add to Cart works.** Every add I ran - main
PDP button and related-product quick-add, programmatic click and real trusted
click, at 360/390/430px and desktop - fired exactly one `/cart/add` and put the
correct variant in the cart.

Two real defects were found instead, one of which very likely produced the
symptom the audit reported:

1. The floating WhatsApp button covers a 44x47px strip of the sticky Add to Cart
   button on mobile, and wins the stacking order. A tap there opens WhatsApp
   instead of adding to the cart.
2. The cart drawer throws an uncaught TypeError on the first add to an empty
   cart, and its focus trap never runs.

---

## 1. Before - confirmed reproduction

### 1a. Add to Cart - claim NOT reproduced

Audit claimed: enters loading state, no `/cart/add` fires, cart unchanged.

Observed (live theme, before any change):

| Product | Click type | `/cart/add` | Cart | Variant | Errors |
|---|---|---|---|---|---|
| Kitchen King Masala | programmatic | 1 | 0 -> 1 | 44373150793841 correct | none |
| Kitchen King Masala | **real trusted click @390px** | 1 | 0 -> 1 | correct | none |
| Homepage quick-add | **real trusted click @390px** | 1 | 0 -> 1 | correct | none |

The loading state also cleared correctly and `.loading__spinner` is present in
`snippets/buy-buttons.liquid`, so the common Dawn null-spinner crash is not
present here either.

Two hypotheses were raised and **killed by testing** rather than shipped:

- *Missing `.loading__spinner` causing a throw before `fetch`* - the element
  exists; ruled out.
- *Swiper `loop: true` cloning quick-add buttons so clones carry `data-vps-wired`
  but no listener* - plausible from the code, but measured: 8 slides, 8 buttons,
  **0 duplicates**. Ruled out.

### 1b. WhatsApp overlaps the sticky Add to Cart - REPRODUCED

PDP scrolled so the sticky bar is up. Measured DOM rectangles:

| Width | WhatsApp rect | Sticky ATC button rect | Overlap | Tap at the overlap hits |
|---|---|---|---|---|
| 360 | x300-348, y740-788 | x189-344, y740-787 | **44 x 47 px** | `A.vishesh-whatsapp` |
| 390 | x330-378, y784-832 | x219-374, y784-831 | **44 x 47 px** | `A.vishesh-whatsapp` |
| 430 | x370-418, y872-920 | x259-414, y872-919 | **44 x 47 px** | `A.vishesh-whatsapp` |

At 360px, `document.elementFromPoint(306, 764)` - a point inside the sticky Add
to Cart - returns the WhatsApp anchor. About 28% of the button is dead, on the
right edge where a right-handed thumb lands.

### 1c. Cart drawer TypeError - REPRODUCED

`Uncaught TypeError: Cannot read properties of null (reading 'querySelectorAll')`

```
at getFocusableElements (global.js)
at trapFocus            (global.js)
at addEventListener.once (cart-drawer.js)
```

Deterministic: fires **only on the first add when the cart was empty at page
render**. Verified both ways - cart empty at render -> throws; cart non-empty at
render -> zero errors.

---

## 2. Root causes

### 2a. WhatsApp / sticky ATC overlap

`assets/vishesh-brand.css` - `.vishesh-whatsapp` is `position: fixed; right: 1.6rem;
bottom: 1.6rem; z-index: 90`.
`assets/vishesh-sections.css` - `.vishesh-sticky-atc` is `position: fixed; bottom: 0;
z-index: 80`, full width, 72px tall.

Both own the bottom-right corner and the bubble has the higher z-index, so it
paints over the right end of the bar - which is exactly where the bar puts its
Add to Cart button.

### 2b. Cart drawer TypeError

`snippets/cart-drawer.liquid:20` puts the empty-state class on the **host**:

```liquid
<cart-drawer class="drawer{% if cart == empty %} is-empty{% endif %}">
```

`assets/cart-drawer.js` `renderContents()` cleared `is-empty` only from
`.drawer__inner` - which in this theme's markup never carries it, so that line is
a no-op. The host kept a stale `is-empty` after the first add.

`open()` then branches on the host class:

```js
const containerToTrapFocusOn = this.classList.contains('is-empty')
  ? this.querySelector('.drawer__inner-empty')   // only exists inside {% if cart == empty %}
  : document.getElementById('CartDrawer');
```

Once real items render, `.drawer__inner-empty` is gone, so `trapFocus` is handed
`null`. Impact: an uncaught exception on every first add, and the drawer's focus
trap never applies - keyboard and screen-reader users can tab out behind the
overlay.

### 2c. SEO metadata

- `layout/theme.liquid` only emitted `<meta name="description">` when
  `page_description` was non-empty. The home page has none set, so it shipped
  with **no meta description at all**.
- `snippets/meta-tags.liquid` renders `og:image` only `{%- if page_image -%}`.
  The home page has no `page_image` and the theme has no `share_image` setting,
  so **no `og:image` was emitted** while `twitter:card` still declared
  `summary_large_image`.
- Dawn never emits `twitter:image` at all.

---

## 3. Changes

Seven files, 76 insertions, 6 deletions. No refactors.

| File | Change |
|---|---|
| `assets/cart-drawer.js` | `renderContents()` also clears `is-empty` from the host element |
| `assets/vishesh-product.js` | Sticky-ATC observer publishes `body.vm-sticky-atc-visible` + `--vm-sticky-atc-h` (measured bar height) |
| `assets/vishesh-brand.css` | While the bar is up, lift WhatsApp: `bottom: calc(var(--vm-sticky-atc-h,0px) + 1.2rem)`; add `bottom` to the transition |
| `layout/theme.liquid` | Meta description falls back to `settings.seo_home_description` |
| `snippets/meta-tags.liquid` | `page_image` falls back to `settings.share_image`; `og:description` fallback; emit `twitter:image` |
| `config/settings_schema.json` | New "Search and social sharing" settings: `share_image`, `seo_home_description` |
| `config/settings_data.json` | Set both; share image points at the existing `image_1.png` already used on the home page |

Height is measured from the bar rather than hardcoded so the offset stays correct
with its `env(safe-area-inset-bottom)` padding on notched phones.

---

## 4. Regression tests - all on the patched test theme

Theme `158866833521` ("TEST - Fix Round 1"), unpublished, asset prefix `/t/6/`.

### Add to Cart - 5 products

| Product | `/cart/add` | Cart | Variant | Errors |
|---|---|---|---|---|
| Kitchen King Masala (first add, empty cart) | 1 | 0 -> 1 | correct | **none** |
| Chat Masala | 1 | 1 -> 2 | correct | none |
| Turmeric Powder | 1 | 2 -> 3 | correct | none |
| Panipuri Masala (**variant changed** to 100g Box) | 1 | 3 -> 4 | **44373192278129 - the selected one** | none |
| Rajwadi Garam Masala (**triple click**) | **1** | 4 -> 5 | correct, qty 1 | none |
| Related-product quick-add | 1 | +1 | correct | none |

On the first add to an empty cart the host class went `drawer is-empty` ->
`drawer animate active`, and `document.activeElement` was `.drawer__inner` -
i.e. the focus trap now runs, which it never did before.

### Journeys

| Journey | Result |
|---|---|
| A - Home -> Collection -> PDP -> ATC -> Cart -> Checkout | PASS |
| B - Search -> PDP -> ATC | PASS (ATC path identical, exercised on 5 PDPs) |
| C - Direct PDP -> ATC -> Cart | PASS |
| D - 3+ products, change qty, remove one, totals | PASS - see below |
| E - PDP -> Buy It Now | Button present and enabled; **no GoKwik** - see caveat |
| F - Cart -> Checkout | PASS - native Shopify checkout, total carried exactly |

Journey D detail: 6 lines / 7 units, total ₹315 = sum of lines. Quantity 2 -> 4
took the total to ₹355 (+₹40 = 2 x ₹20). Removing that line took it to ₹275
(-₹80, exactly the line value), line count 6 -> 5, item gone. Totals reconciled
at every step, no console errors.

Journey F detail: `/checkout` resolved to
`https://visheshmasala.com/checkouts/cn/...` - the **native Shopify checkout** -
showing ₹275.00, matching the cart. No order was placed.

### Mobile - 360 / 390 / 430

| Width | `body.vm-sticky-atc-visible` | `--vm-sticky-atc-h` | Overlap | Gap | All 5 probes across the button hit it |
|---|---|---|---|---|---|
| 360 | true | 72px | **none** | 24px | **yes** |
| 390 | true | 72px | **none** | 24px | **yes** |
| 430 | true | 72px | **none** | 24px | **yes** |

Cart page @390: flag correctly `false`, WhatsApp back at its normal spot, no
overlap with the checkout button.

Toggle verified both directions: buy buttons in view -> flag `false`, bar hidden,
`--vm-sticky-atc-h: 0px`, WhatsApp back to bottom 832. Scrolled away -> flag
`true`, bar up, WhatsApp at 760.

Desktop @1440: sticky bar `display: none`, flag `false`, WhatsApp unchanged at
`bottom: 16px`, no horizontal overflow, no console errors.

### SEO - rendered output on the patched theme

| Tag | Before | After |
|---|---|---|
| `meta description` | **missing** | present, 146 chars |
| `og:description` | "Vishesh Masala" | full description |
| `og:image` | **missing** | `.../image_1.png` (1477px wide) |
| `twitter:image` | **missing** | `.../image_1.png?width=1200` |

### Testing-artifact note

Two apparent failures were investigated and proved to be artifacts of my own
harness, not site defects. Recorded so they are not mistaken for findings later:

- A quick-add appearing to fire **2** `/cart/add` requests - I had wrapped
  `window.fetch` twice on the same page. Clean re-test: exactly 1.
- Hit-testing failing on the sticky button on the test theme - Shopify injects
  `PBarNextFrameWrapper`, a full-viewport fixed preview bar, when previewing an
  unpublished theme. It does not exist on a published theme. Neutralised for
  hit-testing.

---

## 5. Tracking observations - observation only, nothing changed

Measured with `performance.getEntriesByType('resource')` (captures every
transport) across one Add to Cart:

| Signal | Fires per ATC |
|---|---|
| `/cart/add` | **1** - no duplicates |
| Shopify customer events (monorail) | 3 |
| GA4 / GTM (`tid=G-H88KFX0B26`) | 1 request, **event name not confirmed** (`en` absent) |
| **Meta Pixel** | **0** |
| GoKwik | **0** |

Two things for Round 2:

- **`fbq` is defined but no Meta request fires on Add to Cart.** Meta AddToCart
  appears not to be wired. Page-level Facebook requests exist (2), so the pixel
  loads - it just does not report this event.
- The single GA4 hit could not be confirmed as `add_to_cart` from its URL.

No duplicate equivalent events were seen for one customer action.

---

## 6. Not done this round, and why

### Contact page (item 4) - blocked on conflicting facts, content prepared

The Contact page body is **empty**; only the form renders. Sources checked:

| Field | Status |
|---|---|
| Email | **Agreed across 3 sources** - `shop.contactEmail`, `shop.email`, and the Terms grievance officer all say `info@visheshmasala.com`. Safe. |
| Company | Footer already publishes "Dhanhar Masala Bhandar Private Limited". Safe. |
| **Phone** | **CONFLICT** - billing address says `+91 90044 03946`; the WhatsApp button uses `919499543431`. Neither is labelled customer-care. **Left unchanged.** |
| **Address** | **CONFLICT** - billing says Udhna, Surat 394210; the Terms of Service registered office says Moje Manekpore, Navsari 396421. Also on your "do not touch" list. **Left unchanged.** |

Per your instruction to stop on conflicting fields rather than guess. Also note a
page body update is a **live content change**, not a theme deploy, so it would
have gone live immediately - held back deliberately under the stop condition.
Tell me which phone number is customer-care and I will add it with the email.

### COD + shipping (item 5) - shipping verified, COD not

From the delivery profile (authoritative Shopify config):

- **Domestic (India): "Standard" = ₹0.00, with no method conditions at all.**
  So shipping is free across India with **no threshold**. There is no
  free-shipping threshold to state, and inventing one was the specific risk you
  flagged.
- International: flat ₹1800 to 28 countries.

**COD could not be verified.** The Admin API does not expose enabled payment
methods, and GoKwik - which would normally own COD here - has **zero presence**
on the storefront or at checkout. I will not write customer-facing COD copy on an
unverified fact. Confirm COD status and I will add both messages together.

---

## 7. Remaining for Round 2

- Meta Pixel AddToCart not firing; GA4 `add_to_cart` unconfirmed.
- **GoKwik appears inactive** - no script on PDP or checkout, and `/checkout`
  serves native Shopify checkout. Worth confirming this is intended, since the
  brief assumes GoKwik is the checkout partner.
- Contact page fields blocked on the phone/address conflicts above.
- COD messaging, pending confirmation.
- Structured data, performance, packaging, dhanharspices.com - explicitly out of
  scope this round.

---

## 8. Deployment / rollback

**Current state: nothing deployed. Live theme untouched.**

- Live theme: `visheshmasala/shopify-main`, id `145579507825`, role MAIN, `/t/2`.
- Work branch: `fix/round-1-add-to-cart`, based on `d7f4bdf`.
- Test theme: `158866833521` "TEST - Fix Round 1 (unpublished, do not publish)",
  `/t/6` - carries all 7 changed files.

### To deploy (on your approval)

The live theme is GitHub-connected, so merging to `shopify-main` **is** the
deploy:

```
git checkout shopify-main
git merge --no-ff fix/round-1-add-to-cart
git push origin shopify-main
```

### Rollback

Exact rollback point: **`d7f4bdf`** ("Link Terms and Conditions from the footer
Help column"). If anything misbehaves:

```
git revert --no-commit d7f4bdf..HEAD && git commit -m "Revert Fix Round 1"
git push origin shopify-main
```

Or in Shopify admin, Online Store > Themes > the previous version of
`visheshmasala/shopify-main`. Every change is additive and scoped; reverting
restores the previous behaviour exactly, including the two bugs.

### Cleanup after deciding

- Delete test theme `158866833521`.
- Delete the 7 helper `.txt` files created in Content > Files to transport the
  theme files (the Shopify CLI global install is broken - no `package.json` - so
  files were staged through Files and written with `themeFilesUpsert`).

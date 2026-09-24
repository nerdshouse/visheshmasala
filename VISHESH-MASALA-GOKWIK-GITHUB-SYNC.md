# Vishesh Masala - GoKwik / GitHub Reconciliation

Store `visheshmasala-4z9h2wi1.myshopify.com` · live domain visheshmasala.com
Repo `nerdshouse/visheshmasala`, branch `shopify-main`

**Nothing published. MAIN unchanged. `/t/5` never edited. No GoKwik app or
setting touched.**

---

## Production Baseline

| | |
|---|---|
| Live MAIN theme | **GoKwik Preview 2026-09-07 11:09** · `#145950441585` · `/t/5` |
| GitHub-connected theme | `visheshmasala/shopify-main` · `#145579507825` · `/t/2` (UNPUBLISHED) |
| Fresh test theme | **TEST - Reconciled GoKwik + Round1** · `#158869160049` · `/t/7` (UNPUBLISHED) |
| Baseline manifest | `VISHESH-MASALA-T5-BASELINE-MANIFEST.txt` - all 415 `/t/5` files + md5 |
| Git rollback tag | `pre-gokwik-sync-2026-09-24` -> `c683637` |
| Git rollback branch | `backup/pre-gokwik-sync` -> `c683637` |
| Pre-Round-1 point | `d7f4bdf` |

`/t/5` is a fork of `/t/2` taken at `d7f4bdf`. Of its 415 files, **401 were
already byte-identical** before any work began.

Method note: Shopify's `checksumMd5` was verified to equal a plain local md5 on
four known-identical files, so local hashes are a valid comparison basis. Note
that the API's `body.content` is a *rendered* view, not the stored bytes - JSON
files are stored minified with no header comment (`templates/404.json` is 72 B).
Liquid files are returned byte-exact, which is what made the GoKwik port
verifiable.

---

## Live -> GitHub Sync

Commit `ec9d7d4` brings the repo to `/t/5` parity. Every ported file was
verified against Shopify's own checksum:

| File | Size | md5 | Verified |
|---|---|---|---|
| `snippets/gokwik.liquid` (new) | 42,182 | `9f17343a…` | **byte-exact** |
| `snippets/buy-buttons.liquid` | 6,650 | `25b3d47c…` | **byte-exact** |
| `layout/theme.liquid` | 24,043 | `7dec3c2d…` | **byte-exact** |
| `config/settings_schema.json` | - | - | semantically identical |
| `config/settings_data.json` | - | - | 7 GoKwik values ported |

---

## GoKwik Files Preserved

GoKwik modifies the theme in four places. All reproduced exactly, none rewritten:

1. **`snippets/gokwik.liquid`** - 42KB OCC integration. Byte-exact.
2. **`layout/theme.liquid`** - injected before `</head>`:
   ```liquid
   <!-- Gokwik theme code start -->
   <link rel="dns-prefetch" href="https://pdp.gokwik.co/">
   <link rel="dns-prefetch" href="https://api.gokwik.co">
   {% render 'gokwik' %}
   <!-- Gokwik theme code End -->
   ```
3. **`snippets/buy-buttons.liquid`** - Shopify's native accelerated checkout is
   commented out and replaced with GoKwik's:
   ```liquid
   {% comment %} {{ form | payment_button }} {% endcomment %}
   <button type="button" ... onclick="onBuyNowClick(this)" id="gokwik-buy-now">
   ```
4. **`config/settings_schema.json`** - GoKwik's own `"Gokwik"` settings group
   (22 settings) appended **verbatim**, kept last, unmodified.

Production values ported into `config/settings_data.json`: `mid`
(`19w0ssjui6cg`), `envType` (`production`), `fbpixel`, `goEnable`,
`goBuynowEnable`, `buyNowText`, `enableIntlFlow`. Without the schema group
Shopify would have no definition for these.

**No custom comments were inserted inside GoKwik-generated code.**

---

## Production-Only Changes Preserved

Beyond GoKwik, five theme-editor-managed JSON files differed. All were Shopify's
own normalisation, not merchant intent:

| File | Difference | Action |
|---|---|---|
| `templates/product.json` | none - **semantically identical** | adopted |
| `templates/404.json` | empty `"settings": {}` added | adopted |
| `templates/article.json` | empty `"settings": {}` added | adopted |
| `templates/password.json` | empty `"settings": {}` added | adopted |
| `sections/header-group.json` | 2 obsolete block keys Shopify dropped | adopted |

**Step 3 decision, documented as requested:** the repo adopts live *semantics*
but keeps files **pretty-printed** rather than minified. Production stores them
minified; committing minified JSON would make every future diff unreadable, which
is the "unnecessary noise / breaks the repo workflow" exception. Semantic parity
is verified programmatically; byte parity on those seven JSON files is
deliberately not claimed.

---

## Round 1 Fixes Re-Applied

| Fix | Commit | Verified |
|---|---|---|
| Cart drawer stale `is-empty` / focus trap | `0cbffdf` | md5 `324fa309…` = tested build |
| WhatsApp vs sticky ATC overlap | `0cbffdf` | md5 `24df90ee…` / `6fe8ded1…` |
| Home meta description | `4c95dbb` | rendered on `/t/7` |
| OG description + image | `4c95dbb` | rendered on `/t/7` |
| Twitter/X image | `4c95dbb` | rendered on `/t/7` |

`layout/theme.liquid` required a genuine three-way merge: it now carries **both**
GoKwik's hook and the SEO change. Only the meta-description hunk was applied; the
GoKwik block was verified still present afterwards.

---

## Git Commit History

```
f621b98  Merge live GoKwik production baseline and re-applied Round 1 fixes
4c95dbb  Add home page social and SEO metadata
0cbffdf  Fix cart drawer stale is-empty and the mobile sticky ATC overlap
ec9d7d4  Sync live GoKwik production theme into the repository
c683637  (superseded) Round 1 merge, built pre-GoKwik, never live
d7f4bdf  rollback point
```

Live-theme reconciliation (`ec9d7d4`) is a separate commit from our own changes
(`0cbffdf`, `4c95dbb`), as requested.

---

## Repository <-> Shopify Checksum Verification

All nine changed files verified identical between the local repo and `/t/2`
after GitHub sync:

`gokwik.liquid`, `buy-buttons.liquid`, `theme.liquid`, `cart-drawer.js`,
`vishesh-product.js`, `vishesh-brand.css`, `meta-tags.liquid`,
`settings_schema.json`, `settings_data.json` - **9/9 md5 match.**

---

## Fresh Test Theme

`/t/7` (#158869160049), duplicated from the reconciled `/t/2`. The old `/t/6` was
**not** reused.

Confirmed present on `/t/7`: 127 GoKwik references, `id="gokwik-buy-now"`,
`onBuyNowClick` x5, `pdp.gokwik.co`, `mid: "19w0ssjui6cg"`,
`environment: "production"`, `window.gokwikSdk` = object with `initCheckout`,
plus all Round 1 fixes and SEO tags.

---

## Add-to-Cart Regression (`/t/7`, GoKwik live)

| Test | `/cart/add` calls | Result |
|---|---|---|
| First add to **empty** cart | 1 | PASS - 0 errors, `is-empty` cleared, **focus trapped** |
| Chat Masala (non-empty cart) | 1 | PASS 1 -> 2 |
| Turmeric Powder | 1 | PASS 2 -> 3 |
| Panipuri Masala + **variant change** | 1 | PASS - 100g Box, correct variant in cart |
| Rajwadi Garam Masala, **rapid x3 click** | **1** | PASS - delta +1, qty 1, no duplicates |
| Related-product **quick add** | 1 | PASS - correct variant |
| Cart drawer | - | PASS - opens, focus trapped |
| Quantity 1 -> 3 | - | PASS - ₹295 -> ₹335 (+₹40 = 2 x ₹20), reconciles |
| Item removal | - | PASS - ₹335 -> ₹275 (-₹60 exactly), line gone |
| Cart totals | - | PASS - sum of lines == total at every step |

Zero console exceptions throughout.

---

## GoKwik Regression

| Check | Result |
|---|---|
| PDP GoKwik Buy It Now renders | PASS - `#gokwik-buy-now`, 440x47, enabled |
| `onBuyNowClick` exists | PASS - `function` |
| GoKwik scripts load | PASS - `window.gokwikSdk` object, `initCheckout` present |
| Native accelerated checkout absent | PASS - correctly replaced |
| GoKwik network calls | PASS - 20 calls: `gkx.gokwik.co`, `pdp.gokwik.co`, `api-gw.gokwik.io` |
| Checkout opens | PASS - `pdp.gokwik.co/index.html` iframe, 450x777 |
| Correct product / qty / total | PASS - **"1 item · ₹50"** for Kitchen King Masala 50g Box |
| Close / back behaviour | PASS - back triggers GoKwik's exit-intent prompt; confirming closes cleanly |
| State restored after close | PASS - back on PDP, ATC + Buy It Now present and enabled |
| JS errors | **none** |

**No order was placed.** Testing stopped at GoKwik's login/mobile-number step.

### Cart-level checkout

**Cart checkout is GoKwik, not native.** The cart page button `#checkout` is
claimed at runtime by GoKwik's `attach()` sweep - it carries `gokwik-marge` and
`data-gokwik-function="checkout"`. Clicking it produced 14 GoKwik calls and
opened the same `pdp.gokwik.co` modal showing **"5 items · ₹275"**, matching the
cart exactly, with no navigation to `/checkouts/`.

This differs by mechanism from Buy It Now: Buy It Now is a **theme edit** in
`buy-buttons.liquid`; cart checkout is a **runtime claim** by `gokwik.liquid`.
Both end at GoKwik.

Note the cart-drawer checkout button (`#CartDrawer-Checkout`) was *not* claimed
while the drawer was closed; GoKwik re-scans on cart-drawer open events.

---

## Mobile Regression

Sticky bar height 72px; WhatsApp lifts to clear it.

| Width | body flag | `--vm-sticky-atc-h` | Gap | Overlap | Sticky ATC probes | H-overflow |
|---|---|---|---|---|---|---|
| 360x800 | true | 72px | 24px | **none** | 5/5 hit | none |
| 390x844 | true | 72px | 24px | **none** | 5/5 hit | none |
| 430x932 | true | 72px | 24px | **none** | 5/5 hit | none |

Buy-area-in-view at 390 (sticky bar hidden, flag correctly `false`): WhatsApp
y784-832 vs GoKwik Buy Now y399-446 and main ATC y341-389 - **no overlap**, 3/3
probes hit each button. No dead tap zones.

Desktop 1440: sticky bar `display:none`, flag `false`, WhatsApp at its normal
`bottom:16px`, GoKwik Buy Now 440x47 present, no horizontal overflow, no errors.

---

## Expected Production Diff

If `/t/2` becomes MAIN, versus current live `/t/5`:

- **403 of 415 files byte-identical**
- 7 files differ = the approved Round 1 fixes
- 5 files differ = JSON pretty-printing only (semantically identical)
- **0 unexpected differences**
- `snippets/gokwik.liquid` and `snippets/buy-buttons.liquid` are **byte-identical
  to production** - GoKwik is not altered in any way

No GoKwik removal, no checkout behaviour change, no settings loss, no navigation
change, no product-template change.

---

## GoKwik Drift Protection

**Established by evidence:**
- GoKwik **does** modify theme files directly - four files, proven above.
- A theme named `GoKwik Preview <timestamp>` was created 2026-09-07 and is now
  MAIN, so the app's flow produces preview themes that can end up published.
- Vendor updates **can and did** cause GitHub drift: the connected theme was
  unpublished and every commit after 2026-09-07 stopped reaching production.

**Not established** (Shopify does not expose it): who published `/t/5`, whether
GoKwik published it itself, and whether GoKwik can write to MAIN directly. Not
asserting either way.

### Recommended operating procedure

1. Before every production theme deploy, compare current MAIN against GitHub -
   check `role` first, then file checksums. Never assume the connected theme is
   MAIN.
2. If GoKwik has modified theme files, sync those into git **before** deploying.
3. Never publish a GitHub-connected theme that lacks the current GoKwik files.
4. Keep GoKwik-generated code identified as vendor-managed (see below).
5. After any GoKwik upgrade or reinstall, reconcile GitHub immediately.

A short note has been added to `CLAUDE.md` rather than inside vendor code.

---

## Publish Plan

Not executed - awaiting approval.

1. Re-verify `/t/5` is still MAIN and unchanged (it may drift if GoKwik updates).
2. Re-run the checksum comparison; if GoKwik has changed anything, sync first.
3. Publish `/t/2` (`themePublish` on `#145579507825`, or Online Store > Themes).
4. Immediately smoke-test on production: GoKwik Buy It Now opens with correct
   totals, cart checkout opens GoKwik, ATC on 3 products, mobile 360/390/430.
5. Watch for GoKwik JS errors for the first hour.

## Rollback Plan

- **Fastest:** re-publish `GoKwik Preview 2026-09-07 11:09` (`#145950441585`)
  in Online Store > Themes. It is untouched and restores production exactly.
- **Git:** `backup/pre-gokwik-sync` / tag `pre-gokwik-sync-2026-09-24`
  (`c683637`); pre-Round-1 is `d7f4bdf`.
- `/t/7` can be deleted once no longer needed; `/t/6` (superseded) and
  `#145748033649` (old footer draft) are also safe to delete.

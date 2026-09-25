# Vishesh Masala - Minimum Order Value ₹99

Status: **implemented and tested on an unpublished theme. NOT deployed.** Waiting for approval.

- Branch (local only, not pushed, not committed): `min-order-99`
- Test theme: **#158885118065 "TEST - Min order 99 (unpublished, do not publish)"** - byte-identical to the branch
- Production MAIN `visheshmasala/shopify-main` (#145579507825): **untouched**
- Tested 25 Sep 2026, 09:05-09:41 IST. All times IST.

---

## Current Cart Architecture (audit, before any change)

| Entry point | Markup | At runtime |
|---|---|---|
| Cart drawer Checkout | `snippets/cart-drawer.liquid` `#CartDrawer-Checkout`, `type=submit name=checkout form=CartDrawer-Form` | **GoKwik-claimed** once visible (`gokwik-marge`, `data-gokwik-function="checkout"`, type -> `button`). Before GoKwik claims it, it is a native submit to Shopify checkout. |
| Cart page Checkout | `sections/main-cart-footer.liquid` `#checkout`, `type=submit name=checkout form=cart` | **GoKwik-claimed** (verified live on production) |
| PDP Buy It Now | `snippets/buy-buttons.liquid` `#gokwik-buy-now`, inline `onclick="onBuyNowClick(this)"` (vendor-managed) | GoKwik Buy Now |
| Cart notification | `snippets/cart-notification.liquid` | Not rendered - `cart_type = drawer` |
| Accelerated checkout buttons | `content_for_additional_checkout_buttons` | None render on this store |
| Sticky ATC | `[data-sticky-atc]` (vishesh-product.js) | Add to cart only - no checkout |

- **GoKwik interception** (`snippets/gokwik.liquid`): a `window` capture-phase click listener (`gokwikClickCapture`) claims any element with `.gokwik-marge` + `data-gokwik-function`; `replaceButton()` clones buttons (keeping attributes such as `disabled`); a 500 ms ownership sweep and a MutationObserver re-claim buttons after re-renders; `isElementVisible()` skips hidden buttons.
- **GoKwik Buy Now** does not use the cart: its SDK saves the cart to `localStorage`, calls `/cart/clear.js`, adds only the product, opens checkout and restores the cart later. So the order value it starts is price x quantity.
- **Subtotal source:** `cart.total_price` - after line and cart-level discounts, excluding shipping, taxes as Shopify currently handles them (the "Estimated total" shown in the cart).
- **Re-render paths** (Dawn): add from PDP/cards -> `cart-drawer.renderContents()` replaces `#CartDrawer`; drawer quantity change -> `.drawer__inner`; drawer `onCartUpdate` -> only `cart-drawer-items` + `.cart-drawer__footer` (NOT the checkout button); cart page quantity change -> `.js-contents` of items + footer subtotal (NOT the checkout button). Pending state: `.cart__items--disabled`.
- **Existing quick-add pattern:** `vishesh-pack-selector.js` posts to `/cart/add.js` with the drawer's sections and calls `renderContents` - reused for suggestions.

---

## Files Changed

| File | Change | Lines |
|---|---|---|
| `config/settings_schema.json` | New setting **Minimum order value (₹)**, id `vm_min_order_value`, default 99, in the *Vishesh Masala* group. GoKwik group untouched. | +11 |
| `layout/theme.liquid` | `{% render 'vm-min-order-guard' %}` **immediately above** `<!-- Gokwik theme code start -->` (outside the vendor block); `vm-min-order.css`; `vm-min-order.js` (defer) | +8 |
| `snippets/cart-drawer.liquid` | Render block after line items; one-line reminder above checkout; checkout `disabled` + `data-vm-blocked` below minimum | +14 / -1 |
| `sections/main-cart-footer.liquid` | Render block in the subtotal `.js-contents`; checkout `disabled` + `data-vm-blocked` below minimum | +13 / -1 |
| `snippets/vm-min-order.liquid` | **New** - message, progress bar, caption, suggestion slot | 82 lines |
| `snippets/vm-min-order-guard.liquid` | **New** - inline click/submit guard that runs before GoKwik | 198 lines |
| `assets/vm-min-order.js` | **New** - state sync, suggestions, quick add, Back/Forward refresh | 424 lines |
| `assets/vm-min-order.css` | **New** - styles, brand tokens only | 175 lines |

**Not touched:** `snippets/gokwik.liquid`, `snippets/buy-buttons.liquid`, `config/settings_data.json`, any tracking, pixel, GA4, Meta, Google Ads or GoKwik config.

Single source of truth: `settings.vm_min_order_value`. Every template, message and the guard derive paise from it (`| times: 100`). Setting it to **0 turns the whole feature off** without a deploy.

---

## Minimum-Order Logic

- Below minimum = `cart.item_count > 0 and cart.total_price < min`. **Exactly the minimum is allowed.**
- Message: **"Minimum order value is ₹99. Add ₹X more to checkout."** (₹X = min - total, shown without `.00`)
- Progress bar `total/min`, caption **"₹X away from checkout"** + "₹total / ₹99"; at or above minimum: full bar + **"Minimum order reached ✓"**, no message, no suggestions.
- Drawer footer one-liner above the disabled button: **"Add ₹X more to checkout"**.
- Checkout button rendered `disabled aria-disabled data-vm-blocked` below the minimum; a disabled button dispatches no click, so GoKwik's handler never runs.
- `vm-min-order.js` re-applies the state after every re-render (MutationObserver on the drawer, cart items and footer + Dawn `cartUpdate`), which covers the Dawn paths that refresh totals without re-rendering the button, and GoKwik's clones. It only undoes a disable it made itself (`data-vm-blocked`), never an empty-cart or GoKwik "Processing" disable.
- Empty cart: nothing rendered; Dawn's own disabled button unchanged.

## GoKwik Interception Strategy

1. **Primary:** the button is disabled at render time - no click event exists for GoKwik to see.
2. **Guard (defence in depth):** `snippets/vm-min-order-guard.liquid` registers a `window` capture click listener **before** `gokwikClickCapture` (same target, same phase -> runs first). Below minimum it calls `preventDefault()` + `stopImmediatePropagation()` and shows the message next to the button. It covers:
   - any `button/input[name=checkout]`, `a[href*="/checkout"]`, `[data-gokwik-function="checkout"]`, `.cart__checkout-button`, accelerated checkout elements;
   - **Buy It Now** (`[data-gokwik-function="buyNow"]`, `#gokwik-buy-now`) - judged on selected variant price x quantity, because GoKwik Buy Now checks out only that product;
   - clicks during an in-flight cart update (`.cart__items--disabled`) - blocked with "Updating your cart - please try again in a moment.";
   - form `submit` with the checkout submitter (Enter / `requestSubmit`).
3. At or above the minimum the guard returns immediately and GoKwik runs exactly as before - no GoKwik code, settings, merchant IDs or claim logic changed.

## Recommendation Logic

- Source: storefront `/products.json?limit=250` (59 products / 120 variants), cached 10 min in `sessionStorage`. No app, no new API. Liquid was rejected because `collections.all.products` caps at 50 without `paginate`, which is unsafe in the layout-level drawer.
- Excludes products already in the cart and unavailable variants.
- Per product: cheapest in-stock variant that **covers the gap** (else its priciest in-stock variant).
- Ranking: gap-covering products first, **cheapest first = least overshoot**; if fewer than 3 cover it, the largest partial steps fill the rest; ties keep storefront order. Max **3**.
- Quick add = one `/cart/add.js` with the drawer's sections -> `renderContents` (drawer stays open) or, on the cart page, the same section swap Dawn's `cart.js` does. Button disabled while in flight + module lock (no duplicates).

Measured (live catalogue):

| Cart | Gap | Suggestions | Overshoot |
|---|---|---|---|
| ₹95 (min temporarily ₹100) | ₹5 | Fish Masala, Egg Curry Masala, Oregano Flakes - ₹20 | ₹15 (cheapest item in store) |
| ₹50 | ₹49 | Undiyu Masala, Kitchen King 50g, Idli-Sambar 50g - ₹50 | ₹1 |
| ₹45 | ₹54 | Coriander 100g, Lajawab 50g, Mutton Masala 50g - ₹55 | ₹1 |
| ₹35 | ₹64 | Panipuri 100g, Chat Masala 100g, Super Hing 50g - ₹65 | ₹1 |
| ₹20 | ₹79 | Turmeric 100g, Chilli 100g, Aachar 100g - ₹80 | ₹1 |

Multi-pack products resolve to the smallest covering pack (Turmeric **100g ₹80**, not 200g ₹150).

## Mobile Results

| Width | Result |
|---|---|
| 360 px | No horizontal overflow; block inside drawer (330 px); "Add" buttons **64x44 px**; names wrap to 2 lines; checkout hit-test = the button itself (no dead zone) |
| 390 px | Same; drawer + cart page verified; screenshots taken |
| 430 px | Cart page: no overflow; **WhatsApp does not overlap Checkout**; checkout hit-test clean |
| Desktop pane | Drawer block + 3 suggestions, no overflow |

Drawer is `z-index: 1000` vs WhatsApp `90`, so WhatsApp cannot cover the drawer's controls. Sticky-ATC WhatsApp lift still works. Disabled checkout: 45% opacity + slight greyscale + `not-allowed` cursor.

## Checkout Bypass Tests (₹50 cart unless noted)

| Attempt | Result |
|---|---|
| Tap disabled drawer Checkout | Nothing dispatched - **PASS** |
| Force-enable button, then click | Guard blocked, message shown, sync re-disabled - **PASS** |
| `form.requestSubmit(checkout)` (keyboard submit path) | Submit prevented - **PASS** |
| `<a href="/checkout">` click | Blocked - **PASS** |
| GoKwik-claimed checkout element | GoKwik handler never ran (`_gokwikLock` false, no messages) - **PASS** |
| Click while cart update in flight (₹100 -> ₹50) | Blocked before GoKwik layer - **PASS** |
| Buy It Now ₹50 (empty cart and ₹50 cart) | Blocked with message; cart untouched (GoKwik's clear-cart never ran) - **PASS** |
| Stale page after Back/Forward (cart changed elsewhere) | `pageshow` refresh re-rendered drawer to the real total - **PASS** |
| **Typing `/checkout` directly** | **Reaches Shopify native checkout** (09:40 IST) - **LIMITATION** |
| Stale `/checkouts/cn/<token>` URL | Same class - Shopify checkout, outside theme control - **LIMITATION** |

**Limitation, stated plainly:** theme code cannot run on Shopify checkout pages, so a direct `/checkout` or old checkout URL bypasses the rule. Closing that needs a server-side rule: a Shopify **cart/checkout validation Function** (via an app), and/or a **minimum order value in GoKwik's merchant dashboard** if GoKwik offers one - not verified here (dashboard not accessible to me for this merchant). GoKwik's own checkout would not be affected by the theme bypass unless a minimum is set there.

## Tracking Regression

| Check | Result |
|---|---|
| Blocked attempts | **Zero** GoKwik messages (no `gaNew/begin_checkout`, no `google_ads_gk/begin_checkout`, no `facebook/trackEvents` InitiateCheckout, no `shopifyAnalytics/checkoutStarted`); no `begin_checkout` in `dataLayer`; no navigation |
| Allowed checkout (drawer ₹100, cart page ₹100, exactly-min ₹100, Buy Now 2x₹50) | GoKwik opened with the normal 4 messages: `gaNew/begin_checkout`, `shopifyAnalytics/checkoutStarted`, `google_ads_gk/begin_checkout`, `facebook/trackEvents` |
| Add to cart (PDP, sticky, suggestion quick add) | Exactly **1** `/cart/add` request each; Shopify's normal add-to-cart events fire (a quick add is a real add) |
| Console | No JS errors from the feature. Only `/sf_private_access_tokens 401` - **also present on production MAIN**, Shopify platform |

## Test Matrix

| Case | Expected | Result |
|---|---|---|
| Empty cart | No block, Dawn disabled checkout | PASS |
| ₹20 / ₹35 / ₹45 / ₹50 | Blocked, correct ₹X, 3 suggestions | PASS |
| ₹95 (min ₹100 temp.) | Blocked, "Add ₹5 more" | PASS |
| **Exactly minimum** (₹100 at min ₹100) | Allowed, GoKwik opens | PASS |
| ₹100 / ₹145 | Allowed, unchanged behaviour | PASS |
| Quantity change drops below | Disabled immediately (cart page + drawer) | PASS |
| Removing item drops below | Disabled immediately, suggestions return | PASS |
| Quick add ₹50 -> ₹100 | Enabled without reload, drawer stays open | PASS |
| Rapid double-click quick add | 1 request | PASS |
| Rapid click during update | Blocked | PASS |
| Stale drawer / Back-Forward | Refreshed | PASS |
| Buy It Now below / above | Blocked / GoKwik opens | PASS |
| Buy It Now notice after qty change | Notice clears | PASS |
| Sticky ATC, focus trap, WhatsApp lift | Unchanged | PASS |
| Discount pushes below minimum | Uses `cart.total_price` (post-discount) | Logic only - no discount created (would change store config) |
| Product becomes unavailable | Filtered by `available` | Logic only - no inventory changed |
| Direct `/checkout` | - | LIMITATION (see above) |

Bugs found and fixed during testing: (1) state sync used `requestAnimationFrame`, which background tabs pause - switched to a timer; (2) the "updating" notice was cleared by sync mid-update; (3) a stale Buy Now notice survived a quantity change; (4) product names truncated at 360 px - now 2 lines.

## Expected Production Diff

Exactly the 8 files above. Deploy = merge branch `min-order-99` into `shopify-main` and push (MAIN is GitHub-connected), **after** re-checking production GoKwik files for vendor drift (CLAUDE.md). Final checksums:

```
config/settings_schema.json         f3da27aa8f639644c22973af7285bc64
layout/theme.liquid                 c165cc4656fa62cec4ec7b8e1f828cf4
snippets/cart-drawer.liquid         69ceccbcaf1792eb22206f283e53db60
sections/main-cart-footer.liquid    14a88ac6e22e7d4f826e469fe4d10da0
snippets/vm-min-order.liquid        b7dca32178aeb02d1aa720559d1845c2
snippets/vm-min-order-guard.liquid  edd2b99b2a2f4f09a50127cbdb014f4c
assets/vm-min-order.js              ef0455af8d5a7c42ca312f1eed5321b5
assets/vm-min-order.css             5f652b30e696493cd53c841fc372ffdc
```

## Rollback Plan

1. **Instant, no deploy:** Theme editor -> Theme settings -> Vishesh Masala -> **Minimum order value = 0**. The guard exits, the snippet renders nothing, buttons revert to Dawn behaviour.
2. **Code rollback:** `git revert` the merge on `shopify-main` and push; MAIN re-syncs.
3. **Theme rollback:** `/t/5` (GoKwik Preview) and `/t/7` remain available as unpublished rollback themes.

## Side findings (not changed)

- **Possible native-checkout leak:** the drawer's Checkout is a native `type=submit` until GoKwik claims it (claims happen on visibility / 500 ms sweep). A tap in that window submits to Shopify's native checkout - a plausible source of the native `/checkouts/cn/...` traffic seen in GA4. Worth a separate fix.
- Test artefacts: several GoKwik checkout sessions opened (no order), a few Shopify native checkout pages loaded (may appear as abandoned checkouts around 09:23-09:41 IST 25 Sep and 23:23 IST 24 Sep), and test AddToCart events.

---

# Server-side enforcement investigation (25 Sep 2026, IST)

Nothing was created, installed, activated or changed. No app, no function, no Shopify or
GoKwik setting.

## 1. Can this store run a custom Cart and Checkout Validation Function? **No.**

- Store plan: **Basic** (`shopifyPlus: false`). No existing validations or functions.
- Shopify: *"Only stores on a Shopify Plus plan can use custom apps that contain Shopify
  Function APIs."* Stores on any plan may only use Functions inside **public App Store apps**.
- So a custom app + validation function (the originally requested build) cannot run here
  without upgrading to Plus. No function code was written for that reason.

### Supported route on Basic: Shopify's own **Checkout Blocks** app - "Order value limits"
- Available on **Basic, Grow, Advanced and Plus since 13 Apr 2026** (Shopify changelog).
- Blocks checkout ("orders outside these limits can't be checked out"); applies to
  **all payment methods including Shop Pay and accelerated checkouts**; it is a validation
  in Shopify checkout, so it also covers **direct `/checkout`** and **stale checkout links**
  (each checkout is re-validated).
- Compares the **order subtotal** (before gift cards / store credit). Whether that is after
  order-level discount codes, and whether the error text can be customised (e.g. to
  "Minimum order value is ₹99. Add ₹X more to continue."), is **not stated** in Shopify's
  help page - must be confirmed after setup. A dynamic ₹X message most likely needs a custom
  function, i.e. Plus.
- Not installed on this store. Installing is a store-level change -> needs approval.

## 2. Does GoKwik honour Shopify validation? **No - it cannot.**

- Every GoKwik order (#1013, #1015, ...) has `sourceName 420110368769`, app
  "Gokwik <> Visheshmasala"; the store has **zero draft orders**. GoKwik creates orders
  directly through the Admin API - it never goes through Shopify checkout or draft-order
  checkout, where validation functions run.
- Therefore neither a custom function nor Checkout Blocks can stop a GoKwik order below ₹99.

### GoKwik's own lever (found, not changed)
GoKwik dashboard -> Kwik Checkout -> Settings -> **Shipping** (merchant Visheshmasala, Live):
- one shipping method **#4 "Shipping", ₹49, Min Order Value ₹0**, Max unlimited, all
  payment methods, all PIN codes, cohort ALL;
- "Shipping method should be applicable on which price? **Discounted Price**".
- Setting that method's **Min Order Value to ₹99** would leave no shipping option below ₹99,
  i.e. GoKwik would refuse the order server-side. Customer-facing wording would be GoKwik's
  (likely "no shipping available"), not our message - GoKwik support should confirm the exact
  behaviour and whether a dedicated minimum-order setting exists.

## Enforcement layers after approval

| Layer | Protects | Status |
|---|---|---|
| Theme UX + guard (built, tested) | Drawer, cart page, GoKwik buttons, Buy It Now; no false InitiateCheckout | Ready on test theme #158885118065 |
| Checkout Blocks order value limit ₹99 | Direct `/checkout`, native checkout, Shop Pay / accelerated, stale links | Proposed - needs install + activation |
| GoKwik shipping Min Order Value ₹99 | GoKwik orders server-side | Proposed - needs change in GoKwik |

The threshold then lives in three places (theme setting, Checkout Blocks rule, GoKwik
shipping rule). They cannot be linked technically on Basic - change all three together.

---

# Checkout Blocks verification (25 Sep 2026, 09:55-10:10 IST)

- Shopify **Checkout Blocks** (developer: Shopify, free) installed with owner approval.
- Rule created by the owner in the app: Order limit validation, all customers, **minimum ₹99**,
  no maximum, Active. (The app's embedded screens can't be driven by browser automation, and
  its validations are not visible to this Admin API connector - verified by behaviour.)
- Tests: logged-out isolated browser, carts built via `/cart/add.js`, `/checkout` typed directly.
  No contact/address entered, no order submitted.

| Test | Checkout total | Result | Expected | Verdict |
|---|---|---|---|---|
| ₹50 cart, direct `/checkout` | ₹50.00 | Banner shown | Blocked | **PASS** |
| ₹95 cart (50+45), direct `/checkout` | ₹95.00 | Banner shown | Blocked | **PASS** |
| ₹100 cart (2x50), direct `/checkout` | ₹100.00 | No banner | Allowed | **PASS** |
| ₹120 cart, code ₹30 off -> ₹90 | ₹90.00 (savings ₹30.00) | **No banner** (also after reload) | Blocked | **FAIL** |
| ₹120 cart, code ₹20 off -> ₹100 | not isolated - checkout kept code A (codes don't combine) | - | Allowed | n/a (pre-discount basis allows it anyway) |

**Exact customer-facing message (Shopify checkout, top banner, shown on load):**
> Order subtotal is less than the ₹99.00 minimum. Update your cart to complete checkout.

The "Complete order" button stays clickable; the block is server-side on submission (Shopify
validation). Submission was not exercised - it needs personal data and, if not blocked, would
create a real COD order (native checkout offers **Cash on Delivery**).

## STOP - subtotal basis limitation
**Checkout Blocks evaluates the subtotal BEFORE discount codes.** A ₹120 cart discounted to
₹90 passes. Our rule is ₹99 AFTER discounts.

- Theme layer uses the correct basis: with code A applied, `/cart.js` showed
  `total_price 9000` vs `original_total_price 12000`, so the theme would block that cart.
- GoKwik's shipping rule is configured on "Discounted Price" (correct basis) - not yet changed.
- Real exposure today: the only active discount is **VISHESH10** (10% off, no minimum, no
  expiry, 0 uses). A ₹99-₹109.99 cart + VISHESH10 in native Shopify checkout = ₹89.10-₹98.99,
  which Checkout Blocks allows.

Temporary codes `VMT99A-G3SK1GFG` (₹30) and `VMT99B-1J80711N` (₹20): **deactivated / EXPIRED
at 10:05:32 IST, 0 uses.** Test cart and applied codes cleared.

---

# Option 1 - discount minimum + GoKwik shipping minimum (25 Sep 2026, IST)

## VISHESH10 - minimum purchase ₹110 (saved 10:14:10 IST)
Changed via Admin API `discountCodeBasicUpdate`, **minimum requirement only**. Before/after
read back from the API:

| Field | Before | After |
|---|---|---|
| Value | 10% | 10% |
| Applies to | 17 collections | 17 collections |
| Minimum requirement | none | **subtotal ≥ ₹110.00** |
| Starts / ends | 18 Sep 15:24 IST / no end | unchanged |
| Usage limit / once per customer | none / yes | unchanged |
| Combines with | nothing | unchanged |
| Buyers | all | unchanged |
| Status / uses | Active / 0 | Active / 0 |

Shopify's minimum on a collection discount counts only the items in those collections, which
is the same set the 10% applies to - so any cart it discounts keeps ≥ ₹99 of merchandise.

Verification (isolated logged-out browser, Shopify's own checkout, no order):

| Cart | Result | Verdict |
|---|---|---|
| ₹105 (Black Salt 1kg) + VISHESH10 | "VISHESH10 discount code isn't valid for the items in your cart" - total ₹105.00 | **PASS** |
| ₹110 (Pavbhaji 100g) + VISHESH10 | −₹11.00 → **₹99.00** | **PASS** |
| ₹120 (Premium Hing 100g) + VISHESH10 | −₹12.00 → **₹108.00** | **PASS** |

₹109 can't be built from real products (every price is a multiple of ₹5); ₹105 is the nearest
reachable cart below the minimum. `/cart.js` agreed on all three (`applicable` false/true/true).

## GoKwik - Shipping Method #4 minimum ₹0 → ₹99 (Live Mode, merchant Visheshmasala)
Edited in Checkout Settings → Shipping → #4 → Edit → Save Changes, then the page-level Save.
Live `merchant-config?mode=live` read back after a reload:

| Field | Before | After |
|---|---|---|
| `min` | 0 | **99** |
| `price` | 49 | 49 |
| `max` | 9007199254740991 | 9007199254740991 |
| `payment_options` | all | all |
| `shipping_calculated_on` | discounted_price | discounted_price |
| PIN codes / cohort / PPCOD block / COD charge | none / none / false / 0 | unchanged |

The dashboard now warns "Shipping not defined between ₹0.00 - ₹98.99 range" - expected.

## GoKwik real-flow tests (live MAIN theme, no order placed)

| Cart (after discounts) | GoKwik result | Verdict |
|---|---|---|
| ₹95 (₹55 + ₹40) | Address card: **"Pincode not serviceable."**, "Deliver Here" greyed out, no shipping | **PASS** (blocked) |
| ₹99 (₹110 + VISHESH10) | "VISHESH10 applied", "You saved ₹11", Shipping ₹49, total ₹148 | **PASS** (boundary allowed) |
| ₹100 | Shipping ₹49, total ₹149 | **PASS** |
| ₹110 | Shipping ₹49, total ₹159 | **PASS** |
| ₹105 + VISHESH10 (code on the Shopify cart) | Code not carried into GoKwik, total ₹154 | **PASS** |

**Exact customer-facing message below ₹99:** `Pincode not serviceable.` - GoKwik's generic
"no shipping method" text. It's misleading (the pincode is fine; the order is too small),
but the theme's drawer message ("Minimum order value is ₹99. Add ₹X more to checkout.") means
customers on the storefront never reach it. Changing it is a GoKwik-side setting/support ask.

Not tested (needs a real person at the keyboard): typing VISHESH10 **manually into GoKwik's
own coupon box** on a ₹105 cart. GoKwik orders are created through the Admin API, so GoKwik
has to enforce the ₹110 minimum itself - worth one manual check.

### Finding - GoKwik's prepaid "Additional 5% discount"
GoKwik's payment step offers **UPI/Cards "Get 5% off"** on top of everything else, applied
after the shipping decision:

| Cart | Merchandise after discount code | After prepaid 5% | Total shown |
|---|---|---|---|
| ₹100 | ₹100 | **₹95** | ₹144.00 |
| ₹110 + VISHESH10 | ₹99 | **₹94.05** | ₹143.05 |

So a prepaid order can end with less than ₹99 of merchandise. Nothing was changed. Options:
(a) treat payment-method offers as outside the ₹99 rule; (b) give the prepaid offer its own
minimum in GoKwik; (c) raise the thresholds so the rule holds even after the 5%. Owner's call.

## Discount rule (all future discounts)
> **Every discount must preserve a minimum post-discount merchandise value of ₹99.**

- Percentage discount: `minimum eligible cart = CEILING(₹99 / (1 - discount %))`
  - 10% → ₹110 · 15% → ₹117 · 20% → ₹124 · 25% → ₹132
- Fixed-amount discount: `minimum eligible cart = ₹99 + discount amount`
  - ₹30 off → ₹129

---

# Drawer-only cart + GoKwik timing gap (25 Sep 2026, IST)

## What changed (branch `min-order-99`, test theme #158885118065 only)
- **Checkout buttons render as `type="button"`** (`snippets/cart-drawer.liquid`,
  `sections/main-cart-footer.liquid`). Before, the drawer button was a native submit to
  `/cart` → `/checkout` until GoKwik's 500ms sweep replaced it; a tap in that window went to
  Shopify's checkout.
- **Hand-off in the head guard** (`snippets/vm-min-order-guard.liquid`, runs before GoKwik):
  an allowed tap on a not-yet-claimed checkout button is held, "Opening secure checkout…" is
  shown, and the tap is replayed on GoKwik's clone as soon as it exists. Repeat taps are
  absorbed; a tap on the new clone cancels the replay so GoKwik opens once; if the drawer closes
  or re-renders below ₹99 it stands down. If GoKwik never claims the button (script blocked),
  after 10s: "Checkout is taking longer than usual to load. Please check your connection and
  tap Check out again." **No native fallback.**
- **Enter in a drawer quantity box** used to post the drawer form to `/cart` (full page
  navigation). Now dropped, and the quantity is applied in the drawer.
- **Header cart icon** opens the drawer even before `cart-drawer.js` has loaded (it waits for
  it; `/cart` only if the drawer never arrives within 4s).
- **Card quick-add** (`assets/vishesh-pack-selector.js`) no longer falls back to `/cart` on an
  error - it shows the error on the card.
- **Direct `/cart`**: page still renders normally (no redirect - bots, no-JS, bookmarks and
  Shopify internals keep working), and with items the drawer opens over it. Changes in the
  drawer re-render the page underneath and vice versa (`assets/vm-min-order.js`).
- **Bug fixed on the way:** `vm-min-order.js` tested `window.PUB_SUB_EVENTS`, which is always
  undefined (Dawn declares it with `const`), so its cart-update subscription never registered.
- Checkout stays blocked while a suggestion quick-add is in flight (`VM.busy`).

Theme links to `/cart` that remain: only the header icon's `href` (no-JS fallback; JS opens the
drawer). Dawn's `product-form.js` still has `window.location = cart_url` for themes without a
drawer - unreachable while cart type is "drawer". GoKwik's own error path
(`window.location.href = "/checkout"` in `executeFlow`) is vendor code and was not touched.

## Test results (test theme #158885118065, 25 Sep 2026 ~10:30-10:55 IST, no order placed)
The Chrome window reported the page as hidden (CSS transitions frozen, timers throttled to
~1s - which makes GoKwik's claim gap *longer*). Transitions were switched off in page memory
for the tests; "slow network" = every storefront request delayed 1.5s in page memory.

| Test | Result | Verdict |
|---|---|---|
| PDP Add to Cart ₹110 → 5 taps on the fresh, unclaimed drawer button | Tap 1 held and handed over, GoKwik opened once, no native submit, no unload, URL unchanged | **PASS** |
| Same with 1.5s network delay, 8 taps | GoKwik once (1 iframe throughout), no native submit | **PASS** |
| ₹55 Add to Cart with 1.5s delay, 4 taps incl. forced events | All blocked, "Minimum order value is ₹99. Add ₹44 more to checkout.", no GoKwik | **PASS** |
| ₹55 → ₹110 second Add to Cart, 6 taps | GoKwik once | **PASS** |
| Suggestion quick-add in drawer (₹55 → ₹100) + tap during the add + taps after | Tap during add blocked; GoKwik once after; drawer stayed open until GoKwik | **PASS** |
| GoKwik never claims the button (claim switched off in page memory) | "Opening secure checkout…" then after 10s "Checkout is taking longer than usual…"; no native, no GoKwik | **PASS** |
| Header cart icon | Opens drawer, no navigation | **PASS** |
| Enter in drawer quantity box | Submit to `/cart` dropped; quantity 1→2 applied in the drawer; checkout unblocked | **PASS** |
| Direct `/cart` with items | Page renders; drawer opens over it | **PASS** |
| `/cart`: change in drawer / change on page | The other view re-renders to match; both buttons follow the minimum | **PASS** |
| `/cart` with empty cart | Page shows empty cart, drawer not auto-opened, buttons disabled | **PASS** |
| Back to a PDP after the cart changed elsewhere (bfcache) | Drawer re-rendered to the new ₹55 cart, checkout disabled | **PASS** |
| Back into `/cart` after emptying the cart elsewhere | Page reloaded itself, empty cart shown | **PASS** |
| Back/Forward from Chrome's HTTP cache (not bfcache) | Found stale drawer markup; fix added (refresh on `back_forward` navigations), not re-tested | Fixed, untested |

Chrome's Back button (as driven by the automation) skipped automation-opened entries on both
the test theme and live MAIN, so Back/Forward was driven with `history.back()` instead.

Test theme = branch `min-order-99`, checksums (all match local):
settings_schema f3da27aa · theme.liquid c165cc46 · cart-drawer 0f6e06dd · main-cart-footer
6542ef02 · vm-min-order.liquid b7dca321 · vm-min-order-guard c07e5f30 · vm-min-order.js
d581ba8b · vm-min-order.css 5f652b30 · vishesh-pack-selector.js c4322198 · vishesh-sections.css
2606cf6a · gokwik.liquid 9f17343a (unchanged). MAIN unchanged (theme.liquid 67971832,
gokwik.liquid 9f17343a, settings_data ce084c4a).

---

# Pre-merge checks (25 Sep 2026, ~11:00-11:20 IST)

## 1. GoKwik prepaid 5% - STOPPED
The offer lives in Checkout Settings → Payments → **Tiered Prepaid Discounts** (Live Mode).
It has its own per-offer "Lower Order Limit", so the global ₹99 shipping minimum was not touched.

| Field | Before | After (saved 11:02:16 IST) |
|---|---|---|
| Payment method | all-prepaid | all-prepaid |
| Discount type / value type | Non Freebie / percentage | unchanged |
| Discount value | 5 | 5 |
| **Lower order limit** | 0.01 | **105** |
| Upper limit | 9007199254740991 | unchanged |
| Capping / RTO-driven | none / false | unchanged |
| Row id | 126981 | 128581 (GoKwik re-created the row on save) |

The field's help text only says "lower value limit for which the discount is applicable", and
the config has no basis field. **Result: ₹100 cart still got "UPI - Get 5% off" (₹149 → ₹144.00)
at 3, 8 and 17 minutes after saving.** The limit is therefore not evaluated on the pre-5%
merchandise value - most likely it is checked against the order total including the ₹49
shipping (any shippable order is ≥ ₹148, so ₹105 never bites), or GoKwik is still serving a
stale copy. Per instructions: stopped, no further GoKwik changes. The ₹105 value is still saved.

## 2. VISHESH10 typed inside GoKwik - NOT TESTED
The logged-out popup shows a coupon box above "Login to continue", but taps into it did not
take focus or text (cross-origin iframe; likely needs login). The logged-in Chrome session
counts as a hidden window, so input doesn't reach the iframe there either. Still needs a
manual check.

## 3. Mobile pass - built-in browser at 390x844 (touch + Android UA), test theme
Not a physical phone - the iOS Simulator needs full Xcode, which isn't installed.

| Step | Result |
|---|---|
| Add ₹55 product (real tap) | Drawer opened |
| ₹99 messaging | "Minimum order value is ₹99. Add ₹44 more to checkout.", bar ₹55/₹99, 3 suggestions, "Add ₹44 more to checkout" above the button |
| Suggestion quick-add (tap) | Drawer stayed open, ₹100, "Minimum order reached ✓", Check out enabled |
| Taps during the in-flight add | Button disabled - nothing reached GoKwik |
| Add to Cart then 6 taps on checkout at 0.5s | GoKwik popup opened once (3 items, ₹155); no native submit, no unload, stayed on the PDP |
| Back / Forward after the cart changed | Home (re-run from cache, `back_forward`) and PDP both showed the current ₹55 cart, checkout disabled |
| WhatsApp button | No overlap: behind the drawer (z 90 vs 1000); on the PDP it sits above the sticky ATC bar (y 712-760 vs 772-844) |
| `/cart` | Never visited in the flow |

## Prepaid limit reverted (25 Sep 2026, 11:24:14 IST)
Tiered Prepaid Discount "Lower Order Limit" set back from 105 to **0.01** on owner instruction.
Live config read back after reload: all-prepaid, Non Freebie, 5, percentage, lower 0.01,
upper 9007199254740991, no cap, not RTO-driven (row id now 128584 - GoKwik re-creates the row
on every save). Nothing else changed.

Still in place: GoKwik shipping #4 minimum ₹99 (Discounted Price), VISHESH10 minimum ₹110,
Shopify Checkout Blocks ₹99, theme work on the unpublished test theme only.

Not pursued, by owner decision: raising the prepaid limit to a shipping-inclusive figure
(₹150/₹154). Shipping charges will vary by region and payment method, and discount
eligibility must not depend on shipping.

# DEPLOYMENT BLOCKER (only remaining one)
**GoKwik's prepaid 5% can take an order below ₹99 of merchandise.** Example: ₹110 cart +
VISHESH10 = ₹99, then UPI/cards 5% = ₹94.05. GoKwik's per-offer "Lower Order Limit" did not
stop the offer on a ₹100 cart (₹149 with shipping) even at ₹105, so it is not measured on
merchandise alone. Waiting on GoKwik support (question below). The theme branch
`min-order-99` stays unmerged until this is resolved or the owner accepts it.

### GoKwik support question
> Hi GoKwik team - merchant Visheshmasala (MID 19w0ssjui6cg), Live Mode.
>
> Under Checkout Settings → Payments → Tiered Prepaid Discounts we have one rule: All
> Prepaid, 5% (percentage). We set its Lower Order Limit to ₹105, but a cart with ₹100 of
> products (₹149 with ₹49 shipping) still got "UPI - Get 5% off", even 17 minutes after
> saving. It looks like the limit is checked against the order total including shipping.
>
> Can the Lower Order Limit be evaluated on the **merchandise subtotal, excluding shipping,
> after normal coupon codes but before the prepaid discount itself**? For example, ₹110 of
> products with a 10% coupon (₹99) should not qualify for a ₹105 limit.
>
> If that isn't possible today, is there another setting that achieves it? We don't want
> prepaid discount eligibility to depend on shipping charges.

## Prepaid 5% temporarily disabled (25 Sep 2026, ~11:26 IST)
Checkout Settings → Payments → Tiered Prepaid Discounts: master switch **off**, Save. Rule not
deleted. Full live `merchant-config` diffed before/after - exactly one change:
`enable_tiered_discounts: true → false`. The rule is unchanged (id 128584, all-prepaid, 5,
percentage, lower 0.01, upper 9007199254740991, not deleted). **To re-enable:** turn the
switch back on and Save.

Live checkout (MAIN theme, logged-in GoKwik session, no order placed):

| Cart | GoKwik result | Verdict |
|---|---|---|
| ₹100 | Shipping ₹49; UPI/Cards/Netbanking/Wallets all ₹149.00; no "Additional 5% discount" | **PASS** - prepaid offer gone |
| ₹95 | "Pincode not serviceable.", Deliver Here greyed, no shipping | **PASS** - ₹99 minimum holds |
| ₹110 + VISHESH10 | "VISHESH10 applied", saved ₹11, shipping ₹49, all methods ₹148.00 | **PASS** - ₹99 goods, no 5% |
| ₹105 + VISHESH10 | Shopify cart: code not applicable; GoKwik ₹154, no discount | **PASS** - ₹110 minimum holds |

With the prepaid offer off, the only remaining discount (VISHESH10) keeps every order at
≥ ₹99 of goods, so the prepaid blocker no longer blocks deployment. Re-enabling the prepaid
offer re-opens it until GoKwik answers the support question above.

Pre-deploy drift check (11:28 IST): MAIN theme.liquid, gokwik.liquid, buy-buttons.liquid,
settings_data.json, settings_schema.json, cart-drawer, main-cart-footer, vishesh-pack-selector.js,
vishesh-sections.css all equal `origin/shopify-main` (36ccc7c). Branch `min-order-99` is based
on 36ccc7c, no newer commits upstream. Test theme = branch on all 11 files.

---

# Shipping matrix audit - STOPPED (25 Sep 2026, ~11:35-11:50 IST)

Requested matrix (eligibility on post-discount merchandise before shipping):

| | Prepaid < ₹599 | COD < ₹599 | Prepaid ≥ ₹599 | COD ≥ ₹599 |
|---|---|---|---|---|
| Rest of India | ₹59 | ₹100 | FREE | ₹79 |
| North East & J&K | ₹80 | ₹120 | FREE | ₹79 |

Read-only audit of GoKwik (dashboard UI, live `merchant-config`, GoKwik's public shipping guide).
Nothing was saved; live config diff before/after = none. Live checkout still ₹49 flat.

| Dimension | What GoKwik offers per shipping method | Can it express the matrix? |
|---|---|---|
| ₹599 band | Min/Max Order Value, basis "Discounted Price" (merchant-wide) | **Yes** (as the ₹99 minimum already shows) |
| Prepaid vs COD | "Select Payment Option": **All / COD / UPI** only | **No, not exactly** - there is no "Prepaid" choice. "UPI" would leave Cards, Netbanking and Wallets without a prepaid rate; "All" also matches COD, and which method wins when two match is undocumented |
| Region | "Upload List of Serviceable PIN Codes" - an allow-list per method. No state/zone selector, no exclude list, no precedence rule | **No, not cleanly** - North East/J&K can be listed, but "Rest of India" would need an allow-list of every other PIN in India |

Why the workarounds were rejected as fragile:
- Rest of India as an explicit list of real PINs (~19k): any PIN missing from the list - new
  PINs, typos in the source data - becomes unserviceable, i.e. lost orders.
- Rest of India as every 6-digit number outside the NE/J&K ranges (~850k rows): untested at
  that size, and GoKwik may validate or reject non-existent PINs.
- Overlapping "All" + "COD" methods, or generic + PIN-specific methods, rely on undocumented
  precedence - the customer might be shown both, or the cheaper one.
- A flat COD surcharge on top of prepaid rates doesn't fit: the gaps differ (₹41, ₹40, ₹79).

Other things found:
- Merchant-level `cod_charge: 100` exists with `show_cod_charge_config: false`. Whether COD
  orders currently pay ₹100 on top of shipping was not confirmed (the COD row wasn't reachable
  in the hidden-window popup). Must be known before any COD rate goes live, or COD could be
  double-charged.
- Region definition needs a decision: does "J&K" include Ladakh (PIN 194xxx)? Does "North
  East" include Sikkim (737xxx)? PIN prefixes: J&K/Ladakh 18-19, Assam 78, other NE states 79.

Cart-drawer "FREE prepaid shipping" messaging was not built: it would advertise a rate that
doesn't exist in checkout yet. Theme branch unchanged since the last report.

### GoKwik support question (shipping)
> Hi GoKwik team - merchant Visheshmasala (MID 19w0ssjui6cg), Live Mode.
>
> We need this GoKwik shipping matrix, with the ₹599 split on the discounted merchandise
> subtotal (before shipping):
> - Rest of India: prepaid < ₹599 ₹59, COD < ₹599 ₹100, prepaid ≥ ₹599 free, COD ≥ ₹599 ₹79
> - North East & J&K: prepaid < ₹599 ₹80, COD < ₹599 ₹120, prepaid ≥ ₹599 free, COD ≥ ₹599 ₹79
>
> 1. The shipping method "Select Payment Option" only offers All / COD / UPI. How do we map a
>    method to **all prepaid methods** (UPI, cards, netbanking, wallets) and not COD?
> 2. Region: can a method apply to "all PIN codes except a list" (or by state)? If we upload a
>    PIN list for the North East/J&K methods and leave the Rest-of-India methods without a list,
>    which method does a North East PIN get - only the PIN-specific one, or both?
> 3. When two methods match the same order, does the customer see both, the cheapest, or the
>    first by sort order?
> 4. Our config has `cod_charge: 100` with the COD charge display off. Is a ₹100 COD fee being
>    added to COD orders today? We need COD totals to equal only the shipping rate above.

---

# Shipping rule v2: ₹79 / free prepaid at ₹599+ (25 Sep 2026, IST)

Rule: after-discount merchandise < ₹599 → prepaid ₹79, COD ₹79 + ₹100 COD fee = ₹179;
≥ ₹599 → prepaid free, COD ₹49 total.

## Audit before editing (~11:40-11:55 IST)
- One shipping method: #4 "Shipping" ₹49, min ₹99, max unlimited, payment All, dynamic COD
  fee off (method `cod_charges` 0), basis Discounted Price.
- Merchant-level `cod_charge: 100`, `show_cod_charge_config: false` (not editable in the
  dashboard). **It is applied:** COD orders #1015 and #1014 each carry two shipping lines,
  "Shipping ₹49" + "COD Charges ₹100". Prepaid orders #1001-#1013 carry only "Shipping ₹49".
- Payment option per method: All / COD / UPI. Product-based rules: none. Weight-based: none.
  Discount-based shipping: off. No `ship@` tags on any product. Tiered prepaid 5%: off.
- Native per-method COD pricing exists: "Do you want to charge dynamic COD fee?" adds
  "Total Shipping Price" (what COD pays) and "COD Charges" (= total − shipping price).

## Architecture used
Two methods, both payment All, basis Discounted Price, dynamic COD fee on:

| Method | Order value | Prepaid shipping | COD total | COD fee part |
|---|---|---|---|---|
| #4 Shipping (edited) | ₹99 - ₹598.99 | ₹79 | ₹179 | ₹100 |
| #716 Shipping (new) | ₹599 - ∞ | ₹0 | ₹49 | ₹49 |

The COD fee is threshold-aware because it lives on each banded method, not on the global
`cod_charge`. Saved ~11:56 IST. Full live-config diff before/after: only `shipping_prices`
changed (#4: price 49→79, total_amount 49→179, cod_charges 0→100, max ∞→598.99; #716 added).
Global `cod_charge` still 100 (untouched, not editable).

## Test results (live MAIN theme, logged-in GoKwik session, no order placed)

| Cart | After discount | GoKwik shipping | Prepaid total | Verdict |
|---|---|---|---|---|
| ₹95 | ₹95 | none - "Pincode not serviceable." | - | **PASS** (₹99 minimum) |
| ₹100 | ₹100 | ₹79 | ₹179.00 (UPI/Cards/Netbanking/Wallets) | **PASS** |
| ₹500 | ₹500 | ₹79 | ₹579.00 | **PASS** |
| ₹595 | ₹595 | ₹79 | ₹674.00 | **PASS** (below edge) |
| ₹600 | ₹600 | Free | ₹600.00 | **PASS** (above edge) |
| ₹715 | ₹715 | Free | ₹715.00 | **PASS** |
| ₹650 + VISHESH10 | ₹585 | ₹79 | ₹664.00 | **PASS** |
| ₹700 + VISHESH10 | ₹630 | Free | ₹630.00 | **PASS** |

₹599 exactly can't be built from real products (all prices are multiples of ₹5, and 10% off
never lands on 599); ₹595/₹600 bracket it. Min is inclusive (proven by the ₹99 boundary).
No "5% off" on any payment row - tiered prepaid stays off.

**COD: NOT VERIFIED.** The payment list for this logged-in account shows only UPI, Cards,
Netbanking and Wallets - no Cash on Delivery row at any cart value. COD is in the store's
`payment_methods` and GoKwik RTO is on; this account placed two COD orders yesterday (#1014,
#1015, both pending), so GoKwik's RTO risk engine is the likely reason COD is hidden for it.
Whether the per-method COD fee replaces the global ₹100 or adds to it (₹179 vs ₹279 below ₹599;
₹49 vs ₹149 at ₹599+) is therefore still unknown. Needs a COD check from a different customer.

## Rollback
GoKwik → Checkout Settings → Shipping:
1. #4 → Edit: Shipping Price 49, Max Order Value 9007199254740991, dynamic COD fee OFF
   (Total 49, COD charges 0) → Save Changes.
2. #716 → Delete.
3. Page-level **Save**. Verify `merchant-config?mode=live` shows only #4 at ₹49/min 99.
This restores the previous behaviour (prepaid ₹49, COD ₹49 + global ₹100).

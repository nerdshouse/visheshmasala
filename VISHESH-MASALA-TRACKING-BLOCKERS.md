# Vishesh Masala - Tracking Blockers Verified (Round 2d)

Read-only. **Nothing was created, imported, changed or published.** No order placed.
Two test Add to Carts were made in an isolated browser session (no checkout started),
which added two AddToCart events to Meta. Temporary GA4 report dimensions and a
Merchant Center status filter were view-only and not saved.

GA4 property **Vishesh Masala** (`a407715284 / p553781186`) - stream `15758920101` -
Measurement ID **`G-H88KFX0B26`** (confirmed in Admin -> Data streams).
Google Ads **159-566-7643**. Merchant Center **5850243903** (my earlier `…3893` was a
misread of a small screenshot; that is why access "failed" before).

---

## 1. GA4 Purchase health - BROKEN (zero purchases)

GA4 Events report, last 28 days, all 16 events:

| Event | Count | | Event | Count |
|---|---|---|---|---|
| page_view | 1,230 | | add_to_cart | 129 |
| view_item | 680 | | view_item_list | 111 |
| session_start | 656 | | add_shipping_info | 60 |
| user_engagement | 598 | | begin_checkout | 37 |
| first_visit | 594 | | click | 15 |
| scroll | 260 | | remove_from_cart | 12 |
| form_start | 255 | | form_submit / search / view_search_results | 3 / 1 / 1 |

**No `purchase`. No `add_payment_info`. Total revenue ₹0.00.**

Same window in Shopify: **10 paid orders, ₹3,093** (#1004-#1013), plus 4 cancelled/refunded.

So per-order checks (transaction_id, value, currency, items, source/medium, duplicate
transaction_ids) cannot be done - there is nothing to check.

### Why
- **Every order is created by the GoKwik app** (`sourceName 420110368769`, app
  "Gokwik <> Visheshmasala", gateways "Gokwik UPI"/"Gokwik Cards"). None goes through
  Shopify checkout.
- Shopify's Google pixel maps `purchase` from Shopify's `checkout_completed`, which only
  fires on Shopify's own Thank You page. A GoKwik-created order never reaches it.
- GoKwik's own GA4 bridge is not emitting either (its `add_payment_info`/`purchase`
  would appear in GA4 - they don't).

### Correction to Round 2c
I said Shopify's GA4 `purchase` "very likely" fires and that GoKwik's would double it.
**Wrong.** Shopify's fires zero. The 9 browser Purchase events in Meta come from
**GoKwik's `fbq`**, not Shopify's pixel. GoKwik is the only in-browser source that can
see a purchase at all, so for GA4 it is a gap-filler, not a duplicate.

### Secondary finding - native Shopify checkout is still being reached
The 37 `begin_checkout` and 60 `add_shipping_info` in GA4 are on **Shopify native checkout
pages** (`/checkouts/cn/<token>/en-in`), with matching page_views. Dates: 13, 15, 16,
**17 (15)**, 18, 19 and **23 Sep** - all after GoKwik went live. Shopify also lists
**43 abandoned native checkouts since 9 Sep, none completed**.
Some sit seconds away from a GoKwik order for the same product (e.g. a Rajwadi Garam
Masala checkout 23 s before order #1011), so part may be GoKwik-created artefacts. But
real browsers did render Shopify checkout pages. **Worth its own investigation** - it is a
possible conversion leak, outside this round's scope.

---

## 2. Google Ads import plan

Current state (read only):

- **GA4 is already linked to Google Ads 159-566-7643** - linked **24 Sep 2026** by
  axit@nerdshouse.com, personalised advertising enabled.
- Google Ads already has three **Primary** conversion actions, all Website-tag actions
  that have never fired:

| Goal | Action | Source | Status |
|---|---|---|---|
| Purchase | **Purchase** - manual event to **`AW-18429667990`**, last click, enhanced conversions off | Website | **Misconfigured** |
| Add to basket | Shopping Cart | Website | Awaiting conversions |
| Begin checkout | (1 action) | Website | Needs attention |

- `AW-18429667990` is **not on the storefront** (confirmed earlier: no `AW-` anywhere).
- Diagnostics: "Set up conversion measurement". **No ads are currently running.**

**Importing GA4 `purchase` today would import a conversion that has never fired.**
Fix GA4 purchase first (section 6), confirm on one real order, then:

1. GA4 link: already done - no action.
2. Google Ads -> Goals -> Conversions -> **+ New -> Import -> Google Analytics 4 -> Web -> `purchase`**.
3. Set the imported **GA4 purchase = Primary**.
4. Set the existing Website **Purchase (AW-18429667990) to Secondary** (or remove it) - two
   Primary actions in one goal would double-count once both work.
5. Set **Shopping Cart** and the **Begin checkout** Website actions to Secondary - they are
   Primary today and will never fire, which misleads bidding.

Alternative (not recommended as first choice): GoKwik's bundle has its own Google Ads
bridge (`gtag("config", <AW>, {allow_enhanced_conversions:true})` then `gtag("event",
"purchase"|"conversion", …)`), which could make `AW-18429667990` work directly - but it is
configured on GoKwik's side and would be a second purchase path. Pick one route, not both.

---

## 3. PDP Meta browser beacon - exact root cause

**There is no transmission failure. The "PDP sends zero beacons" finding from Round 2 was
my measurement blind spot.**

On product pages `fbevents.js` sends events as a **hidden-iframe `<form>` POST to
`https://www.facebook.com/tr/`**, not as an image GET. A form POST in an iframe does not
appear in the page's resource timing or in the fetch/XHR/image/sendBeacon hooks I used in
Round 2, so it looked like nothing was sent.

Verified on production, PDP `/products/cold-coco-powder`, hooking `HTMLFormElement.submit`:

| POST | ev | eid | fbp | fields |
|---|---|---|---|---|
| 1 | `SubscribedButtonClick` | `ob3_plugin-set_f6b3…` | **present** | 99 |
| 2 | `AddToCart` | `sh-d474b66c-B552-40BC-FD8A-F189C3A5921E` | **present** | 100 |

The home page stays small enough for GET (`PageView` image beacon seen). The PDP payload is
large because of `pmd[description]`, `pmd[contents]`, `sssd[…]`, `mft[microdata]` and
`audff[…]` fields - Meta's automatic page/product metadata - so fbevents switches to POST.

The other suspects, each checked:

| Suspect | Finding |
|---|---|
| `gateCheck('shopify_sandbox')` | **Does not suppress events.** Meta's web pixel (`web-pixel-2426208369`) calls `fbq("trackShopify", …)` unconditionally; the gate (3 s timeout) only decides whether cookies are refreshed first. |
| Runtime context | `OPEN` - runs in the top window with the real `fbq`. |
| Duplicate Meta init | None. `fbq.getState().pixels` = `["1617160383302964"]` only. |
| GoKwik OCC | Claims buttons only; fires Meta events on checkout steps, not on PDP view. |
| Event suppression / interception | None found. No console errors from the pixel. |
| Custom pixel (`shopify-custom-pixel`, LAX) | Inert (from Round 2). |

**Not directly captured:** the PDP's load-time PageView/ViewContent. Shopify refuses to be
framed, so hooks can't be installed before load. They run through the same `w()` ->
`trackShopify` path with a similar payload, so the same POST transport is the strong
inference.

### What this means for ViewContent EMQ
- The browser POST **carries `fbp`**. Meta's "Shared parameters" panel (the one missing
  `fbp` on ViewContent) describes parameters **sent via Conversions API**. So the missing
  `fbp` is in **Shopify's server-side ViewContent**, not the browser event. Repairing the
  browser beacon could not have fixed it - and there's nothing to repair.
- Browser ViewContent (624) < server (1,259): consistent with normal browser loss - ad
  blockers, in-app browsers, and a hidden-iframe POST being cancelled when the visitor
  leaves quickly - which CAPI does not suffer. Meta itself reports this as +48.2%
  CAPI uplift. Not a defect.

### Proposed Meta fix
- **No theme change, no pixel change, no second pixel.** Shopify CAPI, `sh-` event IDs and
  deduplication stay as they are.
- Raise with **Shopify support (Facebook & Instagram app)**: server-side ViewContent is sent
  without `fbp` while AddToCart/InitiateCheckout/Purchase include it at 100%. That is the only
  lever on ViewContent EMQ, and it is on Shopify's side.
- Optional, reversible experiment only: turning off Meta's *"Automatically include more
  detailed page and product info"* would shrink PDP payloads back to GET beacons. It trades
  away catalogue signal; I would not do it just to chase browser counts.

### New, higher-priority Meta finding - Purchase likely double-counted
GoKwik's Meta events all use `eventID = "Gokwik_" + random` - **including Purchase** (code:
`o="Gokwik_".concat(e.data.random)` -> `fbq("track", r, i, {eventID:o})`). Shopify's CAPI
Purchase uses Shopify's own ID. They cannot deduplicate. Meta shows **Purchase 9 browser + 11
server = 20** against **10 paid orders** (14 incl. cancelled), and dedup for Purchase is
"Still Parsing". The live Meta campaign "India | Broad | Website Purchases" optimises on this
event. **Verify in Ads Manager: reported purchases vs Shopify orders for the same dates.**

---

## 4. Merchant Center - the 4 disapprovals

Merchant Center 5850243903, Products -> Needs attention:

> **Missing product image** - "Your products are missing links to product images. Product
> images are a mandatory attribute for your products to be shown to customers on Google" -
> **4 products (2.2%)**

| Product | MC item ID | Price | Shopify |
|---|---|---|---|
| Dalshak Masala | `shopify_ZZ_7815684980849_44373236613233` | ₹325 | ACTIVE, 1 variant (1kg, VM-GM-DAL-1000), **0 media** |
| Special Garam Masala | `shopify_ZZ_7815685111921_44373239857265` | ₹520 | ACTIVE, 1kg, VM-GM-SPL-1000, **0 media** |
| Surti Garam Masala | `shopify_ZZ_7815685079153_44373236678769` | ₹455 | ACTIVE, 1kg, VM-GM-SUR-1000, **0 media** |
| Super Garam Masala | `shopify_ZZ_7815685013617_44373236646001` | ₹380 | ACTIVE, 1kg, VM-GM-SUP-1000, **0 media** |

All via "Shopify App API", last updated 17 Sep. Fix = add a product image in Shopify; the
feed resyncs. MC also flags **returns policy not configured**.

---

## 5. GoKwik GA4 - answers

| Question | Answer | Evidence |
|---|---|---|
| Is `ga4Gokwik` obsolete? | **Effectively yes.** It sets `window.gaTag`, which none of the 3 loaded GoKwik bundles read. | 0 references in `merchant.integration.js`, `gokwik-sdk.min.js`, `gokwik.js` |
| How is GA4 configured now? | Via `ga4Id` in the event payload posted by GoKwik's checkout iframe - i.e. **GoKwik's server-side merchant config** (their dashboard / support). GoKwik calls the page's existing `window.gtag`; it never loads gtag.js. | `send_to: e.ga4Id` in every GA4 call |
| Is GA4 Purchase emitted? | **Yes, when enabled.** Currently **not enabled** - GA4 has 0 `purchase`/`add_payment_info`. | `"purchase"===e?Fr(t)` in the `gaNew` dispatcher |
| Can Purchase be disabled while keeping begin_checkout / add_shipping_info / add_payment_info? | **Not client-side.** The storefront code emits whatever the checkout iframe sends; no filter exists. Only GoKwik can say whether their config allows per-event selection. | Dispatcher has no event allow/deny list |
| What transaction_id? | **`e.orderName`** (GoKwik's name for the Shopify order). Exact format (e.g. `#1013` vs `1013`) unverified without an order. | `Fr`: `transaction_id: e.orderName` |

**Revised view:** since Shopify's GA4 `purchase` never fires for GoKwik orders, you now
**want** GoKwik's purchase - the duplication concern from Round 2c no longer applies to
`purchase`. Remaining overlap risk is small: native-checkout sessions already send
`begin_checkout`/`add_shipping_info` from Shopify, but those are different sessions.

---

## 6. Revised priority order

| # | Action | Where | Why |
|---|---|---|---|
| 1 | **Ask GoKwik to enable their GA4 bridge with `G-H88KFX0B26`**, and confirm the `orderName` format | GoKwik support | GA4 has 0 purchases vs 10 paid orders - biggest measurement hole |
| 2 | **Verify Meta Purchase double-counting** in Ads Manager, then ask GoKwik to use the order name (or Shopify's ID) as Meta `eventID` for Purchase | Ads Manager + GoKwik | Live campaign optimises on this event |
| 3 | After #1 is proven on a real order: **import GA4 `purchase` as Primary**; demote the misconfigured Website Purchase, Shopping Cart and Begin checkout actions to Secondary | Google Ads 159-566-7643 | GA4 link already exists |
| 4 | **Add images to the 4 products**; configure returns policy | Shopify / MC | Mandatory attribute |
| 5 | Investigate why sessions still reach **Shopify native checkout** (43 abandoned) | Theme / GoKwik | Possible conversion leak |
| 6 | Report server-side ViewContent missing `fbp` | Shopify support | Only lever on ViewContent EMQ |

**Withdrawn:** "repair the PDP browser beacon" (it isn't broken), and the Round 2c warning
that GoKwik's GA4 purchase would duplicate Shopify's (Shopify's never fires).

# Vishesh Masala - Tracking Audit (Round 2, read-only)

Live `https://visheshmasala.com` · MAIN = `visheshmasala/shopify-main` (#145579507825, `/t/2`)

**Read-only. Nothing was changed** - no theme code, pixels, Customer Events,
GoKwik, GA4, Google Ads, Merchant Center, GTM or app settings. No order placed.

---

## What is installed

Read from Shopify's `webPixelsConfigList` on the live storefront:

| Pixel | Type | Configuration |
|---|---|---|
| `2426208369` | APP | Meta pixel **`1617160383302964`** (`facebook_pixel`) |
| `2411790449` | APP | Google tags **`G-H88KFX0B26`**, **`GT-PL9FKWFP`**, 11 `gtag_events` |
| `shopify-app-pixel` | APP | Shopify's own |
| `shopify-custom-pixel` | CUSTOM | 840 B sandbox, subscribes `all_standard_events`, references no tracking globals and calls no third-party host - effectively inert |

GoKwik additionally carries the **same** Meta pixel ID in `window.merchantInfo.fbpixel`
(`1617160383302964`) and fires its own Meta events from the theme.

---

## Event matrix

Measured on production via Resource Timing plus wrappers on `fbq`,
`navigator.sendBeacon`, `fetch`, `XMLHttpRequest`, `new Image()` and
`dataLayer.push`.

| Action | Shopify event | Meta browser | Meta server | GA4 | Google Ads | eventID / dedup | Result |
|---|---|---|---|---|---|---|---|
| **Home page view** | yes (monorail) | **`PageView` beacon x1** | not observable | `page_view` x1 (`G-H88KFX0B26`) | none | `sh-d4400189-…` | **PASS** |
| **Search** (`?q=masala`) | yes | **`PageView` + `Search` x1 each**, `search_string=masala` | not observable | `view_search_results` x1 | none | `sh-d440a955…`, `sh-d440a96a…` | **PASS** |
| **Product page view** | yes (monorail x29) | **NONE - 0 beacons** | not observable | 1 collect (batched POST) | none | n/a - nothing sent | **FAIL** |
| **Add to Cart** | yes | `fbq('trackShopify',…,'AddToCart',…)` **called**, **no beacon** | not observable | `add_to_cart` x1 | none | `sh-d43fc05c-…` | **PARTIAL** |
| **Buy It Now** (GoKwik) | yes | `AddToCart` (Shopify) + `InitiateCheckout` (GoKwik) **called**, **no beacon** | not observable | `add_to_cart` x1 | none | `sh-…` / **`Gokwik_0.198…`** | **PARTIAL** |
| **Cart checkout** (GoKwik) | minimal (monorail x1) | `fbq('track','InitiateCheckout')` **called**, **no beacon** | not observable | **none** | none | **`Gokwik_0.036…`** | **FAIL (GA4)** |
| **Purchase** | not reachable without an order | configured | configured | configured (`purchase` -> `G-H88KFX0B26`, `MC-2851JXQ94Q`) | **not configured** | n/a | **CONFIG ONLY** |

Payload quality where events do fire is **correct**: `content_ids [7815683670129]`,
`product_variant_ids [44373150793841]`, `item_price 50`, `quantity 1`,
`currency INR`, `value 50`, `content_name "Kitchen King Masala - 50g Box"`.

---

## Confirmed findings

### 1. Meta browser pixel sends nothing on product pages (CONFIRMED, reproducible)

Home and Search both emit `www.facebook.com/tr` beacons. **Product pages emit
none** - no `PageView`, no `ViewContent`, no `AddToCart`. Reproduced on two
different products (`kitchen-king-masala`, `chat-masala`), 10s settle each.

`connect.facebook.net/fbevents.js` and `signals/config/1617160383302964` both
load on the PDP, `fbq` is defined, and the pixel registers
(`pixelsByID: ["1617160383302964"]`). `fbq` **is called** with a fully-formed
AddToCart payload and a valid `eventID`. No corresponding request was observed
through Resource Timing, `sendBeacon`, `fetch`, `XHR` or `new Image()`.

So the event is **generated but not transmitted** browser-side on PDPs.

**Mechanism not established.** One observation worth passing to Meta/Shopify
support: immediately before each `trackShopify` call the pixel runs
`fbq('gateCheck','shopify_sandbox',…)` and sets
`shopifySandboxContext` with `runtimeContext: "OPEN"`. A sandbox/open-runtime
mismatch is a plausible cause but I did not prove it and am not asserting it.

### 2. GoKwik and Shopify use incompatible event IDs (CONFIRMED)

- Shopify's pixel: `eventID: "sh-d43fc05c-4248-45A9-56E4-81D9E24840AB"`
- GoKwik's pixel call: `eventID: "Gokwik_0.036102300554206934"` (a `Math.random()` value)

Meta deduplicates browser and server events by matching `event_name` +
`eventID`. If Shopify's CAPI also sends `InitiateCheckout`, GoKwik's browser
event **cannot dedupe against it**, so InitiateCheckout is liable to be
double-counted once the browser transport is working again.

### 3. GA4 `begin_checkout` never fires (CONFIRMED)

`begin_checkout` **is** configured in the Google app pixel, but GoKwik
intercepts both checkout entry points, Shopify's checkout is never reached, and
Shopify's checkout events therefore never fire. Measured: **0 GA4 requests** on
a cart-checkout click. GoKwik does not bridge `begin_checkout` to GA4 - it only
bridges Meta `InitiateCheckout`.

### 4. Buy It Now inflates AddToCart (CONFIRMED)

GoKwik's Buy It Now adds the item to the cart before opening checkout, so a
single Buy-It-Now click fires **`AddToCart` (Meta) and `add_to_cart` (GA4)** in
addition to `InitiateCheckout`. AddToCart counts therefore include Buy-It-Now
clicks, which is not a bug but does distort funnel ratios.

### 5. No Google Ads conversion tracking (CONFIRMED)

All 11 `gtag_events` target `G-H88KFX0B26` (GA4) and `MC-2851JXQ94Q`
(Merchant Center). **No `AW-` conversion ID or label anywhere**, and no request
to `googleadservices.com`, `googleads.g.doubleclick.net` or `google.com/pagead`
was seen on any page. Google Ads conversions are not being tracked.

---

## Cleared - investigated and NOT issues

### The three Google identifiers are one coherent setup, not duplication

| ID | What it is | Evidence |
|---|---|---|
| `G-H88KFX0B26` | GA4 measurement ID | `gtag/js?id=G-H88KFX0B26`, all `/g/collect` hits use `tid=G-H88KFX0B26` |
| `GT-PL9FKWFP` | Google Tag container | `gtag/js?id=GT-PL9FKWFP`; a `config` entry in `dataLayer` |
| `MC-2851JXQ94Q` | Merchant Center | `action_label` on `view_item`, `purchase`, `page_view`; fires `merchant-center-analytics.goog` |

All three are declared in the **single** Google & YouTube app pixel
(`2411790449`). `gtag/js` loading twice for `GT-PL9FKWFP` is that tag's normal
bootstrap, not a second install.

**No duplicate events were observed.** One customer action produced exactly one
of each: `page_view` x1 on home, `view_search_results` x1 on search,
`add_to_cart` x1 on both Add to Cart and Buy It Now, `PageView` x1 on home.

### Round 1's "zero Meta AddToCart" was partly my error

Round 1 concluded Meta AddToCart did not fire. That was measured with a
`new Image()` hook that missed the real transport, so the conclusion was drawn
on bad instrumentation. Re-measured properly here: **`fbq` is called correctly
with a full AddToCart payload and a valid `eventID`.**

The underlying problem is real but different and narrower than Round 1 stated:
the call is made, the **network beacon is what is missing, and only on product
pages**.

---

## GoKwik tracking behaviour

- GoKwik fires its own Meta `InitiateCheckout` via `fbq('track', …)` - not
  Shopify's `trackShopify` - with correct value, currency, content_ids,
  variant and quantity.
- GoKwik sends its own analytics to `gkx.gokwik.co/gke/api/v1/events`
  (~14-20 calls per checkout open) and health-checks `api-gw.gokwik.io`.
- GoKwik **does not** bridge anything to GA4.
- GoKwik carries `ga4Gokwik`, `fbpixel` and `snapPixel` settings; only
  `fbpixel` (`1617160383302964`) is populated - `ga4Gokwik` is empty, which is
  consistent with GA4 receiving nothing from GoKwik.
- **Shopify's native checkout events do not fire while GoKwik intercepts**,
  because the browser never reaches `/checkouts/…`. Confirmed: the click stays
  on `/cart`, no navigation occurs.

**Purchase is unverified.** Whether `purchase` fires depends on whether GoKwik
returns the buyer to Shopify's order-status page after payment. That cannot be
determined without placing a real order, and I did not place one.

---

## Consent

`Shopify.customerPrivacy` is **not present** and there are no consent cookies,
so no consent banner or gating is configured. Consent is therefore **not** the
cause of the missing Meta beacons.

---

## Recommended fix order

1. **Verify in Meta Events Manager first.** Check whether `ViewContent` and
   `AddToCart` are arriving **server-side (CAPI)** despite the missing browser
   beacons. `eventID`s are present, which is how Shopify's CAPI dedupes, so
   coverage may be better than the browser evidence suggests. This determines
   whether finding 1 is "degraded match quality" or "missing conversions", and
   it changes the priority of everything below.
2. **Fix the product-page Meta transport** (finding 1). Highest commercial
   impact if CAPI is *not* covering it - ViewContent and AddToCart are the two
   events Meta retargeting depends on most.
3. **Align GoKwik's Meta eventID with Shopify's** (finding 2) - ask GoKwik to
   emit Shopify's `sh-` event ID, or to stop emitting `InitiateCheckout`
   browser-side if Shopify's CAPI already covers it. Do this **before** fixing
   finding 1, or InitiateCheckout will start double-counting.
4. **Decide on GA4 `begin_checkout`** (finding 3) - either have GoKwik bridge
   it or accept the funnel gap, but it should be a deliberate decision.
5. **Add Google Ads conversion tracking** (finding 5) if Ads is being spent on.
6. **Confirm `purchase`** end-to-end on the next genuine order.

---

## Proposed changes

**None at this stage.** Findings 1 and 3 are app/vendor configuration rather
than theme code, and finding 2 needs GoKwik's input. Nothing here is fixable by
editing the theme, and changing pixels before checking Events Manager risks
creating the duplication described in finding 2.

I recommend step 1 above before any change is authorised.

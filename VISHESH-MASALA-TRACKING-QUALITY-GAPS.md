# Vishesh Masala - Tracking Quality Gap Analysis (Round 2c)

Read-only. **Nothing was changed.** No order placed, no conversion action created, no
pixel/app/theme setting modified. One item was added to a cart in an isolated browser
session to observe GA4 event emission; no checkout was started.

Pixel/dataset **1617160383302964** · Ad account `1083211067427220` · GA4 `G-H88KFX0B26`
Merchant Center `5850243893` / `MC-2851JXQ94Q` · GoKwik MID `19w0ssjui6cg`

---

## 1. Exact EMQ deficiencies

Read from each event's **Event match quality -> Shared parameters** panel in Events Manager.
A dash means Meta lists the parameter **not at all** for that event.

| Customer parameter | ViewContent **4.4** | AddToCart **6.1** | InitiateCheckout **6.2** | Purchase **8.0** |
|---|---|---|---|---|
| IP Address | 100% | 100% | 100% | 100% |
| User Agent | 100% | 100% | 100% | 100% |
| External ID | 100% | - | - | 100% |
| **Browser ID (`fbp`)** | **- MISSING** | 100% | 100% | 100% |
| Country | - | - | 36.36% | 100% |
| State | - | - | 18.18% | 100% |
| Email (hashed) | - | - | - | 100% |
| Phone (hashed) | - | - | - | 100% |
| First / Last name | - | - | - | 100% |
| ZIP code | - | - | - | 100% |
| City | - | - | - | 100% |
| Click ID (`fbc`) | - | - | - | - |

### What is actually responsible for the 4.4/10

**One legitimate deficiency: `fbp` is missing on ViewContent, and only on ViewContent.**
Every other funnel event sends it at 100%. The `_fbp` cookie demonstrably exists on the
storefront (`fb.1.1790259532687.748274758264778806` on a live PDP), so this is real data
that exists and is not being attached.

**Everything else missing from ViewContent is missing legitimately and must not be "fixed".**
A PDP visitor is anonymous - verified live: no customer ID, `ShopifyAnalytics` customer
`none`. Email, phone, name, city, state and ZIP **do not exist** at product-view time. They
appear at Purchase because checkout collects them, which is exactly why Purchase scores 8.0.
Sending them at ViewContent is not possible and not supported.

`fbc` is absent everywhere because it derives from an `fbclid` on an ad click; my test visits
were organic. This is expected, not a defect. It will populate on real ad traffic.

**Realistic ceiling:** ViewContent cannot reach 8.0. With `fbp` added it should land near
**6.1** - the score AddToCart achieves on the identical anonymous parameter set
(IP + UA + fbp). Treat ~6.1 as success, not 8.0.

### Deduplication (read from Event deduplication per event)

| Event | Dedupe key | Browser | Server | Total coverage |
|---|---|---|---|---|
| PageView | Event ID | 22 (96.19%) | 25 (100%) | **91.08%** |
| ViewContent | Event ID | 4 (100%) | 6 (100%) | **100%** |
| AddToCart | - | - | - | *"Still Parsing Your Data"* |
| InitiateCheckout | - | - | - | *"Still Parsing Your Data"* |
| Purchase | - | - | - | *"Still Parsing Your Data"* |

Both resolved events are **"Connected with Shopify"** and sit far above Meta's recommended
75% threshold.

**The "Still Parsing" message is not evidence of a GoKwik problem.** AddToCart shows the same
message, and AddToCart is pure Shopify with matching `sh-` IDs on both sides - GoKwik is not
involved in it at all. The pattern tracks event volume (3K and 1.9K resolved; 383, 200 and 20
did not), not integration health.

---

## 2. Is PDP browser repair worth doing?

**Yes - but as a matching improvement, not a conversion recovery.**

The case for it is that the two findings line up: ViewContent is the **only** funnel event
missing `fbp`, and it is also the **only** event whose browser beacon fails on the PDP
(browser 624 vs server 1,259 - server carries 2.0x the browser). `fbp` is a first-party
browser cookie surfaced by the browser pixel, so the event whose browser half is failing is
precisely the event missing the browser-derived identifier.

The case for *not* panicking: the server event already carries **External ID + IP + User
Agent at 100%**, CAPI delivers 2x the browser volume, and Meta credits it with
**+48.2% additional ViewContent conversions vs pixel alone**. Nothing is being lost.

Expected gain: ViewContent EMQ **4.4 -> ~6.1**, plus better retargeting-audience quality
(`fbp` is the primary web audience key). That is worth doing, and it is the single highest-
value item on this list.

I have not proven the causal link - it is a strong inference from the two facts above. The
verification is cheap: repair the beacon, re-read the ViewContent parameter panel, confirm
`fbp` appears.

---

## 3. Exact GoKwik GA4 event list

Read from GoKwik's production bundle `https://pdp.gokwik.co/build/gokwik.js` (254 KB,
last modified 21 Sep 2026), dispatch table under `analyticsName === "gaNew"`:

| GA4 event | Emitted by GoKwik? |
|---|---|
| `page_view` | **No** |
| `view_item` | **No** |
| `add_to_cart` | **No** |
| `begin_checkout` | **Yes** (also emits custom `gokwik_checkout_initiated`) |
| `add_shipping_info` | **Yes** |
| `add_payment_info` | **Yes** |
| `purchase` | **Yes** |
| `coupon_list_viewed`, `coupon_applied_success`, `coupon_applied_failed`, `*_gk` | Yes (custom) |

Every call is `window.gtag("event", <name>, { send_to: e.ga4Id, ... })`.

**Two implementation facts that change the recommendation:**

1. **GoKwik never loads `gtag.js`** (zero references to `googletagmanager.com/gtag/js` as a
   loader; the only occurrence is in a *detection* list alongside Klaviyo/Contlo, and that
   list is gated to 12 merchant IDs which **do not include ours**, `19w0ssjui6cg`). It calls
   `window.gtag` and logs *"gtag is not defined. Make sure GA script is loaded."* on failure.
   This is fine here - verified live that `window.gtag` **is** a function in the storefront
   main window, with `gtag/js?id=G-H88KFX0B26` and `?id=GT-PL9FKWFP` loaded.

2. **`window.gaTag` is read by none of GoKwik's three loaded bundles.** The theme sets it at
   `snippets/gokwik.liquid:36`, and it is present live as `{"ga4":""}` - but `merchant.integration.js`,
   `gokwik-sdk.min.js` and `gokwik.js` contain **zero** references to `gaTag`. The measurement
   ID used is `e.ga4Id`, which arrives in the postMessage payload from GoKwik's checkout
   iframe - i.e. from **GoKwik's own server-side merchant config**.

   **This corrects my previous recommendation.** Setting `ga4Gokwik` in the theme editor is
   unlikely to do anything on the current bundle version. The GA4 ID almost certainly has to
   be set by GoKwik in their merchant dashboard. Confirm with GoKwik before touching the
   theme field.

---

## 4. Duplication risk assessment

Shopify's GA4 events, **verified live on a PDP** (main-window `dataLayer`, not sandboxed - so
GoKwik and Shopify share the same `gtag`):

| Shopify event | send_to | event_id |
|---|---|---|
| `page_view` | G-H88KFX0B26, MC-2851JXQ94Q | `sh-d455ee38-…` |
| `view_item` | G-H88KFX0B26, MC-2851JXQ94Q | `sh-d455ee4e-…` |
| `add_to_cart` | G-H88KFX0B26 | `sh-d4645ab2-…` |

Cross-referenced against GoKwik's list:

| GA4 event | Shopify | GoKwik | Verdict |
|---|---|---|---|
| `page_view` | Yes | No | No overlap |
| `view_item` | Yes | No | No overlap |
| `add_to_cart` | Yes | No | No overlap |
| `begin_checkout` | **Unlikely** (GoKwik intercepts checkout, so Shopify's `checkout_started` never fires) | Yes | **Gap being filled - the actual benefit** |
| `add_shipping_info` | Unlikely, same reason | Yes | Gap being filled |
| `add_payment_info` | Unlikely, same reason | Yes | Gap being filled |
| `purchase` | **Very likely** | Yes | **HIGH RISK - the one real hazard** |

**The risk is concentrated entirely in `purchase`.** Shopify's browser-side Purchase demonstrably
fires (Meta shows 9 browser Purchase events), which means the web-pixel runtime does execute
after a GoKwik order - so Shopify's GA4 `purchase` almost certainly fires too. Adding GoKwik's
`purchase` to the same property would book revenue twice. GA4 does not reliably deduplicate
`purchase` by `transaction_id` the way Meta deduplicates by `event_id`, and GoKwik's
`transaction_id` may not match Shopify's order number.

**And GoKwik's GA4 config is all-or-nothing** - a single `ga4Id` feeds every event it emits.
There is no exposed way to take `begin_checkout` while suppressing `purchase`.

So the honest position: the prize (`begin_checkout`, a genuine blind spot) and the hazard
(`purchase`, double-counted revenue) come as a package. **Do not populate the GoKwik GA4 ID
until GoKwik confirms in writing whether its `purchase` can be suppressed, and what
`transaction_id` it sends.** Inflated GA4 revenue is worse than a missing funnel step.

---

## 5. Google Ads setup recommendation

Current state, read from **Google & YouTube -> Settings**:

- Google Account: `axit@nerdshouse.com`
- Connected services (2): **Google Merchant Center** `5850243893`, **Google Analytics**
  `G-H88KFX0B26 (Vishesh Masala)`
- **Google Business Profile**: not connected
- **Google Ads: not connected.** It appears only under *Impactful opportunities* on the
  Overview tab, as a Performance Max pitch. Confirms the earlier finding that no `AW-` tag
  exists anywhere on the storefront.
- Merchant Center: 120 products - 116 approved, **4 not approved**, 0 limited.

**Recommendation: import the GA4 `purchase` conversion into Google Ads. Do not add a second tag.**

Rationale: GA4 `G-H88KFX0B26` already receives `purchase` from Shopify with a `sh-` event ID,
and the gtag is already on the page. Importing avoids a third measurement path through a
checkout that GoKwik already complicates, and avoids an `AW-` tag that would need to fire on a
GoKwik-controlled page.

Supported sequence (not executed):
1. In **GA4 Admin -> Product links -> Google Ads links**, link the existing Google Ads account.
2. In **Google Ads -> Goals -> Conversions -> New -> Import -> GA4**, import `purchase`.
3. Mark it **Primary**; leave every other imported action Secondary.

Connecting Google Ads *through the Shopify app* instead is also supported and is the better
choice if you want Performance Max with the Merchant Center feed - but it adds an `AW-` tag
and a second conversion path, so it should not be done at the same time as step 2 or the same
purchase will be counted by both.

Fix the 4 unapproved Merchant Center products before running any Shopping/PMax spend.

---

## 6. Dataset category - practical effect

**Downgraded to housekeeping, as suspected.**

Meta's own wording: *"We may use the data source's category to determine the type of
information you can share through Meta Business Tools"* - it exists to gate **restricted
verticals** (health, finance, and similar) out of sharing sensitive data. It is not an input
to delivery, optimisation, attribution or match quality.

For a packaged-spice retailer no restricted category applies, nothing is currently being
blocked (parameter blocking and event blocking both show no active restrictions, and all
seven events are Active), and leaving it `None` has **no measurable effect on this store**.

Set it when convenient. It does not belong on the priority list, and my previous report was
wrong to rank it "High".

---

## 7. Revised priority order

| # | Item | Why | Effort |
|---|---|---|---|
| 1 | **Repair the PDP browser beacon** to attach `fbp` to ViewContent | Only legitimate EMQ deficiency; 4.4 -> ~6.1; improves retargeting audiences | Theme/pixel diagnosis |
| 2 | **Ask GoKwik two questions**: (a) can `purchase` be suppressed from its GA4 bridge, and what `transaction_id` does it send? (b) is `ga4Gokwik` still wired, or must the GA4 ID be set in your dashboard? | Blocks items 3 and 4 | One email |
| 3 | **Link GA4 to Google Ads and import `purchase` as Primary** | No conversion tracking exists today | Admin only |
| 4 | **GoKwik GA4 ID** - only after #2 clears both risks | Recovers `begin_checkout` | Vendor-side |
| 5 | Fix 4 unapproved Merchant Center products | Before any Shopping/PMax spend | Admin |
| 6 | Ask GoKwik to emit Shopify's `sh-` ID for InitiateCheckout | Tidy-up; no evidence of live harm | Vendor-side |
| 7 | Set the dataset category | Housekeeping, no measurable effect | One click |

**Explicitly not recommended:** adding email/phone/name/address to ViewContent (the data does
not exist for anonymous visitors), clearing GoKwik's `fbpixel`, and chasing `fbc` coverage.

# Vishesh Masala - GoKwik GA4 Configuration Verification

Checked **24 Sep 2026, 22:45-23:20 IST**. All times IST. Read-only: nothing changed, no order
placed. Two test sessions (PDP view -> 1 Add to Cart -> open GoKwik checkout, stopped at the
phone-number screen) were run in an isolated browser; no personal data was entered.

GA4 property "Vishesh Masala", `G-H88KFX0B26`, reporting time zone **India (GMT+05:30)**, INR.

## Result: FAIL (not yet verified) - GoKwik checkout events are not reaching GA4

| Check | Result | Evidence |
|---|---|---|
| GoKwik settings saved | **Cannot confirm directly** (no GoKwik dashboard access) | Indirect: GoKwik's checkout now configures Google Ads `AW-18429667990` - new since Round 2 - so GoKwik config did change today. No sign of GA4 in its client payloads. |
| `begin_checkout` reaches GA4 | **FAIL / not observed** | Not sent from the browser (2 runs, ~23:00 and 23:16 IST). Not in Realtime. Not in today's Events report. |
| `add_shipping_info` | **Pending** | Needs a phone number + address - not entered. 0 in GA4 today. |
| `add_payment_info` | **Pending** | Same. 0 in GA4 today. |
| `purchase` | **Pending** | Waiting for the next genuine order. 0 in GA4 today. |
| No duplicate `page_view` / `view_item` / `add_to_cart` (browser) | **PASS** | Exactly 1 each per action, all Shopify (`sh-` IDs). GoKwik sends none of these. |
| No duplicate (server-side) | **Not yet verifiable** | Needs processed data; recheck tomorrow. |
| Client-side vs server-side | **Client-side: none. Server-side: not observed.** | GoKwik posted no `gaNew` (GA4) message in either run. |
| Parameters (`transaction_id`, value, currency, items) | **N/A** - no GoKwik GA4 event received | Code: `transaction_id = orderName`, currency `INR` hardcoded |
| Shopify GA4 unchanged | **PASS** | `config` G-H88KFX0B26 + GT-PL9FKWFP; `page_view`, `view_item` -> G-H88KFX0B26 + MC-2851JXQ94Q; `add_to_cart` -> G-H88KFX0B26; `sh-` event IDs |

## What GoKwik's checkout now sends (captured, 23:16:58 IST)

On opening checkout, GoKwik's iframe (`pdp.gokwik.co/index.html`) posted exactly three messages:

| analyticsName | eventName | Effect |
|---|---|---|
| `shopifyAnalytics` | `checkoutStarted` | internal |
| `google_ads_gk` | `begin_checkout` | **loads `gtag/js`, runs `gtag("config","AW-18429667990")`** -> remarketing + `page_view` hits to Google Ads (`viewthroughconversion/1842966799`, `rmkt/collect/18429667990`, `ccm/collect`, `1p-user-list`). **No conversion fired** - no begin_checkout label configured. |
| `facebook` | `trackEvents` | Meta InitiateCheckout (unchanged) |

**No `gaNew` message** - GoKwik's client-side GA4 bridge is not active. If GA4 is configured
server-side only (Measurement Protocol), its events would never appear in the browser, so
the only proof is in GA4 itself - and none has appeared.

GoKwik's storefront code is **unchanged**: `gokwik.js` was redeployed 24 Sep 20:48 IST but is
byte-identical (MD5 `09e74bfb…`) to the copy analysed earlier.

## Limits of this check
- GA4 **Realtime did not register this test browser at all** (my 23:16 IST hits never
  appeared; the only Realtime user was active 22:49-22:53 IST). So a server-side
  `begin_checkout` tied to my test session can't be ruled out from Realtime alone.
- Today's processed report is still partial. Recheck **25 Sep** for 24 Sep data.

## New Google Ads observation (not touched)
`AW-18429667990` now loads on every GoKwik checkout open. Today it only sends remarketing and
page_view signals. If a **purchase label** is also set in GoKwik, GoKwik will fire Google Ads
purchase conversions directly - and importing GA4 `purchase` later would then count every
purchase twice. Decide on one Google Ads purchase path before importing.

## How to close this out
1. Ask GoKwik: is GA4 server-side live for mid `19w0ssjui6cg`, which events does it send, and
   at which step (checkout open, or only after phone verification)?
2. From a normal phone browser: open visheshmasala.com -> add to cart -> open checkout ->
   enter your own phone/address, with GA4 Realtime open. `begin_checkout` /
   `add_shipping_info` should appear within a minute.
3. After the next genuine order, check GA4 for one `purchase` with `transaction_id` = the
   Shopify order name, correct value, INR and items - and no second copy.

---

# Addendum - GoKwik Google Ads configuration (24 Sep 2026, 23:25 IST, read-only)

Captured from GoKwik's own `google_ads_gk` message when checkout opens (real click on the
visible Checkout button in the open cart drawer, 23:24:59 IST):

```
configObject: [{ adwordId: "AW-18429667990", purchase: ["18429667990"] }]
google_ads_enhanced_tracking: true
google_ads_send_basket_data: true
```

Google Ads 159-566-7643 -> Goals -> Purchase -> Tag setup -> "Use Google Tag Manager":
**Conversion ID `18429667990`, Conversion label `sRfBCKHYvfYcEJbV-dNE`** (Primary, Website,
Count: Every conversion, Last click, enhanced conversions not configured).

| Question | Answer |
|---|---|
| Conversion actions / labels in GoKwik | One entry: `AW-18429667990`, purchase label **`18429667990`** |
| Purchase configured? | **Yes - but with the wrong label.** GoKwik would send `send_to: AW-18429667990/18429667990`; the real Purchase action is `AW-18429667990/sRfBCKHYvfYcEJbV-dNE`. The numeric conversion ID was entered where the label belongs, so **GoKwik's purchases will not count as the Purchase conversion.** |
| Begin Checkout configured? | **No** (no `begin_checkout` key). Checkout-open only runs `gtag("config","AW-18429667990")` - remarketing + page_view, no conversion. |
| Browser, server or both? | **Browser-side only** - `window.gtag` in the storefront window. Google Ads has only Website-source actions (no Import/API), so there is no server-side Google Ads path. |
| Purchase sends order ID? | **Yes** - `gtag("event","purchase",{send_to, value: totalValue, currency:"INR", transaction_id: orderName, items, discount})`; items because basket data is on; enhanced conversions set `user_data` from the address. |
| Can Google Ads deduplicate? | **Within one conversion action, yes** - same `transaction_id` is counted once. **Across two actions, no** - a GoKwik direct Purchase and an imported GA4 purchase are two different actions and would both count if both are Primary. |

**Implication:** today GoKwik's direct Google Ads purchase is effectively broken (wrong
label), so Google Ads would record 0 purchases from it. Choose ONE route before fixing:
- fix GoKwik's purchase label to `sRfBCKHYvfYcEJbV-dNE` (direct, browser-side), **or**
- import GA4 `purchase` once GA4 purchase is proven - and then remove/blank the GoKwik label
  or set the Website Purchase action to Secondary.

## Correction during this check
At 23:23 IST two programmatic clicks landed on Shopify native checkout
(`/checkouts/cn/<token>/en-in`). Both clicked the Checkout button **while the cart drawer was
closed** (a hidden button a shopper can't click). With the drawer open and a real mouse click,
GoKwik intercepted correctly. So this was a test artefact, **not** a reproduction of the
native-checkout leak; that leak remains unexplained. These two test visits may appear as
abandoned native checkouts at ~23:23-23:24 IST on 24 Sep.

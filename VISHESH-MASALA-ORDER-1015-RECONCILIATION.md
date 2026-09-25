# Order #1015 - Purchase Attribution Reconciliation

Checked 24 Sep 2026, 23:43 IST -> 25 Sep 2026, 00:06 IST. All times IST. Read-only:
nothing changed, no order placed.

## Shopify (ground truth)
- **#1015**, created **24 Sep 2026, 23:40:22 IST** by the GoKwik app (`sourceName 420110368769`)
- **₹629.00 INR** = ₹480 subtotal + ₹149 shipping, ₹0 discount
- **2 items:** Tandoori Chicken Masala (VM-PBS-TAN-100) ₹110 x1; No.300 Compound Hing Powder
  (VM-HING-300-500) ₹370 x1
- Tags `COD, GoKwik`; financial status **PENDING** (cash on delivery, no transactions yet) -
  valid order, not yet paid
- iPhone Safari (iOS 18.7); `utm_source=direct`; `gokwik_cid b07793e2-…`

## GA4 G-H88KFX0B26 - Realtime (23:43-23:52 IST)
| Item | Result |
|---|---|
| `purchase` arrived | **Yes** - Key events: purchase = 1; Purchasers = 1 |
| `transaction_id` | **`#1015`** (event count 1) - equals the Shopify order name incl. `#` |
| `value` | **629** |
| `currency` | **INR** |
| `payment_type` | `cod` |
| Other params | coupon, discount, shipping, shipping_name, tax, page_location, page_referrer, page_title, ga_session_id, ga_session_number, ignore_referrer, batch_ordering_id, batch_page_id (17 total) |
| Client or server | **Client-side (browser gtag).** `batch_ordering_id` / `batch_page_id` only exist on gtag.js hits, and `page_location` = `https://visheshmasala.com/collections/premium-blended-spices` - the storefront page hosting the GoKwik modal |
| Exactly once | **Yes in Realtime** (1 purchase, transaction_id #1015 count 1). Recheck in processed reports. |
| Items | **Pending** - item-scoped, not shown in Realtime |
| Exact timestamp | Not exposed in Realtime; within the 23:14-23:44 IST window; order created 23:40:22 IST |

Funnel events in the same 30-min window: `begin_checkout` 3, `gokwik_checkout_initiated` 3,
`add_shipping_info` **1**, `add_payment_info` **1**, `mobile_number_entered_gk` 1,
`otp_sent_gk` 1, `otp_entered_gk` 1, `otp_verified_gk` 1. The single full funnel matches
#1015; the extra `begin_checkout`s likely include my two test checkout-opens (23:34, 23:37 IST).

**GoKwik's GA4 integration is now live** - first time GA4 has ever received `purchase`,
`add_payment_info` and GoKwik's OTP-step events.

## Google Ads AW-18429667990
GoKwik's live config, captured at 23:34:23, 23:37:24, 23:52:40 (24 Sep) and **00:05:43 IST
(25 Sep, fresh browser session)**:
```
configObject: [{ adwordId: "AW-18429667990", purchase: ["18429667990"] }]
```
**The label fix has not propagated.** #1015 (23:40:22 IST) was therefore sent to
`AW-18429667990/18429667990`, which matches no conversion action. Expected result: Google Ads
records **0** Purchases for #1015. GoKwik would send `transaction_id: orderName` = `#1015`,
value 629, INR, items.
Verification in the Google Ads UI is **pending**: Chrome extension disconnected, and Google Ads
conversion data typically lags ~3 hours. There is only one Purchase action (label
`sRfBCKHYvfYcEJbV-dNE`), so no "old" action can double-count.

## Meta dataset 1617160383302964
- Events Manager -> Purchase -> Sampled activities: **empty for the last 24 h**, and Meta
  states parameters/URLs are shown as `_removed_`. Individual event IDs are not visible.
- From code: GoKwik's browser Purchase uses `eventID = "Gokwik_" + random`; Shopify CAPI uses
  Shopify's own ID. They cannot match. Purchase dedup was "Still Parsing" on 24 Sep.
- **Not verifiable from here:** browser/server event IDs for #1015 and whether Meta
  deduplicated them. Ads Manager not checked (Chrome disconnected). #1015 came in as
  `utm_source=direct`, so an ad-click attribution is unlikely either way.

## Order identifier
GoKwik uses the **Shopify order name, `#1015` (with `#`)**, as `transaction_id` - confirmed
live in GA4. The same `orderName` feeds its Google Ads `transaction_id`.

## Re-checks still needed
1. Reconnect Claude in Chrome.
2. After ~03:00 IST 25 Sep: Google Ads Purchase conversions for 24 Sep (expect 0).
3. After GA4 processing (typically by the morning of 25 Sep): purchase for 24 Sep with
   Transaction ID = #1015, exactly 1, and its 2 items.
4. Meta Events Manager Purchase counts for 24 Sep (browser vs server) and Ads Manager.
5. GoKwik: why the saved label isn't live (Live vs Test mode / save / field / propagation).

---

# Re-check - 25 Sep 2026, 00:30-00:45 IST (Chrome reconnected)

## GA4 (processed reports)
Events report, 28 Aug - 24 Sep: **no `purchase` row yet, total revenue ₹0.00.** Normal
processing lag - Realtime already showed purchase #1015 (value 629, INR, count 1). Items and
the exact timestamp still need the processed report (re-check later on 25 Sep).

## Google Ads 159-566-7643 - Purchase (ctId 7764667425), 18-24 Sep
Status **Misconfigured - "Conversions haven't been recorded within the past 7 days"**,
diagnostic **"Conversion has never received data"**. Consistent with GoKwik still sending the
wrong label (last confirmed 00:05:43 IST). Provisional until ~03:00 IST.
Side note: the action's default value is **US$1**, suggesting the Ads account currency is USD.

## Meta dataset 1617160383302964 - Purchase, browser vs server (6-hour buckets, IST)
| Bucket start | Orders inside | Browser | Server |
|---|---|---|---|
| 16 Sep 17:30 | #1004 | 1 | 0 |
| 17 Sep 05:30 | #1005, #1006, #1007 | 2 | 0 |
| 17 Sep 11:30 | #1008, #1009 | 1 | 0 |
| 18 Sep 11:30 | #1010 | 1 | 3 |
| 18 Sep 17:30 | #1011, #1012 | 2 | 4 |
| 20 Sep 17:30 | #1013 | 1 | 2 |
| 24 Sep 17:30 | #1014 (cancelled) | 1 | 2 |
| **24 Sep 23:30** | **#1015** | **1** | **2** |

- Purchase "Last received 51 minutes ago" at 00:32 IST = ~23:41 IST, i.e. #1015.
- **Since 18 Sep every order produces 1 browser + 2 server Purchase events.** Two server
  events for one unpaid COD order point to two server-side senders (e.g. Shopify's CAPI plus a
  GoKwik server-side feed) - sender identity and event IDs are not visible in Events Manager.
- Purchase deduplication: still **"Still Parsing Your Data"**.
- Ads Manager, 24 Sep: campaign "Vishesh Masala | Sales | India | 16 Sep 2026" - **Payment
  error, out of funds, not delivering**; Website Purchase result **"—"** (0 attributed).
- Note: the 28-day totals in Events Manager changed basis since 24 Sep (PageView 3K -> 505,
  Purchase 20 -> 6), so they are not comparable with earlier figures.

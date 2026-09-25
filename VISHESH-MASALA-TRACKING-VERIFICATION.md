# Vishesh Masala - Meta Server-Side Verification & Fix Proposals

Live `https://visheshmasala.com` · MAIN = `visheshmasala/shopify-main` (#145579507825, `/t/2`)
Pixel/dataset **1617160383302964** "nerdshouse <> vishesh masala" · Business `dhanhar vishesh`
(1210237132477945) · Ad account **1083211067427220** "Clueless Commerce <> Vishesh Masala"
Events Manager window: **Aug 27 - Sep 23, 2026**

**Read-only. Nothing changed.** No order placed. No pixel, event, conversion action,
app or theme setting was created or modified.

---

## Correction to the previous report

The earlier version of this file said server-side Meta was **unverifiable** and marked
every server column UNVERIFIED. That is now resolved - Events Manager was read directly.
Several earlier conclusions flip, and the corrections matter more than the confirmations:

| Earlier claim | Actual |
|---|---|
| "AddToCart appears to generate zero Meta requests" | Meta received **383** AddToCart events (151 browser + 232 server) |
| "PDP ViewContent - 0 beacons, possibly lost" | Meta received **1,883** ViewContent (624 browser + 1,259 server) |
| "Purchase unverified; GoKwik may break it" | Purchase **works** - 20 events, EMQ 8.0, driving a live campaign |
| "Consider clearing GoKwik `fbpixel` to stop duplicates" | **Withdrawn.** That would delete a working browser source |
| "Fix the GoKwik event ID before the transport, or double-counting starts" | Overstated. Meta reports **no duplicate-event diagnostic** |

The open question was whether the browser-beacon gap was a **data-quality** problem or a
**lost-conversions** problem. It is **data quality**. Nothing is being lost.

---

## 1. Meta Browser vs Server event matrix

Splits are `browserProcessedCount` / `serverProcessedCount` read from each event's expanded
row. In every case the two sum exactly to Meta's "Total events", confirming the read.

| Event | Browser | Server | Total | EMQ | Last received | Status |
|---|---|---|---|---|---|---|
| **PageView** | - | - | **3,000** | 6.1/10 *(update recommended)* | 51 min | Active |
| **View content** | **624** | **1,259** | **1,883** | **4.4/10** | 51 min | Active |
| **Add to cart** | **151** | **232** | **383** | 6.1/10 | 53 min | Active |
| **Initiate checkout** | **84** | **116** | **200** | 6.2/10 | 53 min | Active |
| **Add payment info** | - | - | **119** | 8.0/10 | 3 h | Active |
| **Purchase** | **9** | **11** | **20** | 8.0/10 | 4 h | Active, **1 ad set** |
| **Search** | - | - | **9** | 6.1/10 | 3 h | Active |

**Conversions API is live and healthy.** Settings confirms:
`Conversions API • Web-only · Business connected · Active · Last received 19 minutes ago`,
opted in 7 Sep 2026 by Axit Mehta at pixel creation. Not a direct integration and not a
partner integration - it is the Shopify/Meta business connection.

Server outruns browser on every event measured (ViewContent 2.0x, AddToCart 1.5x,
InitiateCheckout 1.4x). That is CAPI compensating for the browser beacons that fail on
product pages - the behaviour observed in Round 2 is real, but it is being absorbed.

Meta quantifies the benefit itself, on the View content row:
> **+48.2% additional conversions reported from the Conversions API (server) vs pixel alone.**

---

## 2. Deduplication findings

**Meta is not reporting a duplication problem.** The Actions tab lists exactly two items,
neither of which is a duplicate-event diagnostic:

1. *Connect to chat activity from business messaging apps* - a feature upsell, not a defect.
2. *You saw more reported conversions by using the Conversions API alongside the Meta Pixel* -
   the +48.2% ViewContent figure above. A positive finding.

The **₹8,903 "ad spend affected by low data quality"** is explained: the only ad set
optimising on Purchase is **"India | Broad | Website Purchases"**, spend **₹8,898.29**.
The flag is about **match quality**, not duplication.

**Still true, and still worth fixing:** GoKwik's browser InitiateCheckout uses a
`Math.random()` event ID (`Gokwik_0.036102300554206934`, regenerated per click) which can
never match Shopify's `sh-` prefixed ID. What has changed is the severity - with no
duplicate diagnostic and InitiateCheckout EMQ at a mid-range 6.2/10, this is a tidy-up, not
an emergency. I cannot *prove* browser and server InitiateCheckout are deduplicating; I can
say Meta is not complaining, and the earlier "fix this first or else" framing was wrong.

---

## 3. GoKwik Meta recommendation

**Change nothing. Specifically, do not clear `fbpixel`.**

GoKwik's settings expose exactly four Data Tracking fields:

| Setting | Label | Value |
|---|---|---|
| `ga4Gokwik` | Enter Google Analytics ID (GA4) | **empty** |
| `fbpixel` | FB Pixel | `1617160383302964` |
| `snapPixel` | Snapchat Pixel | empty |
| `gadsGokwik` | Google Ads Conversion ID (AW-…) | **empty** |

There is still no setting to suppress only GoKwik's browser-side Meta event. But the
evidence now says you do not want to: InitiateCheckout and Purchase are both arriving, and
blanking `fbpixel` would remove a live browser source to solve a problem Meta is not
reporting.

Optional, low priority: ask GoKwik to emit Shopify's `sh-` event ID for InitiateCheckout.
Worth raising, not worth blocking anything on.

---

## 4. GoKwik GA4 recommendation

Unchanged and still valid - this is the one genuine gap. `ga4Gokwik` is the vendor-supported
field: `snippets/gokwik.liquid` line 36 passes it straight to GoKwik's SDK as
`window.gaTag = { ga4: "{{ settings.ga4Gokwik }}" }`. It is empty, which is exactly why
GoKwik emits Meta events but nothing to GA4.

Setting it to `G-H88KFX0B26` is the supported way to restore `begin_checkout`.

**Caution before doing it:** confirm with GoKwik which events its GA4 bridge emits. Shopify's
Google pixel already sends `add_to_cart`; if GoKwik's SDK sends it to the same measurement
ID it will double, and GA4 has no `event_id` dedupe equivalent to Meta's.

---

## 5. Google Ads conversion recommendation

Unchanged. **No Google Ads conversion tracking exists.** All 11 `gtag_events` target only
`G-H88KFX0B26` (GA4) and `MC-2851JXQ94Q` (Merchant Center); no `AW-` anywhere, and no
request to `googleadservices.com` or `googleads.g.doubleclick.net` on any page.

Use **the Google & YouTube channel** (confirmed present as a Shopify publication), not
GoKwik's field. Concrete reason: `gadsGokwik` is declared in GoKwik's schema but is
**never read by `snippets/gokwik.liquid`** - the snippet only passes `ga4Gokwik`, `fbpixel`
and `snapPixel`. Setting it may do nothing on this snippet version.

The earlier worry that GoKwik's checkout interception would break Google Ads purchase
conversions is now much weaker: Meta's server-side Purchase event fires fine through the
same GoKwik flow.

---

## 6. Exact proposed changes

**None applied.** Re-ranked by the evidence - the Meta items dropped, the quality items rose.

| # | Change | Where | Priority |
|---|---|---|---|
| 1 | Raise **View content EMQ (4.4/10)** - lowest of any event, on the highest-volume conversion signal | Advanced matching / PDP browser transport | **High** |
| 2 | Set the **dataset category** (currently `None`) | Events Manager -> Settings | **High** (one click, blocks nothing) |
| 3 | Investigate the **PDP browser-beacon gap** - browser is ~50% of server on ViewContent | Theme / Meta pixel | Medium |
| 4 | Set `ga4Gokwik` = `G-H88KFX0B26` to restore `begin_checkout` | Theme editor -> GoKwik -> Data Tracking | Medium, after #5 |
| 5 | Ask GoKwik which events its GA4 bridge emits | GoKwik support | Medium |
| 6 | Link Google Ads via the Google & YouTube channel | Shopify app | Medium |
| 7 | Ask GoKwik to emit Shopify's `sh-` ID for InitiateCheckout | GoKwik support | Low |
| 8 | Check the **2 extra domains** on the dataset ("visheshmasala.com +2 more") | Events Manager | Low |

Nothing above is a theme-code change except #3, which needs diagnosis first.

**Withdrawn from the previous list:** clearing GoKwik's `fbpixel`, and the
"fix the event ID before the transport" sequencing. Both were premised on a
duplication problem that the data does not show.

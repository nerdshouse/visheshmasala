# Vishesh Masala - GST audit (read-only, 25 Sep 2026, IST)

Nothing was changed. Rates proposed below are for the business's CA to confirm before any
change - HSN and rate calls on blends, hing, salt, flours and cocoa are judgment calls.

## 1. Order #1016
| Field | Value |
|---|---|
| Product / variant | Punjabi Gravy Masala - 100g Box, SKU VM-PBS-PGM-100, variant 44373125202033 |
| Shopify product type / category | "Blended Spice" / **none** |
| HSN (inventory item) | **none** |
| Tax code | blank · taxable: yes |
| Order | ₹100 goods + ₹79 Shipping + ₹100 COD Charges = ₹279, Surat (GJ), cancelled 12:22:44 IST |
| Tax line | **IGST 18% = ₹42.56**, all on the product line |
| Maths | ₹42.56 = 18/118 × **₹279** - tax on goods **and** shipping **and** COD fee |
| Shipping / COD lines | no tax lines of their own |

Every GoKwik order #1001-#1016 follows the same pattern: one IGST 18% line = 18/118 of the
whole order total (shipping/COD included), spread over the product lines. Always IGST, even
for Gujarat → Gujarat orders (#1016, #1015, #1014, #1013, #1010, #1008, #1004).

## 2. Where the 18% comes from
| Layer | Setting found | Effect |
|---|---|---|
| Shopify → Taxes → India | Tax service "Manual Tax". Base India 9%. Every state 18% **IGST "instead of 9% federal tax"** - Gujarat included | Shopify's default rates. Home-state orders are never split into CGST+SGST |
| Shopify tax overrides | **None** ("Add override" only) | Nothing lowers masala to 5% |
| Shopify tax on shipping | `taxShipping: false` | Shopify itself wouldn't tax shipping |
| Shopify Markets | One market, India (primary) | No market-level tax differences |
| Products | 59 products, all taxable, no HSN, no tax code, no category (4 "Uncategorized"), no tax metafields | No manual per-product override forcing 18% |
| **GoKwik → Tax & Others → Global Tax Settings** | Its own copy of the rate table: India 9%, every state 18% IGST instead of central - Gujarat included (only Karnataka is "9% SGST added") | **This is what GoKwik orders use** |
| GoKwik "Enable Tax Display on Shopify Order Details" | ON | GoKwik writes its own tax lines into the Shopify order |
| GoKwik "Separate Tax Calculation for Line Items and Shipping" | **OFF** | Tax computed on the whole order total - shipping and COD fee taxed at 18% too |
| GoKwik "Tax Override" | OFF, empty | GoKwik's note: *"Tax override settings configured on Shopify need to be replicated here, as Shopify does not provide access to them."* |

**GoKwik calculates the tax itself** from its own table - it does not read Shopify's rate
per order. Fixing Shopify alone would not fix GoKwik orders (all orders so far are GoKwik).

## 3. Shipping and COD tax
- Today: taxed at **18% IGST inside GoKwik's single calculation** (separate calculation off),
  not shown as separate tax lines. Shopify has shipping tax off, but that only affects native
  checkout.
- Under GST, delivery/COD charges billed together with the goods are usually treated as part
  of a composite supply and taxed at the goods' rate (5% for a masala-only order); mixed-rate
  carts (e.g. masala 5% + salt nil) need a rule. **CA to confirm** before configuring.

## 4. Catalog by current and proposed classification
Current for every product: **no HSN, no category, 18% (IGST)**.

### A. Single ground spices - propose 5%
| Product | Proposed HSN | Proposed GST |
|---|---|---|
| Chilli Powder | 0904 22 | 5% |
| Kashmiri Chilli Powder | 0904 22 | 5% |
| Chillie Flakes | 0904 22 | 5% |
| Turmeric Powder | 0910 30 | 5% |
| Coriander Powder | 0909 22 | 5% |
| Cumin Powder | 0909 32 | 5% |
| Dry Ginger Powder | 0910 12 | 5% |
| Methi Powder | 0910 99 | 5% |
| Coriander & Cumin Powder | 0910 91 (mixture) | 5% |

### B. Spice mixtures / masalas - propose 5% (0910 91)
Classic, Rajwadi, Lajawab, Special, Super, Surti Garam Masala · Dalshak Masala ·
Biriyani/Pulav · Chhole-Chana · Chicken · Chicken Tikka · Idli-Sambar · Kitchen King ·
Mutton · Paneer Tikka · Pavbhaji · Punjabi Gravy · Shahi Paneer · Tandoori Chicken ·
Undiyu · Premium Tea Masala · Chevdo · Dabeli · Egg Curry · Fish · Frankie · Kadhi ·
Khichdi Masala. (28 products)

### B2. Masalas with salt/sugar/other non-spice ingredients - 5% expected, HSN to confirm
May be "mixed condiments and seasonings" (2103 90) rather than 0910 91 depending on recipe;
both are 5% under the Sept 2025 GST rates as I understand them - confirm:
Chat Masala · Chhas Masala · Jaljira Powder · Panipuri Masala · Chutney Masala ·
Pizza Masala · Pasta Masala · Aachar Masala · Gol Keri Aachar Masala. (9 products)

### C. Different goods - FLAG, do not move with the spices
| Product(s) | Likely HSN | Likely GST | Note |
|---|---|---|---|
| Black Salt, Rock Salt | 2501 | **Nil (0%)** | Salt is exempt - currently overcharged at 18% |
| No.300 / Premium / Super / Red / Black / Green Label Compound Hing (6) | 1301 90 (asafoetida) | 5% expected | Compound hing blends asafoetida with flour/gum - confirm HSN and rate |
| Rajgara Atta, Shingoda Atta | 1106 / 1102 | 5% if pre-packaged & labelled | Flours, not spices |
| Cold Coco Powder | 1806 (cocoa with sugar) | was 18%; check Sept 2025 rate | Not a spice |
| Oregano Flakes | 1211 90 / 0910 99 | 5% expected | Dried herb - confirm |
| Peepramul (Ganthoda) Powder | 0904 / 1211 | 5% expected | Long-pepper root - confirm |

## 5. What a fix would involve (not done)
1. CA sign-off on the table above (HSN + rate per product, and shipping/COD treatment).
2. Shopify: India rates for 5% (base 2.5% CGST; other states 5% IGST; **Gujarat as SGST
   added to CGST**), plus collection overrides for exceptions (salt 0%, cocoa if different).
3. GoKwik: replicate the same in Global Tax Settings + Tax Override (it cannot read Shopify
   overrides), and decide on "Separate Tax Calculation for Line Items and Shipping".
4. Products: store HSN on each variant's inventory item and set product categories
   (record-keeping/invoices; Shopify India doesn't calculate by HSN).
5. Past orders #1001-#1015 carry 18% tax lines - discuss with the CA how to treat them.

---

# Change applied - flat 5% GST, price-inclusive (25 Sep 2026, IST)
Owner instruction: "Price, including GST, should be 5%. Instead of 18, it should be 5."
Only the rates were changed; each region keeps its existing tax type.

| System | Before | After | Saved / verified |
|---|---|---|---|
| GoKwik → Tax & Others → Global Tax Settings (drives every GoKwik order) | India 9; 36 regions 18 IGST "instead of central"; Karnataka 9 SGST "added to central" | India **2.5**; 36 regions **5 IGST**; Karnataka **2.5 SGST added** (= 5) | "Setting Saved Successfully" 13:11 IST; re-read after reload |
| Shopify → Taxes and duties → India (native checkout only) | India 9; states 18 IGST; Karnataka 9 SGST added | India **2.5**; states **5 IGST**; Karnataka **2.5 SGST added** | Saved page by page; all 5 pages re-read after reload |

Unchanged: tax-inclusive pricing, GoKwik "tax display on Shopify orders" ON, "separate tax
calculation for line items and shipping" OFF (so shipping and COD are taxed at 5% inside the
same calculation), no overrides in either system, shipping methods, prepaid offer OFF.
Live checkout checked after the change: ₹100 cart → ₹79 shipping, ₹179 total (prices are
inclusive, so totals don't move; only the tax recorded on the order changes).

Not changed (still open from the CA sheet): Gujarat is still IGST (not CGST + SGST); salt is
5% (may be Nil); hing, cocoa and Chapter 21 blends are 5% pending CA; past orders #1001-#1016
keep their 18% tax lines.
First attempt note: an earlier GoKwik save at ~12:5x IST did not persist (the dashboard's
tax-details API hung for several minutes); the 13:11 save is the effective one.

## Gujarat → CGST + SGST (25 Sep 2026, IST)
Gujarat row changed in both systems from "5% IGST instead of central/federal" to
**"2.5% SGST added to 2.5% central/federal"** → CGST 2.5% + SGST 2.5% = 5% on intra-state
orders. Other states unchanged (5% IGST). Same structure Karnataka already used.
- GoKwik Global Tax Settings: "Setting Saved Successfully" 13:20 IST; re-read after reload
  (Gujarat 2.50 SGST added; 35 regions 5.00; India 2.50).
- Shopify Taxes → India: "Tax settings for India saved successfully" ~13:25 IST; re-read after
  reload.
Next Gujarat order should show two tax lines (CGST + SGST, 2.5% each) instead of IGST.

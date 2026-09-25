# Vishesh Masala - GST classification sheet for CA review

**Status: PROVISIONAL - prepared 25 Sep 2026 (IST) for CA approval. Nothing has been changed
in Shopify, GoKwik or the product catalog.**

Proposed rates reflect our understanding of the GST rates in force after the September 2025
rationalisation. They are not tax advice. The CA must confirm every HSN and rate, especially
where the ingredient list moves a product out of Chapter 09.

Companion files: `VISHESH-MASALA-GST-CA-PRODUCTS.csv` (one row per product) and
`VISHESH-MASALA-GST-CA-ORDERS.csv` (orders #1001-#1016).

## How ingredients were sourced
- Shopify has **no ingredient data**: product descriptions are marketing copy, the product
  page "Ingredients" accordion is empty, and there are no ingredient metafields.
- Ingredients below are **read from the brand's own pack artwork** in the Shopify product
  images (back-of-pack panels). Source column: **Pack** = read from the printed ingredient
  panel; **None** = no ingredient panel in any store image (front-only pouches, jars, and box
  backs that carry only a recipe) - classification for these is **not verified** and needs the
  brand's spec sheet / physical pack.
- Pack labels that say **"PROPRIETARY FOOD - NOT CURRY POWDER"** (Egg Curry, Gol Keri, Rajwadi
  Garam Masala) are FSSAI categorisations, but they are a strong hint that the product is a
  food preparation rather than a pure Chapter 09 spice mixture.

## Current Shopify tax setup (same for every product and variant)
Taxable: yes · Tax code: blank · HSN (inventory item): blank · Product category: none (4 are
"Uncategorized") · Rate actually charged: **18% IGST** (GoKwik global table; Shopify India
defaults are also 18%). No product/collection overrides anywhere.

## Classification by group

Legend - Confidence: **High** = ingredients read from pack and heading is clear;
**CA** = needs CA confirmation. ⚠ = composition could move the product out of Chapter 09.

### 1. Pure / single spices
| Product | SKUs | Ingredients (source) | Proposed HSN | Proposed GST | Rationale | Confidence |
|---|---|---|---|---|---|---|
| Chilli Powder | VM-EPP-CHP-100/200/500/1000 | Chilli; "not more than 2% edible refined veg. oil (cottonseed)" (Pack) | 0904 22 | 5% | Crushed/ground capsicum. ⚠ The ≤2% oil admixture is a permitted spice-standard additive; CA to confirm it doesn't change the heading | High (CA note on oil) |
| Chillie Flakes | VM-ETC-CFL-012 | "Crush Chilli (Ground Spices)", FSSAI food cat. 12.2.1 (Pack) | 0904 22 | 5% | Crushed capsicum | High |
| Turmeric Powder | VM-EPP-TUR-100/200/500/1000 | Turmeric (Pack) | 0910 30 | 5% | Ground turmeric | High |
| Coriander Powder | VM-EPP-COR-100/200/500/1000 | Coriander (Pack) | 0909 22 | 5% | Ground coriander seed | High |
| Methi Powder | VM-EPP-MTH-500 | Dry Fenugreek (Pack) | 0910 99 | 5% | Fenugreek seed is listed under 0910 | High |
| Cumin Powder | VM-ETC-CUM-012, VM-EPP-CUM-500 | None - description: "jeera, roasted and ground" | 0909 32 | 5% | Ground cumin, if single-ingredient | CA (verify pack) |
| Dry Ginger Powder | VM-ETC-DGP-012, VM-EPP-DGP-050/500 | None - description: "dried ginger ground" | 0910 12 | 5% | Ground dried ginger, if single-ingredient | CA (verify pack) |
| Kashmiri Chilli Powder | VM-EPP-KCP-100/200/500 | None (box/jar backs show no panel) | 0904 22 | 5% | Ground capsicum, if single-ingredient (may also carry ≤2% oil like Chilli Powder) | CA (verify pack) |

### 2. Mixtures consisting only of spices
| Product | SKUs | Ingredients (source) | Proposed HSN | Proposed GST | Rationale | Confidence |
|---|---|---|---|---|---|---|
| Coriander & Cumin Powder | VM-EPP-CCP-100/200/500 | Coriander, Cumin (Pack) | 0910 91 | 5% | Chapter 09 Note 1(b): mixtures of spices of different headings go to 0910 91 | High |

No other product could be verified as spice-only from the pack artwork. The garam masalas
that could be read (Classic, Rajwadi) contain salt, oil and sesame - see group 3.

### 3. Blends containing salt, sugar, starch, citric acid, oil, flavouring or other non-spice ingredients ⚠
All ⚠: the non-spice content could move these from 0910 91 (mixture of spices) to Chapter 21
(2103 90 "mixed condiments and mixed seasonings", or 2106 90 "food preparations n.e.s.").
The 2103 90 rate is 5% on my understanding; 2106 90 sub-headings vary. **CA must decide
heading and rate for each.**

Verified from pack:
| Product | SKUs | Ingredients (Pack) | Non-spice content | Proposed HSN | Proposed GST | Confidence |
|---|---|---|---|---|---|---|
| Classic Garam Masala | VM-GM-CLS-050 | Coriander, Chillies, Sesame Seed, Cloves, Star Aniseed, Stone Flower, Nutmeg, Fennel, Cumin, Cinnamon Leaves, Cinnamon, Black Pepper, Iodised Salt, Cardamom Amomum, Mace, Turmeric, Cottonseed Oil. "Spice content 80%, contains salt less than 10%" | Salt, oil, sesame (oilseed), stone flower (lichen) | 0910 91 (spice content 80%) or 2103 90 | 5% | CA |
| Rajwadi Garam Masala | VM-GM-RAJ-050/100/200/500 | Coriander, Chillies, Sesame, Cloves, Star Aniseeds, Stone Flower, Nutmeg, Fennel, Cumin, Cinnamon Leaves, Cinnamon, Iodised Salt, Black Pepper, Mace, Turmeric, Cardamom Amomum, Cottonseed Oil. "PROPRIETARY FOOD - NOT CURRY POWDER" | Salt, oil, sesame | 2103 90 (or 0910 91) | 5% | CA |
| Aachar (Athana) Masala | VM-ETC-ACH-012, VM-ACH-AAM-100/200/500 | Fenugreek, Chillies, Iodised Salt, Mustard Oil, Mustard Dal, Compounded Asafoetida, Turmeric | Salt, mustard oil, compounded hing (wheat flour) | 2103 90 | 5% | CA |
| Gol Keri Aachar Masala | VM-ACH-GKR-200/500 | Chillies, Dry Dates, Coriander Dal, Iodized Salt, Cotton Seed Oil, Mustard Dal, Fenugreek, Fennel, Black Pepper, Cinnamon, Compounded Asafoetida, Turmeric. "PROPRIETARY FOOD - NOT CURRY POWDER" | Dates, salt, oil | 2103 90 | 5% | CA |
| Chutney Masala | VM-ETC-CHU-035 | Sugar, Corn Flour, Dry Mango Powder, Black Salt, Iodized Salt, Beet, Chillies, Cloves, Compounded Asafoetida, Citric Acid | Sugar (first ingredient), starch, salt, beet, citric acid | 2103 90 / 2106 90 | 5% (if 2103) | CA |
| Dabeli Masala | VM-ETC-DAB-018 | Sugar, Chillies, Dry Mango Powder, Iodized Salt, Black Salt, Beet, Cloves, Star Aniseed, Cumin Seed, Compounded Asafoetida, Turmeric, Citric Acid | Sugar (first), salt, beet, citric acid | 2103 90 | 5% | CA |
| Egg Curry Masala | VM-ETC-EGG-012 | Coriander, Cumin, Chilli, Garlic Powder, Gram Flour, Iodized Salt, Dry Mango Powder, Cotton Seeds Oil. "PROPRIETARY FOOD - NOT CURRY POWDER" | Garlic, gram flour, salt, oil | 2103 90 | 5% | CA |
| Frankie Masala | VM-ETC-FRK-017 | Rock Salt, Black Salt, Tamarind, Cumin Seeds, Chillies, Ginger, Cloves, Cinnamon, Star Anise, Compounded Asafoetida, Ajwain, Mint Leaves, Citric Acid | Salt (first two ingredients), tamarind, mint, citric acid | 2103 90 | 5% | CA |
| Kadhi Masala | VM-ETC-KAD-027 | Gram Flour, Sugar, Iodized Salt, Dry Ginger, Cumin Seed, Green Chilly, Compounded Asafoetida, Cloves, Curry Leaves | Gram flour (first), sugar, salt | 2103 90 / 2106 90 | 5% (if 2103) | CA |

Probable group 3 - **not verified** (no ingredient panel in store images). Descriptions or
product type suggest salt/sour/sweet components; get the pack spec before filing:
| Product | SKUs | Evidence | Proposed HSN | Proposed GST | Confidence |
|---|---|---|---|---|---|
| Chat Masala | VM-PBS-CHT-050/100/500 | "Tangy sprinkle"; chaat masala normally contains black salt, amchur | 2103 90 or 0910 91 | 5% | CA (verify) |
| Chhas Masala | VM-ETC-CHS-017, VM-PBS-CHS-200/500 | Buttermilk masala - normally salt-based | 2103 90 | 5% | CA (verify) |
| Jaljira Powder | VM-PBS-JAL-100/500 | Description: "cumin, mint and black salt" | 2103 90 | 5% | CA (verify) |
| Panipuri Masala | VM-PBS-PNP-050/100 | Normally salt, mint, amchur | 2103 90 | 5% | CA (verify) |
| Pizza Masala | VM-ETC-PIZ-017 | Seasoning - typically herbs, salt, garlic | 2103 90 | 5% | CA (verify) |
| Pasta Masala | VM-ETC-PAS-030 | Seasoning | 2103 90 | 5% | CA (verify) |
| Chevdo Masala | VM-ETC-CHV-020 | Snack seasoning | 2103 90 | 5% | CA (verify) |
| Khichdi Masala | VM-ETC-KHI-023 | Sachet masala (other sachets carry salt/sugar) | 2103 90 or 0910 91 | 5% | CA (verify) |
| Fish Masala | VM-ETC-FSH-012 | Sachet masala | 2103 90 or 0910 91 | 5% | CA (verify) |
| Biriyani/Pulav, Chhole-Chana, Chicken, Chicken Tikka, Idli-Sambar, Kitchen King, Mutton, Paneer Tikka, Pavbhaji, Punjabi Gravy, Shahi Paneer, Tandoori Chicken, Undiyu Masala | VM-PBS-BIR/CHC/CHK/CTK/IDS/KKM/MUT/PTK/PAV/PGM/SHP/TAN/UND-* | Boxes/jars - box backs show only a recipe; Pavbhaji box says "(MASALA MIX)" | 0910 91 or 2103 90 | 5% | CA (verify) |
| Lajawab, Special, Super, Surti Garam Masala; Dalshak Masala | VM-GM-LAJ/SPL/SUP/SUR/DAL-* | No panel; the two garam masalas that could be read contain salt + oil | 0910 91 or 2103 90 | 5% | CA (verify) |
| Premium Tea Masala | VM-TEA-PRM-050/100 | No panel. If it contains tea leaf or sugar, heading changes | 0910 91 (spices only) | 5% | CA (verify) |

### 4. Salt products
| Product | SKUs | Ingredients (Pack) | Proposed HSN | Proposed GST | Rationale | Confidence |
|---|---|---|---|---|---|---|
| Black Salt | VM-EPP-BSL-1000 | "(In Powder Form) Black Salt" | 2501 00 | **Nil** | Salt, all types, is exempt | High (CA to confirm exemption applies to black salt powder) |
| Rock Salt | VM-FAST-RCK-1000 | "Rock Salt" | 2501 00 | **Nil** | As above | High (same note) |

### 5. Hing products ⚠
All compounded asafoetida: majority **wheat flour** + gum arabic + asafoetida. Candidate
headings: 1301 90 (asafoetida) vs 2106 90 (food preparation n.e.s.) - the flour share makes
this a genuine CA call; rate differs by heading.
| Product | SKUs | Ingredients (source) | Proposed HSN | Proposed GST | Confidence |
|---|---|---|---|---|---|
| No.300 Compound Hing Powder | VM-HING-300-050/100/200/500 | Wheat Flour, Gum Arabic, Asafoetida; "Wheat Flour 70% approx." (Pack) | 1301 90 or 2106 90 | 5% if 1301 - CA | CA |
| Premium Compound Hing Powder | VM-HING-PRM-050/100/200/500 | Same; wheat flour 60% (Pack) | as above | as above | CA |
| Black Label Compound Hing | VM-HING-BLK-500 | Same; wheat flour 60% (Pack) | as above | as above | CA |
| Green Label Compound Hing | VM-HING-GRN-500 | Same; wheat flour 60% (Pack) | as above | as above | CA |
| Red Label Compound Hing | VM-HING-RED-500 | Same; wheat flour 60% (Pack) | as above | as above | CA |
| Super Compound Hing Powder | VM-HING-SUP-050/100/200/500 | "Compounded Asafoetida" (jar front; panel unreadable) | as above | as above | CA (verify) |

Note: the hing nutrition panels print the same table as Frankie Masala (213.46 kcal, Sodium
18,577.7 mg/100g). That sodium level fits Frankie (salt is its first ingredient) but not a
flour-based hing - likely copied artwork, worth flagging to the brand.

### 6. Flours
| Product | SKUs | Ingredients (source) | Proposed HSN | Proposed GST | Confidence |
|---|---|---|---|---|---|
| Rajgara Atta | VM-FAST-RAJ-100/200/500 | Rajgira (amaranth) (Pack) | 1102 90 (flour of other cereals) or 1106 | 5% if pre-packaged & labelled | CA |
| Shingoda Atta | VM-FAST-SHG-100/500 | None - description: water chestnut flour | 1106 (flour of edible fruit/nut) | 5% if pre-packaged & labelled | CA (verify) |

### 7. Cocoa products
| Product | SKUs | Ingredients (source) | Proposed HSN | Proposed GST | Confidence |
|---|---|---|---|---|---|
| Cold Coco Powder | VM-ETC-COC-100 | None - pack front reads "COCOA POWDER (INSTANT MIX)", which implies added sugar/milk solids | 1806 10 (cocoa with sugar) or 1805 / 2106 | CA - historically 18%; check current rate | CA |

### 8. Other / unclear
| Product | SKUs | Ingredients (source) | Proposed HSN | Proposed GST | Confidence |
|---|---|---|---|---|---|
| Oregano Flakes | VM-ETC-ORE-012 | None - description: "dried oregano leaves" | 1211 90 or 0910 99 | 5% | CA (verify) |
| Peepramul (Ganthoda) Powder | VM-EPP-PPR-050 | None - description: long pepper root, ground | 1211 90 (plant parts) or 0904 | 5% | CA (verify) |

Counts (59 products, each listed once): 1) 8 · 2) 1 · 3) 9 verified + 28 unverified · 4) 2 ·
5) 6 · 6) 2 · 7) 1 · 8) 2. Ingredients read from pack for 23 products; 36 need the brand's spec.

## Configuration after CA approval (NOT implemented)

Assumes the CA confirms: default 5%, salt Nil, and possibly one higher-rate group (e.g. 18%
for cocoa or for a Chapter 21 heading). The business is registered in **Gujarat**.

### Shopify - Settings → Taxes and duties → India
| Setting | Value |
|---|---|
| India (federal = CGST) | **2.5%** |
| Gujarat | **2.5% SGST, "added to" federal** → CGST 2.5% + SGST 2.5% = 5% |
| Every other state/UT | **5% IGST, "instead of" federal** |
| Charge tax on shipping | Per CA (see shipping section) |
| Tax overrides → by collection | One manual collection per non-default rate, e.g. "GST Nil - Salt" (Black Salt, Rock Salt): India 0%, Gujarat SGST 0%, other states 0%. "GST 18%" (if CA puts any product there): India 9%, Gujarat SGST 9% added, other states 18% IGST |
| Products | HSN on each variant's inventory item (harmonizedSystemCode) + Shopify product category - for invoices/records; Shopify India does not calculate by HSN |

Note: Shopify only matters for native checkout; all orders so far are GoKwik.

### GoKwik - Checkout Settings → Tax & Others
| Setting | Value |
|---|---|
| Global Tax Settings: India | **2.5** |
| Global: Gujarat | **2.5, "SGST added to central tax"** (the table already supports this - Karnataka is set that way today) |
| Global: every other state/UT | **5, "IGST instead of central tax"** |
| Enable Tax Override | ON, with **Collection** overrides mirroring Shopify: "GST Nil - Salt" → Gujarat CGST 0 + SGST 0; each other state IGST 0. Same pattern for any 18% collection |
| Enable Tax Display on Shopify Order Details | ON (unchanged) |
| Separate Tax Calculation for Line Items and Shipping | Decide after CA ruling - see below |

GoKwik overrides are defined per **state and tax type**, so a Nil collection needs one row per
state/UT (Gujarat as CGST+SGST, others IGST) unless GoKwik offers an all-states option - to
confirm with GoKwik.

## Mixed-rate carts in GoKwik

**Documented by GoKwik** (Tax configurations guide):
- Items: each item is taxed at its own rate and gets its own tax lines - e.g. a 12% item and
  an 18% item in a Gujarat order produce CGST 6% + SGST 6% and CGST 9% + SGST 9%.
- Overrides can target Product, **Shipping**, or Collection, per State, per tax type.
- "Separate Tax Calculation for Line Items and Shipping": *"tax will be calculated separately
  for product line items and shipping charges ... more accurate tax breakdown in Shopify
  invoices (not visible on the order page)"*.

**Observed today** (toggle OFF, no overrides): GoKwik computes one tax on the **whole order
total including shipping and the COD fee** at the default rate and spreads it over the product
lines (#1016: 18/118 × ₹279). Shipping and COD lines carry no tax of their own.

**Limitation:** GoKwik has **no documented way for shipping/COD tax to inherit or apportion
the goods' rates**. Shipping tax is a single configured rate (global default or a Shipping
override) per state. So:
- 5% masala + 0% salt: items would be taxed correctly (5% and Nil) with a salt override, but
  shipping/COD would be taxed at one fixed rate (e.g. 5%), not split 5%/Nil by value.
- 5% spice + 18% cocoa: items correct at 5% and 18%; shipping/COD at the one fixed rate, not
  the principal-supply or proportional rate.
- With the toggle OFF, it is **not documented** how the whole-order calculation behaves once
  item overrides exist (whether shipping is folded in at the default rate). Unverified.

**Before deciding on the toggle**, the CA should say how delivery and COD charges must be
taxed for mixed carts (principal-supply rate, proportional, or highest rate), and GoKwik
support should confirm:
1. With the toggle OFF and collection overrides, what rate is applied to shipping/COD?
2. With it ON, which rate is used - the Shipping override, or the global default?
3. Is the COD fee treated as shipping for tax?
4. Can shipping tax follow the cart's item rates (proportional apportionment)?
If proportional apportionment is required and GoKwik can't do it, mixed carts will need a
manual invoice adjustment or a documented simplification approved by the CA.

## Orders #1001-#1016 - PROVISIONAL (until CA approval)
Assumes every item sold so far is 5% (hing, garam masala, chhas, chat, tea, tandoori, punjabi
gravy - no salt or cocoa was sold). "Composite" = shipping and COD taxed at the goods' 5%.
All prices are GST-inclusive, so the customer paid the same; the difference is GST reported.
If the CA puts hing at 18%, hing-only orders (#1005, #1008, #1012, #1013) were correct on goods.

| Order | Status | State | Items | Goods (after disc.) | Ship+COD | Total | GST charged (IGST 18%) | Taxable value as charged | Likely GST @5% composite | Likely GST @5% goods only | Over-charged vs composite |
|---|---|---|---|---|---|---|---|---|---|---|---|
| #1016 | Cancelled | GJ | Punjabi Gravy 100g | 100.00 | 179.00 | 279.00 | 42.56 | 236.44 | 13.29 (CGST 6.64 + SGST 6.64) | 4.76 | 29.27 |
| #1015 | Cancelled | GJ | Tandoori 100g; No.300 Hing 500g | 480.00 | 149.00 | 629.00 | 95.95 | 533.05 | 29.95 (CGST 14.98 + SGST 14.98) | 22.86 | 66.00 |
| #1014 | Cancelled | GJ | No.300 Hing 50g; Rajwadi 50g; Red Label Hing 500g | 340.00 | 149.00 | 489.00 | 74.59 | 414.41 | 23.29 (CGST 11.64 + SGST 11.64) | 16.19 | 51.30 |
| #1013 | Paid | GJ | Premium Hing 500g | 570.00 | 49.00 | 619.00 | 94.42 | 524.58 | 29.48 (CGST 14.74 + SGST 14.74) | 27.14 | 64.94 |
| #1012 | Paid | MH | No.300 Hing 500g | 351.50 | 49.00 | 400.50 | 61.09 | 339.41 | 19.07 (IGST) | 16.74 | 42.02 |
| #1011 | Paid | MP | Rajwadi 200g | 156.75 | 49.00 | 205.75 | 31.38 | 174.37 | 9.80 (IGST) | 7.46 | 21.58 |
| #1010 | Paid | GJ | Chat 50g; Rajwadi 50g; Premium Tea 100g ×2 | 380.00 | 49.00 | 429.00 | 65.44 | 363.56 | 20.43 (CGST 10.21 + SGST 10.21) | 18.10 | 45.01 |
| #1009 | Paid | AS | Chhas 200g | 118.75 | 49.00 | 167.75 | 25.59 | 142.16 | 7.99 (IGST) | 5.65 | 17.60 |
| #1008 | Paid | GJ | No.300 Hing 500g | 351.50 | 49.00 | 400.50 | 61.09 | 339.41 | 19.07 (CGST 9.54 + SGST 9.54) | 16.74 | 42.02 |
| #1007 | Paid | MH | Chhas 200g ×2 | 237.50 | 49.00 | 286.50 | 43.70 | 242.80 | 13.64 (IGST) | 11.31 | 30.06 |
| #1006 | Paid | OR | Premium Tea 50g | 76.00 | 49.00 | 125.00 | 19.07 | 105.93 | 5.95 (IGST) | 3.62 | 13.12 |
| #1005 | Paid | OR | No.300 Hing 100g | 76.00 | 49.00 | 125.00 | 19.07 | 105.93 | 5.95 (IGST) | 3.62 | 13.12 |
| #1004 | Paid | GJ | Chat 500g | 285.00 | 49.00 | 334.00 | 50.95 | 283.05 | 15.90 (CGST 7.95 + SGST 7.95) | 13.57 | 35.05 |
| #1003 | Refunded / cancelled | GJ | Rajwadi 50g | 42.75 | 49.00 | 91.75 | 13.99 | 77.76 | 4.37 (CGST 2.18 + SGST 2.18) | 2.04 | 9.62 |
| #1002 | Cancelled (₹0 test) | MH | Premium Hing 50g | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| #1001 | Refunded / cancelled | GJ | Rajwadi 50g | 42.75 | 49.00 | 91.75 | 13.99 | 77.76 | 4.37 (CGST 2.18 + SGST 2.18) | 2.04 | 9.62 |

**Paid orders (#1004-#1013):** total ₹3,093.00 · GST charged ₹471.80 · likely @5% composite
₹147.29 · likely @5% goods only ₹123.95 · **over-charged ₹324.51** (provisional).
Gujarat orders also show IGST where CGST + SGST should apply.

# Build prompt — laptop comparison and review site

**Reader:** an AI coding agent that will build the site described here.
**Source of the specification:** a live study of seven competitor domains, listed in section 12.
**Status of this document:** build instructions, not a market report. Everything marked `MVP`
is meant to be built and shipped first; everything marked `Later` is specified now so the
schema and routes do not have to be redesigned to add it.

Research date: **2026-10-31**. All competitor observations in this document were taken from the
live sites on that date. No competitor page is stored in this repository, so re-verify a claim
against the live page before you treat a number (compare limits, price formats, exact labels) as
a contract — section 11 already turns every number you must not guess into an open decision
with a default.

### Contents

1. [Purpose and reader](#1-purpose-and-reader)
2. [Product scope and users](#2-product-scope-and-users)
3. [Feature inventory](#3-feature-inventory) — 155 rows across 16 capability areas
4. [Page and route inventory](#4-page-and-route-inventory) — 32 screens with loading, empty and error states
5. [Data model](#5-data-model) — every entity the Issue names, plus the supporting tables behind them
6. [Comparison rules](#6-comparison-rules) — limits, unit normalisation, missing values, differences, winners, shareable URLs
7. [Scoring and benchmarks](#7-scoring-and-benchmarks) — measurements, normalisation, usage ratings, methodology
8. [Search and discovery](#8-search-and-discovery)
9. [Non-functional requirements](#9-non-functional-requirements) — SEO, performance, accessibility, breakpoints, analytics, disclosure
10. [Build order](#10-build-order) — phases mapped to inventory ids
11. [Open decisions](#11-open-decisions) — 20 decisions, each with a default
12. [Coverage table](#12-coverage-table) — per-site evidence and the `Not verified` list

---

## 1. Purpose and reader

### Who reads this

You, an AI coding agent, and the human owner who hands you this file. Build the site described
in sections 2–10. Do not ask a clarifying question before starting: section 11 lists the
decisions that are still open, each with a default you may implement immediately. If you believe
a default is wrong, implement the default and raise the question at the end of your work.

### What you must produce

A single web application — one product, not seven — that lets a visitor:

1. find a laptop inside a budget,
2. compare two to four specific laptops on one screen,
3. read measured test results behind a score instead of a marketing number,
4. arrive at a ranked "best laptop for X" answer.

The site is laptop-first. Phone, TV and appliance categories that some competitors also run are
`Later` and must not be built now; the schema in section 5 must merely not forbid them.

### What you must not do

- Do not copy competitor content: spec tables, review prose, photographs, logos, page design, or
  a competitor's brand name used as this site's own.
- Do not pick the technology stack, database, hosting or CMS on the owner's behalf — propose a
  stack in your first reply, then build. Nothing in sections 4–9 depends on the stack.
- Do not enrol in affiliate or advertising networks, and do not write the legal disclosure copy.
  Build the surfaces (section 9.6) and leave them configurable.
- Do not scrape or redistribute competitor data at build time. The product database is filled
  from vendor spec sheets and your own tests.

### How to use the document

- Section 3 is the feature inventory; its ids (`DB-01`, `CMP-03`, …) are referenced by sections
  4–10. Every id must exist as real behaviour before the phase that contains it is called done.
- Section 4 gives one route per screen. Section 5 gives the entities those screens read and
  write. Sections 6–8 give the rules that must not be re-invented per screen.
- Section 12 is the evidence table: which competitor page each feature came from, and what could
  not be verified. If you doubt a row, section 12 tells you where to look.

---

## 2. Product scope and users

### Jobs the site exists for

| Job | User's words | Where it lands on the site |
| --- | --- | --- |
| Choose inside a budget | "best laptop under ₹60,000" | price-bucket landing pages, filtered list (`SEO-03`, `SRCH-04`) |
| Compare two specific models | "X vs Y, which one" | compare route with 2–4 columns (`CMP-01`…`CMP-10`) |
| Judge measured results | "how bright is the screen really, how long does the battery last" | lab test tables and scores (`TEST-01`…`TEST-18`, section 7) |
| Find the best pick for a use case | "best laptop for programming / college / gaming" | best-of lists, usage-scenario ranking (`RANK-02`, `FIND-03`) |

### User segments

- **Budget-constrained buyer** — fixed budget, needs a shortlist, cares about price history and
  "is it a good deal now".
- **Model-vs-model decider** — already has two candidates, needs differences only, not a wall of
  200 identical rows.
- **Spec-literate researcher** — reads benchmark numbers and screen measurements, distrusts a
  single opaque score.
- **Use-case shopper** — arrives from a search for "best laptop for video editing", needs a
  ranked list with a one-line reason per pick.

### Scope boundaries

- Laptops only in `MVP`; the catalogue schema is category-agnostic so `Later` categories are a
  data change, not a rewrite.
- Prices, offers and history are per market. `MVP` ships one market (default in section 11,
  decision 2); multi-market is `Later` (`LOC-01`).
- No native mobile app; the site is responsive web (section 9.4).
- No user-generated commerce (no marketplace, no checkout). Outbound links leave the site.

---

## 3. Feature inventory

### How to read the inventory

- **Id** — stable reference used by the rest of this document.
- **Capability area** — one of the 16 areas below; every required area has at least one row.
- **What the user can do** — the user-visible behaviour, described as an action, not as a
  component.
- **Source domain(s)** — the live site(s) where the behaviour was observed on 2026-10-31. Every
  row has at least one; section 12 maps each domain back to these ids.
- **Priority** — `MVP` or `Later`. **These priorities are this document's own judgement** about
  what makes a first shippable version, not a competitor's statement.
- **Variant note** — where the behaviour differs between sites or has a documented choice
  (2-column vs 4-column compare, differences-only, config-aware compare, …).

Capability areas: A product database and specs · B comparison engine · C search and faceted
filters · D price comparison, price history and price drops · E alerts and notifications ·
F expert and lab reviews · G measured test data and scores · H rankings and best-of lists ·
I buying guides, news and editorial · J community · K accounts and personalisation ·
L SEO landing pages and URL structure · M media · N localisation · O monetisation surfaces ·
P guided finder and decision tools.

### A. Product database and specs

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| DB-01 | Product database and specs | Open one canonical page per laptop model with brand, line, model code, release date, launch price and current lowest price | smartprix.com, mysmartprice.com, laptopvslaptop.com, nanoreview.net, rtings.com, laptopmedia.com | MVP | Competitors key the page by model code (`82X70034IN`, `NX.J2HSI.001`, `Mac17,7`); keep the model code in the URL and in the page header |
| DB-02 | Product database and specs | Read the full spec sheet grouped into collapsible sections (General, Display, Processor, Graphics, Memory, Storage, Battery, Connectivity, Input, Audio, Software, Warranty) | smartprix.com, mysmartprice.com, nanoreview.net, laptopvslaptop.com, laptopmedia.com | MVP | rtings groups by *test area* (Design/Display/Battery/Interface/Connectivity/Configuration/Performance/Thermals) instead of vendor spec groups — keep the two groupings separate: vendor spec groups on the product page, test groups on the lab tab |
| DB-03 | Product database and specs | See every spec value with its unit and a plain-language qualifier ("15.6 inches · Large", "1.59 kg · Average", "3038 MHz · Fast") | smartprix.com, nanoreview.net, laptopvslaptop.com | MVP | Qualifier buckets are editorial thresholds, not vendor data; show the bucket as a hint, never as the value |
| DB-04 | Product database and specs | Switch between variants of the same model (CPU/RAM/storage combinations) without leaving the page | smartprix.com ("View 1 More Variant"), nanoreview.net (configuration selectors), laptopmedia.com ("All … configurations") | MVP | nanoreview allows the *same model with two different configurations* inside one comparison — that is `CMP-11`, a `Later` refinement |
| DB-05 | Product database and specs | Identify a laptop by its manufacturer part number in search and see it printed on the page | smartprix.com, mysmartprice.com, laptopvslaptop.com | MVP | Part numbers contain dots and slashes (`NX.J2HSI.001`); URL-encode them and keep the slug readable |
| DB-06 | Product database and specs | Browse a laptop series page listing every model in the family | laptopmedia.com (`/all-laptop-series/`), smartprix.com (brand pages) | Later | — |
| DB-07 | Product database and specs | Follow a CPU or GPU from a spec row to a component page that lists every laptop using it | laptopmedia.com (`/processor/…`, `/video-card/…`), nanoreview.net (`/en/cpu/…`, `/en/gpu/…`) | Later | — |
| DB-08 | Product database and specs | Hover or tap a spec name to read what it means and why it matters | laptopvslaptop.com (per-row "?" help with a short definition and "Read more") | MVP | Help copy is editorial content; keep it per spec key, not per product |
| DB-09 | Product database and specs | See whether a spec set is editorially verified and by whom | nanoreview.net ("Verified specs" label, FAQ definition) | Later | — |
| DB-10 | Product database and specs | Distinguish "the vendor did not disclose this" from "this product does not have it" | mysmartprice.com (`NA` cells), laptopvslaptop.com (`-`), nanoreview.net (`-`) | MVP | Three render states are required: value, `Not disclosed`, `No` — see 6.3 |
| DB-11 | Product database and specs | Browse by brand, and see a brand index with model counts | smartprix.com, mysmartprice.com, laptopvslaptop.com, laptopmedia.com | MVP | — |
| DB-12 | Product database and specs | Compare physical size visually: dimensions in metric and imperial, footprint area, screen-to-body ratio, thickness | laptopvslaptop.com (Laptop Dimensions block), nanoreview.net (area, screen-to-body, bezels), laptopmedia.com (dimensions table) | Later | nanoreview computes derived area and "screen space comparison" percentages — derived values need their formula published (`REV-04`) |
| DB-13 | Product database and specs | Reach manufacturer drivers and see what is in the retail box | laptopmedia.com ("Drivers", "What's in the box?") | Later | — |
| DB-14 | Product database and specs | Report a wrong or missing laptop/spec from the page where the error is visible | nanoreview.net (feedback form: "Haven't found the laptop you're looking for? Let us know"), smartprix.com (Discuss), laptopmedia.com (comments) | MVP | Creates a moderation item; see `COMM-07` |

### B. Comparison engine

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| CMP-01 | Comparison engine | Add any laptop to a comparison from a product card, a product page or a spec row | smartprix.com, mysmartprice.com (`+ Compare`), laptopvslaptop.com | MVP | The tray must survive navigation and page reloads before accounts exist (`ACCT-05`) |
| CMP-02 | Comparison engine | Open a comparison with empty slots and fill each slot from an autocomplete | mysmartprice.com (4 `Add a laptop` fields), smartprix.com (`Add Product`), nanoreview.net (two selectors + `VS`), laptopvslaptop.com ("Pick two laptops") | MVP | **Variants: 2 columns** (nanoreview.net, laptopvslaptop.com, smartprix.com base) **vs 4 columns** (mysmartprice.com compare-laptops has 4 laptop search fields) — build the engine for N=2..4 with 4 as default (section 11, decision 1) |
| CMP-03 | Comparison engine | See specs aligned side by side, one row per spec key, grouped by spec group | smartprix.com, mysmartprice.com, nanoreview.net, laptopvslaptop.com | MVP | Alignment is by spec key, not by row order — one product with 120 specs and another with 90 must not shift rows (6.2) |
| CMP-04 | Comparison engine | Hide every row where the compared products are identical | mysmartprice.com ("Show only Differences" on the alternatives table) | MVP | Also offered at spec-group level so a whole identical group can collapse |
| CMP-05 | Comparison engine | See which product wins each row and why ("Faster Clock Speed", "More CPU Cores", "Higher screen refresh rate: 120 versus 60 Hz") | smartprix.com ("Better Specs" + reason), nanoreview.net (advantage bullets), laptopvslaptop.com (winner summary), rtings.com (per-test better/worse markers) | MVP | Winner needs a per-spec direction (higher-is-better / lower-is-better / neutral) — 6.4 |
| CMP-06 | Comparison engine | See magnitudes, not just winners: "+100% brightness", "15% more compact", "+16% more screen space" | nanoreview.net, smartprix.com (price delta %, price difference in currency) | MVP | Percentage is computed against the better value; show the absolute values next to it |
| CMP-07 | Comparison engine | Read a one-paragraph verdict naming the better product and why | laptopvslaptop.com ("is hands-down winner while also being better priced"), nanoreview.net ("which is better" heading with 0–100 headline) | MVP | Generated from the decided rows plus price; must be reproducible and auditable (6.4) |
| CMP-08 | Comparison engine | Replace one column, keeping the others | mysmartprice.com (`Add More Products` / per-column `x`), smartprix.com (per-column search) | MVP | — |
| CMP-09 | Comparison engine | Search inside an already-filled column to swap the product | mysmartprice.com, smartprix.com, nanoreview.net | MVP | — |
| CMP-10 | Comparison engine | Copy a link that restores exactly this comparison, in this order, with this configuration | smartprix.com, mysmartprice.com, nanoreview.net, laptopvslaptop.com (all use readable compare URLs) | MVP | See 6.6 for the URL contract; the same URL must be the canonical, indexable page |
| CMP-11 | Comparison engine | Compare two configurations of the same model against each other | nanoreview.net ("Now you can choose the same model with different configurations") | Later | Requires variant-level identity in the compare key (`variant_id`, not `model_id`) |
| CMP-12 | Comparison engine | Get suggested opponents scoped to the current category ("Compare X vs other 2-in-1 laptops") | laptopvslaptop.com, laptopmedia.com (article-level device lists) | MVP | Suggestions come from the same price band and form factor, excluding already-compared products |
| CMP-13 | Comparison engine | Compare against a competitor list with an inline `+ Compare` per row | mysmartprice.com (`Competitors` tab) | MVP | Same component as `FIND-05` |
| CMP-14 | Comparison engine | Browse popular and recent comparisons to start from | smartprix.com (`Popular Comparisons`, `Recent Comparisons`), mysmartprice.com (`Popular Comparisons`) | MVP | Needs a popularity counter per comparison pair (`comparison.open` events) |
| CMP-15 | Comparison engine | Compare many products in a sortable, column-configurable table | rtings.com (`Table Tool`) | Later | Different job from the 2–4 column compare: this is a filtered data table, not a decision screen |
| CMP-16 | Comparison engine | Re-weight the ratings to match personal priorities, then re-rank the compared products | rtings.com (`Custom Ratings`, `Vote`) | Later | Weights stored per user or in the URL; never mix into the published score |
| CMP-17 | Comparison engine | Switch between Overview / Specs / Competitors / User Ratings inside one comparison | mysmartprice.com (four tabs) | MVP | Tabs must be links (deep-linkable), not client-only state |

### C. Search and faceted filters

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| SRCH-01 | Search and faceted filters | Type into a header search box and pick from live suggestions across models, series, brands and articles | smartprix.com ("Search with Smartprix"), mysmartprice.com, laptopvslaptop.com ("Search for laptops or games"), laptopmedia.com | MVP | Suggestions must include the model code, because that is how people paste a model in |
| SRCH-02 | Search and faceted filters | Search across several content types and see the counts per type before opening a result | laptopmedia.com ("Laptops (0) Series (0) Reviews (0) News (0) View all results") | MVP | — |
| SRCH-03 | Search and faceted filters | Narrow a list by brand, price bucket, CPU family, RAM, storage, screen size, GPU, OS, touch, form factor | smartprix.com, mysmartprice.com, laptopvslaptop.com (`Laptop Finder` facets), laptopmedia.com (`/specs/` brand facets) | MVP | Facet values come from the spec taxonomy, not from free text (`DB-02`) |
| SRCH-04 | Search and faceted filters | Set a custom min/max price or pick a preset bucket | laptopvslaptop.com (from/to number inputs), smartprix.com (`price-below_50000`, `price-60000_to_75000`), mysmartprice.com (between two amounts) | MVP | — |
| SRCH-05 | Search and faceted filters | Sort by price, popularity, newest, or by an intent ("best for gaming", "best performance", "lightest", "thinnest") | laptopvslaptop.com (sort intents in the finder), smartprix.com (`Sort By`), mysmartprice.com | MVP | Intent sorts read the score table (`TEST-12`), not a free-text field |
| SRCH-06 | Search and faceted filters | Exclude out-of-stock products from a list | smartprix.com (`exclude_out_of_stock-stock` in the URL) | MVP | Filter state lives in the URL (`SRCH-10`) |
| SRCH-07 | Search and faceted filters | Ask "which laptops run game X" and get a list filtered by GPU requirement | laptopvslaptop.com (`/for/game/{slug}`, "Search Laptops by Game Requirements") | Later | Needs a game-requirements table and a GPU performance rank (`RANK-05`) |
| SRCH-08 | Search and faceted filters | See "Related searches" and "Most searched features" links under a list | smartprix.com (`Related Searches`, `Most Searched Features`) | MVP | Built from `analytics.search` events, not hand-written |
| SRCH-09 | Search and faceted filters | Keep filters when navigating back, and share a filtered list by URL | smartprix.com, mysmartprice.com | MVP | Every filter, sort and page is a URL parameter; no POST-only filtering |
| SRCH-10 | Search and faceted filters | Get an escape route when a list or facet page returns little or nothing: the active filters named, the count, and alternative entry links (popular brands, search by price, most searched features) | smartprix.com (`Popular Brands`, `Search By Price`, `Most Searched Features` fallback modules on facet and price-list pages), mysmartprice.com (brand/price/feature link blocks on pricelist pages) | MVP | Competitors ship generic fallback link blocks; naming the exact filter that emptied the list is this document's addition, so label it as ours in the UI copy |

### D. Price comparison, price history and price drops

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| PRICE-01 | Price comparison, price history and price drops | See every retailer offer for a laptop with price, stock status and delivery note | smartprix.com (Amazon/Flipkart rows with delivery), mysmartprice.com (`Prices` block per store), laptopvslaptop.com (Amazon list/lowest price) | MVP | Offers clamp to one variant (`DB-04`) — an offer is never for "the model", always for a SKU |
| PRICE-02 | Price comparison, price history and price drops | See the lowest current price and which retailer holds it | smartprix.com ("The lowest price is available at Amazon"), mysmartprice.com ("The lowest price … is Rs. 118,999 at Amazon") | MVP | Tie-break by retailer priority, then by freshest observation (11, decision 6) |
| PRICE-03 | Price comparison, price history and price drops | Know whether it is buyable now (In stock / Out of stock / Market status: Available) | smartprix.com (`OUT OF STOCK`), mysmartprice.com (`Market Status`), laptopvslaptop.com (`In stock`) | MVP | — |
| PRICE-04 | Price comparison, price history and price drops | Open a price-history chart for 1/3/6/12 months | smartprix.com (`Price History`) | MVP | 90-day backfill is the `MVP` default (11, decision 15); the chart must say how far back the data actually goes |
| PRICE-05 | Price comparison, price history and price drops | Read the change in words ("dropped 2% in the last month", "price last changed on 31 Oct 2026", "₹1,080 in one month") | smartprix.com | MVP | Computed from samples, never stored as prose |
| PRICE-06 | Price comparison, price history and price drops | Spot price-drop badges on cards, compare rows and lists | smartprix.com (drop % on cards), mysmartprice.com | Later | Depends on a stable history depth; do not badge the first 30 days of a new product |
| PRICE-07 | Price comparison, price history and price drops | See prices in a chosen currency/region | nanoreview.net (USD/GBP/EUR/CAD/AUD/SGD selector), laptopvslaptop.com (Amazon .com) | Later | Store amounts with a currency code and a conversion timestamp; never store a converted number as truth |
| PRICE-08 | Price comparison, price history and price drops | Enter a price and get a value-for-money index | nanoreview.net (`Value for money (Beta)`, `Avg. Price` + currency + `Value Index 72.4 (Good)`) | Later | Formula must be published (`REV-04`); a user-entered price is never shown as a real offer |
| PRICE-09 | Price comparison, price history and price drops | See how fresh a price is ("Price updated 6 h ago") | laptopvslaptop.com | MVP | Freshness is per offer, not per product |
| PRICE-10 | Price comparison, price history and price drops | Browse a deals hub of current discounts | smartprix.com (`/deals`), mysmartprice.com (festive deals hub) | Later | — |
| PRICE-11 | Price comparison, price history and price drops | Leave the site to a retailer through a tracked outbound link | smartprix.com (`l.smartprix.com/l?k=…` redirector), mysmartprice.com (`Go To Store`), laptopvslaptop.com (`?tag=lpvsl-20`), laptopmedia.com (`Buy Now`) | MVP | One internal redirect route so retailer tags, disclosure and click logging live in one place (`MON-01`) |
| PRICE-12 | Price comparison, price history and price drops | Compare prices with a browser extension while shopping elsewhere | mysmartprice.com (Chrome Web Store extension links) | Later | Out of scope for a web `MVP`; keep `PRICE-01` in a JSON endpoint so an extension is possible later |
| PRICE-13 | Price comparison, price history and price drops | Compare prices per retailer inside the comparison view | smartprix.com, mysmartprice.com, laptopvslaptop.com | MVP | Price is a spec row like any other, with `lower-is-better` direction (6.4) |

### E. Alerts and notifications

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| ALERT-01 | Alerts and notifications | Set a price alert on a product (any drop, or below a target price) | smartprix.com (`Set Price Alert`) | Later | Ship with price history (`PRICE-04`); the alert entity exists in `MVP` so history is retained from day one |
| ALERT-02 | Alerts and notifications | Receive the alert over email, browser push, or a messenger channel | smartprix.com (Telegram/WhatsApp channels), mysmartprice.com (`push_notification` module) | Later | One delivery abstraction, one channel in the first release (11, decision 10) |
| ALERT-03 | Alerts and notifications | See in-app notifications for alerts and site activity | rtings.com (`NotificationToaster` component) | Later | — |
| ALERT-04 | Alerts and notifications | Follow a product to be told about new variants, reviews or tests | rtings.com (`Review Pipeline` + notifications), smartprix.com (channel subscriptions) | Later | — |
| ALERT-05 | Alerts and notifications | Ask to be told when an out-of-stock product returns | smartprix.com (`OUT OF STOCK` + alert), mysmartprice.com (`Market Status`) | Later | Same entity as `ALERT-01`, different trigger |

### F. Expert and lab reviews

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| REV-01 | Expert and lab reviews | Read a long-form review of a specific model with a verdict and a rating | laptopmedia.com, rtings.com, smartprix.com, mysmartprice.com | MVP | Lengths differ by a factor of ten between sites; the `MVP` minimum is a verdict, a scorecard, pros/cons and the test tables |
| REV-02 | Expert and lab reviews | See a scorecard with subscores rather than one opaque number | rtings.com (per-test and per-usage scores), nanoreview.net (Performance/Gaming/Display/Battery/Connectivity/Portability), laptopmedia.com (per-chapter results) | MVP | — |
| REV-03 | Expert and lab reviews | Read pros and cons as separate lists | laptopmedia.com (`Pros`, `Cons`), rtings.com (verdict) | MVP | — |
| REV-04 | Expert and lab reviews | Open the methodology that produced any score, in one click from that score | rtings.com (test pages linked from every result), nanoreview.net (FAQ explains scoring, recalibration, verified specs), laptopmedia.com (independence and laboratory statement), smartprix.com (`/about/editorial-guidelines`) | MVP | Every score component links to its method section anchor; no orphan numbers |
| REV-05 | Expert and lab reviews | Browse an index of all reviews and filter it | rtings.com (`Review List`, `Review Index`), laptopmedia.com (`/review/`) | MVP | — |
| REV-06 | Expert and lab reviews | See which reviews are in progress / coming next | rtings.com (`Review Pipeline`) | Later | — |
| REV-07 | Expert and lab reviews | Check how the tested unit was obtained and that the site is editorially independent | laptopmedia.com ("products come from online stores", "fully independent company"), rtings.com ("187 Laptops bought and tested"), smartprix.com (editorial independence) | MVP | Store the unit source per review (`expert_review.unit_source`), not as site-wide prose only |
| REV-08 | Expert and lab reviews | Jump between chapters of a long review with a table of contents | laptopmedia.com (`Contents` with anchored chapters) | MVP | — |
| REV-09 | Expert and lab reviews | See who wrote a review, when it was published and updated, and which firmware/BIOS/config was tested | laptopmedia.com (configuration-specific reviews), rtings.com (test dates) | MVP | The tested configuration is part of the review's identity, not a footnote |
| REV-10 | Expert and lab reviews | Buy the reviewed unit from inside the review | laptopmedia.com (`Buy Now`), laptopvslaptop.com (Amazon box) | MVP | Same redirect route as `PRICE-11`; never inline an affiliate URL in prose |
| REV-11 | Expert and lab reviews | Read the corrections and data-error policy and report an error | nanoreview.net (data correction via comments/feedback, FAQ), smartprix.com (editorial guidelines) | MVP | — |

### G. Measured test data and scores

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| TEST-01 | Measured test data and scores | Read display measurements: max brightness (nits), contrast ratio, colour gamut (sRGB/DCI-P3/Adobe RGB %), colour accuracy (ΔE), uniformity, viewing angles, reflections | laptopmedia.com (colour coverage, brightness/contrast, uniformity, ΔE, viewing angles, reflectance), nanoreview.net (contrast, sRGB, DCI-P3, brightness), rtings.com (Contrast, Brightness, Colour Gamut, Out-Of-The-Box Colour Accuracy, Reflections) | MVP | `MVP` minimum: brightness, contrast, sRGB %, ΔE — the rest are `Later` columns in the same table |
| TEST-02 | Measured test data and scores | Read health-impact measurements: PWM frequency, blue-light share | laptopmedia.com (`Health Impact: PWM`, `Blue Light Emissions`, PWM ranking) | Later | Needs a measurement rig; keep the field in the schema now |
| TEST-03 | Measured test data and scores | Read battery life per scenario (web browsing, video playback, idle) and charge time | rtings.com (Battery Life (Web Browsing), Charge Time), laptopmedia.com (battery test), nanoreview.net (battery life rating, full charge time) | MVP | A single battery number is not acceptable; each scenario is its own `test` row |
| TEST-04 | Measured test data and scores | Read sustained-load behaviour: throttling, performance stability, surface temperatures | rtings.com (`Performance Stability`, `Thermals And Noise`), laptopmedia.com (temperature readings) | Later | — |
| TEST-05 | Measured test data and scores | Read fan noise under load in dB and compare it across products | rtings.com (`Fan Noise`), nanoreview.net (`Noise level (max. load) 53.2 dB`), laptopmedia.com (noise observations) | MVP | One scenario only in `MVP`: max load, measured at a stated distance — publish the distance |
| TEST-06 | Measured test data and scores | Read speaker loudness in dB and the frequency response | rtings.com (`Speakers`), nanoreview.net (`Loudness ~83.1 dB`), laptopmedia.com (`Sound Quality`) | Later | — |
| TEST-07 | Measured test data and scores | Read in-game FPS at stated quality presets per game | rtings.com (`FPS`, `CPU-Intensive Game Performance`, `GPU-Intensive Game Performance`), laptopmedia.com (`Gaming tests`), nanoreview.net (Gaming rating) | Later | Each game+preset is one test row; never average FPS across games without publishing the set |
| TEST-08 | Measured test data and scores | Read CPU benchmark results (Geekbench 6 single/multi, Cinebench 2024 single/multi) | nanoreview.net, laptopmedia.com | MVP | Record the benchmark version in the test definition — scores are not comparable across versions |
| TEST-09 | Measured test data and scores | Read GPU benchmark results (3DMark Time Spy Graphics, Wild Life Extreme Unlimited, Blender GPU, Solar Bay) | laptopmedia.com, nanoreview.net | MVP | Same versioning rule as `TEST-08` |
| TEST-10 | Measured test data and scores | Read storage performance (sequential/random throughput) | rtings.com (`Storage Drive Performance`), laptopmedia.com (`Storage Performance`) | Later | — |
| TEST-11 | Measured test data and scores | See a normalised 0–100 category score per capability, alongside the raw numbers | nanoreview.net (Performance/Gaming/Display/Battery/Connectivity/Portability + `NanoReview Score`), rtings.com (per-test 0–10 then usage scores) | MVP | The normalisation rule must be published and deterministic (section 7.2) |
| TEST-12 | Measured test data and scores | See usage-based ratings ("best for programming", "best for gaming") computed from the same measurements | rtings.com (usage scores feed the best-by-usage lists), nanoreview.net (`Primary usage` scenario picker re-scores both products) | MVP | Weights per scenario are versioned config, not code (7.3) |
| TEST-13 | Measured test data and scores | Understand that scores are relative and drift as new hardware lands | nanoreview.net (FAQ: "0-100 scoring system is relative and adjusts as new devices are released") | MVP | Store `scoring_model_version` on every score; show the model version and the date it was applied |
| TEST-14 | Measured test data and scores | Adjust rating weights to personal priorities | rtings.com (`Custom Ratings`) | Later | Personal overrides are computed at render time and labelled as such |
| TEST-15 | Measured test data and scores | Submit your own benchmark result for a model and see it after moderation | nanoreview.net (`Submit your benchmark results`, `Add your GPU benchmark result`, comments) | Later | Community data is a separate table from lab data; never silently merged into `test_result` |
| TEST-16 | Measured test data and scores | See the provenance of each measurement: date, sample size, firmware/BIOS, unit source, test rig | rtings.com, laptopmedia.com, nanoreview.net (`Verified specs`, average sample scores) | MVP | One provenance block per test result, mandatory (7.5) |
| TEST-17 | Measured test data and scores | Visualise measurements across products as a chart | rtings.com (`Graph`), nanoreview.net (per-row deltas) | Later | Charts must be available as a table too (accessibility, 9.3) |
| TEST-18 | Measured test data and scores | Pull the full test database into one sortable table of all tested models | rtings.com (`Table Tool`) | Later | Also feeds `CMP-15` |

### H. Rankings and best-of lists

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| RANK-01 | Rankings and best-of lists | Open a curated list for a budget ("best laptop under ₹60,000") with a shortlist and a reason per pick | smartprix.com (price lists), mysmartprice.com (`/computer/pricelist/laptops-under-60000-price-list-in-india.html`), laptopvslaptop.com (`best-budget-laptops`), rtings.com (`by-price/under-500`) | MVP | The page is both a ranking and an SEO landing page (`SEO-03`); one page, two jobs |
| RANK-02 | Rankings and best-of lists | Open a best-by-use-case list (gaming, college, business, programming, video editing, photo editing, music production, work from home) | rtings.com (`best/by-usage/{usage}`), mysmartprice.com (best laptops for students), laptopvslaptop.com (`best-gaming-laptops`) | MVP | Each list states its scoring weights and update date (`RANK-09`) |
| RANK-03 | Rankings and best-of lists | Open a best-by-brand or best-by-form-factor list | laptopvslaptop.com (`best-acer-laptops`, `best-2-in-1-laptops`), rtings.com (`best/brands`, `best/by-type/2-in-1`) | MVP | — |
| RANK-04 | Rankings and best-of lists | See where a product sits in its group and overall ("Group Rank #98/178", "Overall Rank #1547/1902") | smartprix.com | MVP | Group = price band + form factor; the group definition must be printed on the page |
| RANK-05 | Rankings and best-of lists | Open component rankings (laptop CPU ranking, laptop GPU ranking, AI performance, PWM ranking, battery-life top 100, best screens, price/performance deals) | laptopmedia.com (all of the above), nanoreview.net (`/en/cpu-list/laptop-chips-rating`, `/en/gpu-list/laptop-graphics-rating`) | Later | — |
| RANK-06 | Rankings and best-of lists | See "popular right now" and "newest laptops" lists | laptopvslaptop.com (`/laptops/popular`, `/laptops/newest`), smartprix.com (`Latest Laptops`, `New Mobiles` pattern) | MVP | Popularity = event counter, newest = release date; both must print their window ("last 30 days") |
| RANK-07 | Rankings and best-of lists | See a top-10 style list with explicit positions | mysmartprice.com (`top-10-laptops-price-list-in-india.html`), laptopmedia.com (`Top 100 …`) | MVP | Position is stored, not implied by DOM order |
| RANK-08 | Rankings and best-of lists | Browse announced/upcoming models | smartprix.com (`Upcoming` module, verified for phones), mysmartprice.com (`upcoming` price lists) | Later | Laptop equivalent not verified in the studied pages — treat as an extension, keep `status` on the product |
| RANK-09 | Rankings and best-of lists | Read how a ranking was produced and when it was last updated | rtings.com (best lists publish criteria), laptopmedia.com (ranking pages disclose the metric) | MVP | Mandatory block on every ranking page |
| RANK-10 | Rankings and best-of lists | See award labels per list ("top pick", "best value", "best budget") with a one-line justification | rtings.com (best-list picks), laptopvslaptop.com (`Laptop summary`) | MVP | Award is a relation between a ranking list and a product, not a product field |

### I. Buying guides, news and editorial

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| EDIT-01 | Buying guides, news and editorial | Read the news hub, filtered by category | smartprix.com (`Bytes`), mysmartprice.com (`News & Reviews`), laptopmedia.com (`Market`) | Later | — |
| EDIT-02 | Buying guides, news and editorial | Read a buying guide that explains what to look for, with product picks | mysmartprice.com (buying guides), laptopmedia.com (`Guides`), laptopvslaptop.com (category explainers) | MVP | Guides reuse product cards and compare buttons (`CMP-01`) |
| EDIT-03 | Buying guides, news and editorial | Read a deals roundup with current prices | smartprix.com, mysmartprice.com (`Festive Deals & Buying Guides`), laptopmedia.com (`Top 100 Best Gaming Laptop Deals`) | Later | Prices in articles must render live from `offer`, never be pasted as text |
| EDIT-04 | Buying guides, news and editorial | Read an article page with hero media, table of contents, author and related links | smartprix.com, mysmartprice.com, laptopmedia.com | MVP | One article template for news, guides and reviews' prose body |
| EDIT-05 | Buying guides, news and editorial | See related news, related products and related searches on product and comparison pages | smartprix.com (`Related News`, `Related Laptops`, `Related Searches`) | MVP | — |
| EDIT-06 | Buying guides, news and editorial | Read the editorial independence and disclosure pages | smartprix.com (`/about/editorial-guidelines`), laptopmedia.com (independence statement), rtings.com (membership + affiliate disclosure) | MVP | Linked from the footer and from every affiliate click surface |
| EDIT-07 | Buying guides, news and editorial | Subscribe to a feed | smartprix.com (`/bytes/feed/`), rtings.com (`/latest-rss.xml`) | Later | — |
| EDIT-08 | Buying guides, news and editorial | Read data-driven market posts (bestseller rankings, GPU share) | laptopmedia.com (`Market` analysis posts) | Later | Needs order/market data you will not have in `MVP` |
| EDIT-09 | Buying guides, news and editorial | Compare two products in article form ("X vs Y — what are the differences") | laptopmedia.com (`Comparisons`, `Highlights` vs articles) | MVP | The article links to the live comparison route instead of duplicating the table |

### J. Community (ratings, reviews, comments, Q&A)

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| COMM-01 | Community | See an average star rating with a rating count on cards and product pages | smartprix.com (`4.3 · 115 ratings`), mysmartprice.com (`● 4.2/5 · 6,108 Ratings`) | MVP | Aggregate is stored, individual reviews are a separate table; show the count next to the average always |
| COMM-02 | Community | See the rating distribution (5★ 59 %, 4★ 22 %, …) | mysmartprice.com | MVP | — |
| COMM-03 | Community | Write a user review with a rating, title, body, ownership period and pros/cons | smartprix.com (`WRITE A REVIEW`), mysmartprice.com (user ratings) | Later | Needs accounts (`ACCT-01`) and moderation (`COMM-05` policy) |
| COMM-04 | Community | Discuss a product or a comparison in a thread, with like/comment/share controls | smartprix.com (`Discuss`, `Like`, `Comment`, `Share`) | Later | — |
| COMM-05 | Community | Comment on an article or comparison with replies, under moderation | nanoreview.net (comments with replies, "why didn't my comment appear" FAQ), laptopmedia.com (`#comments`), rtings.com (`Discussions`) | Later | Pre-moderation is the default (11, decision 9) |
| COMM-06 | Community | Have a commenter profile with history and reputation | nanoreview.net ("Register your profile and become part of NanoReview community") | Later | — |
| COMM-07 | Community | Report wrong data or request a missing model from a form | nanoreview.net (feedback form), laptopmedia.com (`Contact Us`), smartprix.com (`About / Contact`) | MVP | Writes to a moderation queue, no account needed; this is `DB-14`'s backend |
| COMM-08 | Community | Vote on "which one is better" for a pair | nanoreview.net (FAQ: "Why do voting results sometimes completely oppose the final score?", "Do my votes or comments influence the scores?"; vote counts shown on competitor pairs), rtings.com (`Vote`) | Later | Votes never feed the published score (`TEST-11`) and must be labelled as opinion |
| COMM-09 | Community | Ask and answer a question on a product page | smartprix.com (`Discuss` thread implies Q&A), laptopmedia.com (comments) | Later | Not observed as a distinct Q&A form on any studied page — this is the implied control the Issue asks to keep, keep it `Later` until the owner confirms shape |

### K. Accounts and personalisation

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| ACCT-01 | Accounts and personalisation | Sign up / log in with email or Google, and reset a forgotten password | smartprix.com (`Login`, `Sign in with Google`, `Forgot Password`), nanoreview.net (`Log in`, register) | Later | Not required for compare or alerts by email |
| ACCT-02 | Accounts and personalisation | Save products to a wishlist / "save for later" | laptopvslaptop.com (`Save for later`) | Later | — |
| ACCT-03 | Accounts and personalisation | Save a comparison and come back to it | smartprix.com (`Like` on a comparison), laptopvslaptop.com (saved product) | Later | The shareable URL (`CMP-10`) covers the anonymous case; accounts add a list |
| ACCT-04 | Accounts and personalisation | Manage your own reviews, comments and votes from a profile | nanoreview.net (profile, comments) | Later | — |
| ACCT-05 | Accounts and personalisation | Keep a comparison tray across pages and reloads without an account | smartprix.com, mysmartprice.com, laptopvslaptop.com (all work anonymously) | MVP | Persist in the URL plus local storage; cap at the compare maximum (6.1) |

### L. SEO landing pages and URL structure

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| SEO-01 | SEO landing pages and URL structure | Land on a readable product URL that contains brand, model and model code | smartprix.com (`/laptops/hp-15-250r-g10-laptop-intel-core-3-100u-16gb-ppd1xqbaao1k`), mysmartprice.com (`/computer/acer-swift-14-ai-…-laptop-msf1002056`), laptopvslaptop.com (`/laptop/Lenovo-Yoga-7i-…/115971a`), laptopmedia.com (`/review/hp-omnibook-3-…`) | MVP | Stable ids may be appended (`-ppd…`, `-msf…`) but the readable part must not change when a title is edited |
| SEO-02 | SEO landing pages and URL structure | Land on a readable comparison URL that encodes both/all products | smartprix.com (`…_vs_…-cpd…_pd….php`), mysmartprice.com (`/compare-laptops/a-msf1-vs-b-msf2`), nanoreview.net (`/en/laptop-compare/a-vs-b`), laptopvslaptop.com (`/compare/A/B/115971a/142874a/`) | MVP | See 6.6 for the exact contract; one canonical order for each set |
| SEO-03 | SEO landing pages and URL structure | Land on a facet-targeted page: budget bucket, brand, CPU family, RAM, storage, screen size, GPU, use case | smartprix.com (`/laptops/asus-brand/price-60000_to_75000`), mysmartprice.com (`/computer/pricelist/…`), laptopvslaptop.com (`/best-gaming-laptops`), rtings.com (`/laptop/reviews/best/by-usage/college`) | MVP | Indexable pages are a *curated subset* of facets; everything else is noindex (9.1) |
| SEO-04 | SEO landing pages and URL structure | Get the same canonical page when filters/sort are applied | smartprix.com, mysmartprice.com (canonical on product and list pages) | MVP | Sort parameters canonicalise to the unsorted URL; filter combinations canonicalise per 9.1 |
| SEO-05 | SEO landing pages and URL structure | See a breadcrumb trail (Home › Laptops › Brand › Model) | smartprix.com, mysmartprice.com, laptopvslaptop.com, laptopmedia.com, rtings.com (all with BreadcrumbList JSON-LD) | MVP | Breadcrumb is also the structured-data source |
| SEO-06 | SEO landing pages and URL structure | Get rich results for products, ratings, reviews and articles | smartprix.com (Product + 2× AggregateRating + BreadcrumbList), mysmartprice.com (same), laptopvslaptop.com (Product + BreadcrumbList), rtings.com, laptopmedia.com (2× JSON-LD + BreadcrumbList) | MVP | Product, AggregateRating, Review, BreadcrumbList, Article, ItemList, FAQPage where truthful (9.1) |
| SEO-07 | SEO landing pages and URL structure | Have every product, comparison and list crawled | smartprix.com (`/sitemaps/in/sitemap.xml`, news sitemap), mysmartprice.com (`/sitemap.xml`), laptopvslaptop.com (`/sitemap.xml`) | MVP | Sitemap index + segmented sitemaps (products, comparisons, lists, articles) with `lastmod` |
| SEO-08 | SEO landing pages and URL structure | Land on the right language edition | laptopmedia.com (16 country editions), smartprix.com (Hindi edition) | Later | hreflang pairs are required when `LOC-02` ships |
| SEO-09 | SEO landing pages and URL structure | Follow auto-generated related links to neighbouring products and searches | smartprix.com (`Related Laptops`, `Related Searches`) | MVP | Generated from spec similarity + search log, capped and deduplicated |
| SEO-10 | SEO landing pages and URL structure | Page through a long list with crawlable links | smartprix.com, mysmartprice.com | MVP | Real `<a href>` pagination with a stable page size; no infinite scroll as the only path |

### M. Media

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| MEDIA-01 | Media | Browse a product image gallery with thumbnails and a larger view | mysmartprice.com (`View Gallery`), smartprix.com (product imagery on the model page) | MVP | Images are licensed or shot yourself; never hot-link a competitor or retailer CDN |
| MEDIA-02 | Media | See photos of the actually-tested unit in a review | laptopmedia.com (per-chapter photos), rtings.com (design photos per review) | MVP | Tied to `REV-09` (tested unit), so photo and unit id are stored together |
| MEDIA-03 | Media | Watch a video review | smartprix.com (site-wide YouTube channel), rtings.com (video presence) | Later | Only outbound channel links were verified; no embedded player was observed on the studied pages |
| MEDIA-04 | Media | Read charts as data, not only as images (price history, benchmark bars) | smartprix.com (price-history chart), rtings.com (`Graph`) | MVP | Every chart ships a data table and a text summary (9.3) |
| MEDIA-05 | Media | Follow the site on its channels | smartprix.com (YouTube, Instagram, Telegram, WhatsApp, X), mysmartprice.com (X, Facebook) | Later | — |
| MEDIA-06 | Media | Install the mobile app | smartprix.com (app promotion in the header), mysmartprice.com (Play Store) | Later | Out of scope while there is no app |

### N. Localisation

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| LOC-01 | Localisation | Switch market/region to change currency, retailers and price buckets | smartprix.com (India/US editions), nanoreview.net (currency selector), laptopmedia.com (country selector), laptopvslaptop.com (Amazon .com prices) | Later | `MVP` is single-market; store `market` on offer and price point so switching is data-only |
| LOC-02 | Localisation | Read the site in another language | laptopmedia.com (`/de/`, `/fr/`, `/it/`, `/es/`, `/pl/`, `/nl/`, `/hu/`, `/bg/`, `/gr/`, `/cn/`, `/jp/`, `/au/`, `/be/`, `/ca/`, `/gb/`, `/in/`), smartprix.com (`/bytes/hi/`) | Later | URL prefix per locale from day one (`/{locale}/…`) so translations do not need a redirect map later |
| LOC-03 | Localisation | See prices formatted the local way, including bucket boundaries | smartprix.com, mysmartprice.com | MVP | Bucket boundaries are configuration per market, not strings in templates |
| LOC-04 | Localisation | See dimensions in metric and imperial at once | laptopvslaptop.com (inches + cm), laptopmedia.com (metric + US customary), nanoreview.net (mm and inches) | MVP | Both units are rendered server-side; no client-side conversion as the only source |

### O. Monetisation surfaces

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| MON-01 | Monetisation surfaces | Click a retailer link that carries an affiliate tag and a visible disclosure | smartprix.com (`l.smartprix.com/l?k=…`), mysmartprice.com (`Go To Store`), laptopvslaptop.com (`?tag=lpvsl-20` + "As an Amazon Associate we earn from qualifying purchases"), laptopmedia.com (`Buy Now`, rtings.com disclosure text) | MVP | One redirect endpoint (`/go/{offer_id}`), one disclosure component, retailer tags in config |
| MON-02 | Monetisation surfaces | See clearly-labelled display ad slots that do not displace the comparison table | mysmartprice.com (ad slots), laptopmedia.com (~80 ad slots on a review page) | MVP | Slots are defined in the layout with fixed reserved height (no layout shift); network selection is the owner's |
| MON-03 | Monetisation surfaces | See sponsored placements labelled as sponsored, kept separate from editorial lists | mysmartprice.com (sponsored retailer row in the price box) | Later | Never inside a ranking list; `RANK-09` explains the policy |
| MON-04 | Monetisation surfaces | Support the site with a membership and get early access | rtings.com (membership, early access, paywall flags) | Later | — |
| MON-05 | Monetisation surfaces | Buy an extra digital product (display calibration profiles) | laptopmedia.com (`LaptopMedia Profiles`, discount bundle) | Later | — |
| MON-06 | Monetisation surfaces | Subscribe to a deals/price-drop feed | smartprix.com (channels), mysmartprice.com (push) | Later | Same delivery abstraction as `ALERT-02` |
| MON-07 | Monetisation surfaces | Find how to advertise on the site | mysmartprice.com (`/advertise/`) | Later | Static page only |
| MON-08 | Monetisation surfaces | Receive a newsletter | smartprix.com, laptopmedia.com | Later | — |

### P. Guided finder and decision tools

| Id | Capability area | What the user can do | Source domain(s) | Priority | Variant note |
| --- | --- | --- | --- | --- | --- |
| FIND-01 | Guided finder and decision tools | Answer a short quiz (budget, intent, screen size, CPU, GPU, OS, brand) and get a shortlist | laptopvslaptop.com (`/laptop-finder`, "Quiz: What are you looking for?") | Later | Same filter engine as `SRCH-03`/`SRCH-05`; the quiz is a UI over it, not a second data source |
| FIND-02 | Guided finder and decision tools | Start from a game and get laptops that meet its requirements | laptopvslaptop.com (`/for/game/{slug}`) | Later | Shares the requirements table with `SRCH-07` |
| FIND-03 | Guided finder and decision tools | Pick a usage scenario and have the comparison re-scored for that scenario | nanoreview.net (`Primary usage`: Balanced, Gaming, Programming, Video Editing, Business, Study, Multimedia, Travel-Friendly) | MVP | Scenario weights are the same versioned config as `TEST-12` |
| FIND-04 | Guided finder and decision tools | Get a value-for-money index from price plus scores | nanoreview.net (`Value Index 72.4 (Good)`) | Later | Depends on `PRICE-04` depth and `PRICE-08`; formula published |
| FIND-05 | Guided finder and decision tools | See similar/alternative laptops on a product page | smartprix.com (`Related Laptops`, `Compared With`), mysmartprice.com (`Alternatives`), laptopvslaptop.com ("Compare vs other laptops"), nanoreview.net (`Comparison with competitors`) | MVP | Similarity = spec distance + price distance + form factor; explain the basis in a tooltip |
| FIND-06 | Guided finder and decision tools | Understand what to do on an empty comparison page | laptopvslaptop.com ("Pick two laptops", three-step explainer), nanoreview.net ("Select two laptops and click Compare") | MVP | First-run empty state, not an error state (4.2) |

### Inventory totals

| Priority | Rows |
| --- | --- |
| `MVP` | 95 |
| `Later` | 60 |
| **Total** | **155** |

Rows per capability area (every required area has at least one row):

| Area | Rows | Area | Rows |
| --- | --- | --- | --- |
| A product database and specs | 14 | I buying guides, news and editorial | 9 |
| B comparison engine | 17 | J community | 9 |
| C search and faceted filters | 10 | K accounts and personalisation | 5 |
| D price comparison, price history, price drops | 13 | L SEO landing pages and URL structure | 10 |
| E alerts and notifications | 5 | M media | 6 |
| F expert and lab reviews | 11 | N localisation | 4 |
| G measured test data and scores | 18 | O monetisation surfaces | 8 |
| H rankings and best-of lists | 10 | P guided finder and decision tools | 6 |

---

## 4. Page and route inventory

Route conventions used below:

- `{slug}` is a lowercase hyphenated token that ends in a stable id (model code, pair hash) and
  never changes when a title is edited (`SEO-01`).
- `{locale}` is an optional prefix reserved from day one (`/en/…`) but only the default locale is
  served in `MVP` (`LOC-02`). All routes below are shown without the prefix.
- Every list route accepts `?page=`, `?sort=`, and filter parameters, and every one of those is a
  crawlable link (`SRCH-09`, `SEO-10`).
- Each screen must define three states: **loading** (skeleton that reserves height), **empty**
  (explains why nothing is there and offers the next action), **error** (what failed, what still
  works, a retry control). A screen is not done until all three exist.

### 4.1 Public screens

| # | Screen | Purpose | URL pattern | Main components | Loading state | Empty state | Error state |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4.1.1 | Home | Route to the four jobs in section 2 | `/` | search bar with autosuggest (`SRCH-01`), budget entry chips (under X), popular comparisons (`CMP-14`), popular/newest laptops (`RANK-06`), best-of picks (`RANK-02`), editorial teasers | hero + card skeletons | never empty: falls back to newest laptops | "Some sections are unavailable" banner; search and browse still work |
| 4.1.2 | Laptop list | Browse the whole catalogue with facets | `/laptops` | facet rail (`SRCH-03`), sort control (`SRCH-05`), result grid with compare checkboxes (`CMP-01`), pagination (`SEO-10`) | facet skeleton + card skeletons | "No laptops match these filters" + one-click "remove the narrowest filter" (`SRCH-10`) | facet service down: show results without facets + retry |
| 4.1.3 | Brand list | All models of one brand | `/laptops/{brand}` | header, facet rail scoped to brand, grid, brand facts (model count, price range) | as 4.1.2 | "No models yet for this brand" + link to other brands | 404 if brand unknown; 500 with retry otherwise |
| 4.1.4 | Budget list | All models inside a price band | `/laptops/price/under/{amount}`, `/laptops/price/between/{min}-{max}` | same as 4.1.2, price band header with count and update date | as 4.1.2 | "Nothing in this band today" + nearest bands | band outside market config: 404 with suggested bands |
| 4.1.5 | Curated list ("best of") | Ranked shortlist for a use case, budget or form factor | `/best/{slug}` (e.g. `/best/under-60000`, `/best/gaming`, `/best/college`) | intro, award picks (`RANK-10`), ranked rows with reasons, criteria + update date (`RANK-09`), related lists | ranked-row skeletons | "This list is being rebuilt" + link to the live list it derives from | stale list: show it with a "last updated" warning rather than an error |
| 4.1.6 | Best-of hub | Index of all curated lists | `/best` | grouped list links, counts, last-updated dates | link skeletons | — | full-page error with retry |
| 4.1.7 | Product page | The canonical model page | `/laptop/{brand-model-slug}-{code}` | identity header (brand, line, code, release, lowest price), price box (`PRICE-01`…`PRICE-05`), quick specs with qualifiers (`DB-03`), spec groups (`DB-02`), gallery (`MEDIA-01`), score summary (`TEST-11`), lab tab, review tab, community tab (`COMM-01`), alternatives (`FIND-05`), related content (`EDIT-05`), add-to-compare (`CMP-01`), price alert button (`ALERT-01`) | section-level skeletons, price box last | new model without offers: "No offers yet" + alert CTA; without tests: "Not tested yet" + link to reviews | prices unavailable: keep specs, mark the price box "prices temporarily unavailable" |
| 4.1.8 | Product lab tab | Measurements and scores for one model | `/laptop/{slug}/tests` | test-group tables (`TEST-01`…`TEST-10`), per-row provenance (`TEST-16`), chart/table toggle (`MEDIA-04`), methodology links (`REV-04`) | table skeletons | "Not tested yet" + test-request CTA | partial data: render rows you have, mark missing tests "not measured" |
| 4.1.9 | Product specs tab | Full spec sheet | `/laptop/{slug}/specs` | grouped spec tables (`DB-02`), per-row help (`DB-08`), units (`LOC-04`), variants switch (`DB-04`) | skeleton | "Vendor has not published a spec sheet" + feedback form (`DB-14`) | render what exists, flag the group that failed |
| 4.1.10 | Product prices tab | Offers and history | `/laptop/{slug}/prices` | offer table (`PRICE-01`, `PRICE-03`, `PRICE-09`), lowest-price callout (`PRICE-02`), history chart with range switch (`PRICE-04`), change summary (`PRICE-05`), alert CTA (`ALERT-01`) | chart + table skeletons | "No retailer carries this variant" + nearest variant | "Price feed delayed — last successful update {time}" |
| 4.1.11 | Product reviews tab | Expert and user reviews for one model | `/laptop/{slug}/reviews` | expert review cards (`REV-01`), rating histogram (`COMM-02`), user review list, write-review CTA (`COMM-03`) | card skeletons | "No reviews yet" + "be the first" | moderation service down: show expert reviews only |
| 4.1.12 | Compare builder | Start a comparison from nothing | `/compare` | N slot pickers with autosuggest (`CMP-02`), recent comparisons (`CMP-14`), how-it-works explainer (`FIND-06`) | picker skeleton | the explainer *is* the empty state | autosuggest down: plain model-code search still works |
| 4.1.13 | Compare view | The decision screen | `/compare/{slugA}-vs-{slugB}` (and `-vs-{slugC}`, `-vs-{slugD}`) | header with product cards, verdict paragraph (`CMP-07`), tabs Overview/Specs/Competitors/Ratings (`CMP-17`), differences-only toggle (`CMP-04`), winner highlighting with reasons (`CMP-05`), deltas (`CMP-06`), price row (`PRICE-13`), config selectors (`CMP-11`), add/replace/remove controls (`CMP-08`, `CMP-09`), share control (`CMP-10`), suggested opponents (`CMP-12`), related reading (`EDIT-05`) | column skeletons with spec-row placeholders of fixed height (no layout shift) | fewer than two products in the URL: redirect to the builder with the parsed products kept | one product id unknown: keep the valid columns, banner names the bad one, offer removal |
| 4.1.14 | Comparison landing (SEO) | Human-readable entry to popular pairs | `/compare/{slugA}-vs-{slugB}` is the same route; a curated index lives at `/compare/popular` | popular pairs by category, counts, last-updated dates | skeleton | "No popular comparisons yet" | full-page error with retry |
| 4.1.15 | Review index | All reviews, filterable | `/reviews` | filters (type, brand, score band, date), review cards (`REV-01`) | card skeletons | "No reviews match" + clear filters | full-page error with retry |
| 4.1.16 | Review article | One long-form review | `/review/{slug}` | verdict box, scorecard (`REV-02`), pros/cons (`REV-03`), table of contents (`REV-08`), tested-unit block (`REV-09`, `REV-07`), chapter body with test tables, gallery (`MEDIA-02`), buy box (`REV-10`), methodology links (`REV-04`), comments (`COMM-05`) | article skeleton | n/a (an article is never empty) | partial render: body without test tables, with a note and a link to the lab tab |
| 4.1.17 | Guides hub | Buying guides and explainers | `/guides` | category chips, guide cards | skeletons | "No guides yet" | full-page error with retry |
| 4.1.18 | Guide article | One guide | `/guides/{slug}` | same template as 4.1.16 without the scorecard; embedded product cards keep prices live (`EDIT-03`) | skeleton | n/a | as 4.1.16 |
| 4.1.19 | News hub | Editorial feed | `/news` | categories, cards, pagination | skeletons | "Nothing published yet" | full-page error with retry |
| 4.1.20 | News article | One news item | `/news/{slug}` | article template, related products | skeleton | n/a | as 4.1.16 |
| 4.1.21 | Search results | Cross-type search | `/search?q={query}` | result groups with counts (`SRCH-02`), filters, "did you mean" | skeleton with count placeholders | "No results for {q}" + suggestions + report-a-model link (`DB-14`) | search backend down: banner + browse links; suggestions still work from cache |
| 4.1.22 | Component page | All laptops with a given CPU/GPU | `/cpu/{slug}`, `/gpu/{slug}` | component specs, benchmark summary (`TEST-08`, `TEST-09`), laptop list | skeleton | "No laptops recorded with this component yet" | full-page error with retry |
| 4.1.23 | Methodology hub | How every score is produced | `/methodology` | test list with anchors, scoring model version (`TEST-13`), rig and conditions, provenance rules (`TEST-16`), change log | static | n/a | static fallback text always rendered server-side |
| 4.1.24 | Methodology detail | One test or one score | `/methodology/{test-key}` | definition, unit, direction, conditions, sample-size rule, limitations | static | n/a | 404 for unknown key with a link to the hub |
| 4.1.25 | Editorial policy | Independence, corrections, disclosure | `/about/editorial`, `/about/corrections`, `/disclosure` | policy text, contact for corrections | static | n/a | static |
| 4.1.26 | About / contact | Who runs the site | `/about`, `/contact` | text, contact form (`COMM-07`) | static | n/a | form failure: mailto fallback shown inline |
| 4.1.27 | Outbound redirect | Affiliate click handling | `/go/{offer_id}` | no UI: validates, logs, 302s to the retailer | n/a | n/a | expired/disabled offer → 302 to the product page with a "that retailer link expired" notice |
| 4.1.28 | Sign-in / sign-up | Accounts | `/login`, `/signup` (`Later`) | email + OAuth, reset link | static | n/a | wrong credentials inline error; provider failure message |
| 4.1.29 | Saved items | Wishlist and saved comparisons | `/saved` (`Later`) | tabs: laptops, comparisons, alerts (`ACCT-02`, `ACCT-03`, `ALERT-01`) | skeletons | "Nothing saved yet" + link to browse | sign-in required → redirect that returns to `/saved` |
| 4.1.30 | Alerts | Manage price alerts | `/alerts` (`Later`) | alert list with target price, current price, state, delete | skeletons | "No alerts yet" + how to create one | delivery failures surfaced per alert |
| 4.1.31 | Errors | 404 / 500 / maintenance | any unmatched path, and `/500` | message, search box, top links, request id | n/a | n/a | 500 shows the request id and a retry |
| 4.1.32 | Crawl files | Sitemaps and robots | `/robots.txt`, `/sitemap.xml`, `/sitemap-{type}-{n}.xml` | XML only | n/a | n/a | static |

### 4.2 Route → feature coverage

- A visitor can reach the comparison engine from `/`, `/laptops`, any product page, any curated
  list and any article (`CMP-01`).
- Every score renders next to a link to `/methodology/{test-key}` (`REV-04`).
- Every outbound retailer link goes through `/go/{offer_id}` (`PRICE-11`, `MON-01`).
- Every indexable list and compare route exists as static HTML with a canonical (`SEO-04`).

---

## 5. Data model

Rules that apply to all entities:

- Every entity has `id` (stable, opaque), `created_at`, `updated_at`.
- Money is `{amount_minor: integer, currency: ISO-4217}` — never a float, never a pre-formatted
  string.
- A measurement is `{value: number, unit: enum, condition_key: string}` — a bare number is invalid.
- Anything editorial that can change (`title`, `verdict`, `score`) is versioned or dated so a
  cached page can say what it showed.
- Soft-delete (`deleted_at`) on anything a URL may still point at; hard deletes only for
  transient rows (price samples older than retention).

### 5.1 `brand`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `slug` | string, unique | URL segment (`asus`, `lenovo`) |
| `name` | string | `ASUS` — display form is per brand, do not title-case automatically |
| `logo_media_id` | id → `media` | licensed asset only |
| `description` | text | editorial |
| `is_active` | bool | hides the brand from facets without breaking URLs |

### 5.2 `model` (a product line generation, e.g. "IdeaPad Slim 3 15IRU8")

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `brand_id` | id → `brand` | |
| `series_id` | id → `series`, nullable | `Later` (`DB-06`) |
| `name` | string | "IdeaPad Slim 3 15IRU8" |
| `category` | enum | `laptop` in `MVP`; enum reserved for `phone`, `tablet`, `monitor` (`Later`) |
| `year` | int | model year, not release year |
| `form_factor` | enum | `clamshell`, `convertible`, `detachable`, `chromebook`, `gaming` |
| `release_date` | date | |
| `status` | enum | `announced`, `available`, `discontinued` (`RANK-08`) |

### 5.3 `product` (the entity a user opens and compares — one SKU family page)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `model_id` | id → `model` | |
| `slug` | string, unique | readable part of the URL (`SEO-01`) |
| `model_code` | string | manufacturer part number, indexed and searchable (`DB-05`) |
| `display_name` | string | "Lenovo IdeaPad Slim 3 82X70034IN (13th Gen Core i3/8GB/512GB SSD/Win11)" |
| `config_summary` | json | denormalised CPU/RAM/storage/OS for titles |
| `launch_price` | money, nullable | |
| `lowest_price` | money, nullable | derived cache of `offer` — never authoritative |
| `lowest_price_updated_at` | timestamp | freshness of the cache (`PRICE-09`) |
| `market_status` | enum | `available`, `out_of_stock`, `discontinued`, `announced` (`PRICE-03`) |
| `specs_completeness` | int 0–100 | share of required spec keys populated (`DB-10`) |
| `verified` | bool, `verified_at`, `verified_by` | `DB-09` (`Later`) |
| `primary_media_id` | id → `media` | |
| `description` | text | editorial, never vendor copy |

### 5.4 `variant` (the SKU that offers and tests actually point at)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `product_id` | id → `product` | |
| `code` | string | vendor SKU |
| `cpu_id` | id → `component` | |
| `gpu_id` | id → `component`, nullable | integrated or discrete |
| `ram_gb` | int | `16` |
| `storage_gb` | int | `512` |
| `storage_type` | enum | `ssd`, `emmc`, `hdd` |
| `os` | string | `Windows 11 Home` |
| `screen_size_in` | decimal | |
| `is_default` | bool | which variant a bare product URL opens |

### 5.5 `spec_group` and `spec_key` (the taxonomy that makes comparison possible)

`spec_group`: `key` (`display`, `processor`, `memory`, `storage`, `battery`, `connectivity`,
`input`, `audio`, `software`, `warranty`, `general`), `label`, `order`, `category`.

`spec_key`:

| Field | Type | Notes |
| --- | --- | --- |
| `key` | string, unique | `display.brightness_max` — stable, never renamed (alias table instead) |
| `group_key` | string → `spec_group.key` | |
| `label` | string | "Max brightness" |
| `value_type` | enum | `number`, `text`, `bool`, `enum` |
| `unit` | enum, nullable | `nits`, `mm`, `cm`, `inches`, `kg`, `g`, `lb`, `dB`, `dB(A)`, `Wh`, `GB`, `TB`, `GiB`, `MHz`, `GHz`, `Hz`, `fps`, `points`, `MB/s`, `IOPS`, `°C`, `ΔE`, `%`, `ms`, `minutes` |
| `unit_family` | enum, nullable | `length`, `mass`, `volume_energy`, `sound`, `storage`, `frequency`, `time`, `ratio`, `brightness`, `resolution`, `temperature`, `colour_delta`, `rate`, `count` — every unit in 7.1 belongs to exactly one family, and a value is comparable only inside its family (6.2). `rate` (MB/s, IOPS, fps) and `count` (points, ports) carry no cross-unit conversion |
| `direction` | enum | `higher_better`, `lower_better`, `neutral` — drives 6.4 |
| `comparable` | bool | `false` for prose fields |
| `help_text` | text | `DB-08` tooltip |
| `qualifier_buckets` | json, nullable | editorial thresholds for `DB-03` |

### 5.6 `spec_value`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `product_id` or `variant_id` | id | at least one required; variant wins when both |
| `spec_key` | string → `spec_key.key` | |
| `state` | enum | `present`, `not_disclosed`, `absent` (`DB-10`) |
| `value_number` / `value_text` / `value_bool` | typed, nullable | exactly one non-null when `state = present` |
| `unit` | enum, nullable | must be convertible within `unit_family` |
| `raw_value` | string | what the vendor actually wrote ("Upto 12 hours") |
| `source` | enum | `vendor_spec_sheet`, `editorial`, `lab_measurement` |
| `source_url` | url, nullable | provenance |
| `confidence` | enum | `verified`, `unverified`, `conflicting` (`DB-09`) |

### 5.7 `retailer`, `offer`, `price_point`, `price_sample`

`retailer`: `id`, `slug`, `name`, `affiliate_program` (nullable), `market`, `logo_media_id`,
`is_active`, `disclosure_key`.

`offer`:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | used in `/go/{offer_id}` |
| `variant_id` | id → `variant` | an offer is for a SKU, never for a model (`PRICE-01`) |
| `retailer_id` | id → `retailer` | |
| `url` | url | raw product URL, transformed into the affiliate link at redirect time |
| `price` | money | |
| `list_price` | money, nullable | for discount display |
| `in_stock` | bool | |
| `delivery_note` | string, nullable | "FREE Delivery 4-6 Business Days" |
| `observed_at` | timestamp | freshness (`PRICE-09`) |
| `state` | enum | `active`, `expired`, `disabled`, `sponsored` (`MON-03`) |

`price_point`: one row per (variant, retailer, calendar day) with `price` = the last observed
price of that day, `min_price`, `max_price`, `samples` — the row the history chart reads.

`price_sample`: append-only raw observation `{offer_id, price, in_stock, observed_at, source}`.
Retention: raw samples 400 days, `price_point` forever (`PRICE-04`, 11/decision 15).

### 5.8 `expert_review`

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `slug`, `title` | | `slug` in `/review/{slug}` |
| `product_id`, `variant_id` | id | the tested configuration (`REV-09`) |
| `author_id` | id → `user` (role `editor`) | |
| `published_at`, `updated_at` | timestamps | |
| `unit_source` | enum | `purchased_retail`, `vendor_sample`, `loaner` (`REV-07`) |
| `tested_firmware` / `tested_bios` | string, nullable | |
| `verdict` | text | |
| `pros` / `cons` | text[] | `REV-03` |
| `score_id` | id → `score` | the headline score (`TEST-11`) |
| `body` | structured blocks | chapters with anchors (`REV-08`) |
| `hero_media_id`, `gallery_media_ids` | ids → `media` | `MEDIA-02` |
| `methodology_version` | string | which scoring model produced the score (`TEST-13`) |

### 5.9 `user_review`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `product_id`, `variant_id` (nullable) | ids | |
| `user_id` | id → `user` | |
| `rating` | int 1–5 | |
| `title`, `body` | strings | |
| `ownership_period` | enum, nullable | `under_1_month`, `1_6_months`, `over_1_year` (`COMM-03`) |
| `pros` / `cons` | text[], nullable | |
| `state` | enum | `pending`, `published`, `rejected`, `hidden` |
| `helpful_votes` | int | |
| `submitted_at`, `published_at` | timestamps | |

Aggregate (`product_rating`): `product_id`, `average`, `count`, `distribution` (5→1 counts),
`computed_at` — the only thing cards read (`COMM-01`, `COMM-02`).

### 5.10 `lab_test`, `test_result`, `score`

`lab_test` (the definition — defines what a number means):

| Field | Type | Notes |
| --- | --- | --- |
| `key` | string, unique | `display.brightness_max`, `battery.web_browsing`, `cpu.geekbench6_multi` |
| `label`, `group_key` | | group: `design`, `display`, `battery`, `interface`, `connectivity`, `configuration`, `performance`, `thermals`, `gaming`, `audio` |
| `unit`, `unit_family` | enum | same enums as `spec_key` (5.5), so a test value and a spec value can share one comparison rule |
| `direction` | enum | `higher_better` / `lower_better` |
| `conditions` | json | preset, brightness target, distance, ambient temperature, benchmark version (`TEST-08`) |
| `methodology_url` | string | `/methodology/{test-key}` (`REV-04`) |
| `requires_rig` | bool | separates lab tests from published benchmark lookups |

`test_result`:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `lab_test_key` | string → `lab_test.key` | |
| `variant_id` | id → `variant` | the tested configuration |
| `value` | number | |
| `unit` | enum | must equal the test's unit |
| `measured_at` | date | |
| `sample_size` | int | `1` for a single run, `>1` for averaged (`TEST-16`) |
| `provenance` | enum | `own_lab`, `published_benchmark`, `community` (`TEST-15`) |
| `source_url` | url, nullable | required when provenance ≠ `own_lab` |
| `rig_id` | id, nullable | |
| `notes` | text, nullable | "lid closed", "AC power" |

`score`:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `subject_type` | enum | `variant`, `product`, `component` |
| `subject_id` | id | |
| `kind` | enum | `category`, `usage`, `overall`, `value` |
| `key` | enum | `performance`, `gaming`, `display`, `battery`, `connectivity`, `portability`, `overall`, `programming`, `college`, … |
| `value` | decimal 0–100 | |
| `inputs` | json | the test values used, with their ids — an audit trail (`CMP-07`, `TEST-13`) |
| `model_version` | string | scoring model version |
| `computed_at` | timestamp | |

### 5.11 `ranking_list`

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `slug`, `title` | | `/best/{slug}` |
| `kind` | enum | `use_case`, `budget`, `brand`, `form_factor`, `component`, `deal` |
| `criteria` | json | filters + sort + weights used (`RANK-09`) |
| `publisher_role` | enum | `editorial`, `generated` — a generated list must say so |
| `updated_at` | timestamp | shown on the page |
| `items` | array of `{position, product_id, award, reason}` | `position` stored, not implied (`RANK-07`, `RANK-10`) |

### 5.12 `article` (guides, news, comparisons-in-article-form)

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `slug`, `title` | | |
| `type` | enum | `guide`, `news`, `explainer`, `comparison_post` (`EDIT-09`) |
| `author_id` | id → `user` | |
| `published_at`, `updated_at`, `is_published` | | |
| `hero_media_id`, `body` | ids / blocks | blocks may embed product cards and live prices (`EDIT-03`) |
| `product_ids` | ids[] | drives related products (`EDIT-05`) |
| `category_ids` | ids[] | news hub filters (`EDIT-01`) |
| `seo` | json | title, description, canonical override |

### 5.13 `user`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `email` | string, unique | nullable for anonymous-only users |
| `display_name`, `avatar_media_id` | | |
| `role` | enum | `visitor`, `member`, `editor`, `moderator`, `admin` |
| `auth_providers` | json | email, Google (`ACCT-01`) |
| `created_at`, `last_seen_at` | | |
| `preferences` | json | currency, units, locale (`LOC-01`) |
| `reputation` | int | `Later`, from votes (`COMM-06`) |

### 5.14 `alert`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `user_id` | id, nullable | anonymous alerts are keyed by verified email/channel |
| `product_id`, `variant_id` (nullable) | ids | |
| `kind` | enum | `price_drop`, `price_below`, `back_in_stock`, `new_review` (`ALERT-01`, `ALERT-04`, `ALERT-05`) |
| `target_price` | money, nullable | required for `price_below` |
| `channel` | enum | `email`, `web_push`, `telegram` (`ALERT-02`) |
| `state` | enum | `active`, `paused`, `fired`, `expired` |
| `last_fired_at`, `fire_count` | | rate-limiting guard: one fire per price drop per 24 h |
| `created_at` | timestamp | |

### 5.15 `saved_comparison`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | id | |
| `user_id` | id, nullable | anonymous saved comparisons are keyed by the share token |
| `share_token` | string, unique | backs `CMP-10` |
| `product_ids` | ids[] (ordered) | 2–4 entries |
| `variant_ids` | ids[], nullable | per-column configuration (`CMP-11`) |
| `mode` | enum | `all_specs`, `differences_only` (`CMP-04`) |
| `created_at`, `last_opened_at` | | `last_opened_at` feeds "recent comparisons" (`CMP-14`) |
| `open_count` | int | popularity input for `CMP-14` |

### 5.16 Supporting entities

- `media`: `id`, `kind` (`product_photo`, `review_photo`, `logo`, `video_thumb`), `storage_key`,
  `width`, `height`, `alt`, `credit`, `license`, `owner_type`/`owner_id`.
- `component`: `id`, `kind` (`cpu`, `gpu`), `name`, `slug`, `specs` json, `benchmark_refs` —
  powers `DB-07` and `/cpu/{slug}`.
- `moderation_item`: `id`, `kind` (`spec_correction`, `missing_model`, `user_review`, `comment`),
  `payload`, `state`, `resolution_note`, `resolved_by` — the backend of `DB-14` and `COMM-07`.
- `redirect_click`: `id`, `offer_id`, `occurred_at`, `session_id`, `referrer_route` — feeds
  `PRICE-11` reporting and never stores personal data.
- `search_event`: `id`, `query`, `result_count`, `clicked_product_id`, `occurred_at` — feeds
  `SRCH-08` related searches and `COMM-07`-style gap reports.

---

## 6. Comparison rules

These rules are the contract of `CMP-01`…`CMP-17`. Implement them once, in one comparison
service; every screen that shows two products side by side must call it.

### 6.1 How many products

- Minimum **2**, maximum **4** in the URL and in the UI. Default is **4** (section 11,
  decision 1). Evidence: mysmartprice.com offers four "Add a laptop" slots on
  `/compare-laptops/`; nanoreview.net and laptopvslaptop.com compare exactly two;
  smartprix.com compares two with an `Add Another Product` control.
- The compare tray (`ACCT-05`) caps at the maximum and, when full, offers to replace the oldest
  entry instead of silently dropping it.
- Layout rules: 2 columns = two equal columns; 3–4 columns = first column is the spec label
  column (sticky on scroll), each product column is equal width with a horizontally scrollable
  body on narrow screens. Never stack 4 columns vertically — that is no longer a comparison.

### 6.2 Aligning spec values across products

- Alignment is **by `spec_key`**, never by DOM order or by row index. A product missing
  `display.refresh_rate_hz` renders an empty state for that row, never shifts the rows below.
- Rows are ordered by `spec_group.order`, then `spec_key.order`. The order is identical for every
  comparison — users compare the same row position across pages.
- A row is rendered when **at least one** compared product has `state = present`.
- Units are normalised **before** comparison: convert into the canonical unit of the
  `unit_family` (5.5), then compare. Canonical units: length `mm`, mass `kg`, volume_energy `Wh`,
  storage `GB`, frequency `GHz`, sound `dB`, time `minutes`, ratio `%`, brightness `nits`,
  resolution `px`, temperature `°C`, colour_delta `ΔE`. `rate` (MB/s, IOPS, fps) and `count`
  (points, ports, slots) are compared only when the unit matches — no conversion is applied
  inside them.
  - Conversions required by observed data: inches ↔ mm, GB ↔ TB ↔ GiB, MB ↔ GB, mAh + V → Wh,
    MHz ↔ GHz, lbs ↔ kg, cm ↔ inches, minutes ↔ hours.
  - `1 GB = 1000 MB`, `1 GiB = 1024 MiB`; the label must show which family the vendor used when
    the two differ by more than 1 % (this is exactly the "megabytes vs gigabytes" problem
    laptopvslaptop.com says it solves).
  - A value that cannot be converted (for example "Upto 12 hours" as free text) keeps
    `state = present` but `comparable = false`: it renders as text in its own row and is excluded
    from winner and delta calculation.
- Brand-level naming is normalised by reference: `Intel Core i5-13500H` and `i5 13500H` must
  resolve to one `component` row, otherwise the row is declared "not comparable" rather than
  guessed.

### 6.3 Missing and undisclosed values

Three distinct states, three distinct renderings, never a bare dash for all three (`DB-10`):

| `state` | Rendering | Winner/delta |
| --- | --- | --- |
| `present` | value + unit | included |
| `not_disclosed` | italic `Not disclosed` + tooltip "the vendor does not publish this specification" | excluded |
| `absent` | `No` for booleans, `—` for numeric, plus tooltip "this product does not have it" | counted as losing for `higher_better` booleans, excluded for numerics |

- If every compared product is `not_disclosed` for a row, the row is hidden in the
  `differences_only` view and shown greyed in the full view.
- A `conflicting` confidence value (`spec_value.confidence`) renders with a warning marker and a
  link to the correction form (`DB-14`).

### 6.4 Winner highlighting

- Each `spec_key` carries a `direction`: `higher_better` (brightness, RAM, cores, Geekbench,
  battery hours), `lower_better` (weight, thickness, fan noise, charge time, price), `neutral`
  (brand, OS, panel type, colour options).
- A product "wins" a row when its normalised value beats the others by at least the
  **significance threshold** for that key: default `2 %` for numbers with a unit, `0` for
  integers of small range (cores, ports, slots), and `0` for booleans. Below the threshold the row
  renders as a tie even if the numbers differ, so 4800 MHz does not "beat" 4800.5 MHz.
- The winner marker is accompanied by the reason, in the user's language, naming both values:
  "Faster clock speed — 4.5 GHz vs 3.3 GHz", "Higher screen refresh rate — 120 Hz vs 60 Hz"
  (observed phrasing on smartprix.com and nanoreview.net).
- `neutral` rows never carry a winner.
- The overall verdict (`CMP-07`) is produced deterministically:
  1. count row wins per product, weighted by group weight from the active scoring model
     (section 7.2),
  2. add price as one weighted row (`lower_better`, weight from the scoring model),
  3. the higher total wins; a difference under 3 % of the total is reported as "too close to call,
     here is what separates them",
  4. the verdict text cites the two or three highest-weighted won rows plus the price difference.
  The verdict must be reproducible from stored `score.inputs` — no free-text verdict stored as
  truth.

### 6.5 Differences-only view

- Toggle (`CMP-04`) that hides every row where all compared products render identically after
  normalisation (same value and same unit; `not_disclosed` on all sides counts as identical).
- Group-level collapse: a spec group with zero remaining rows disappears from the outline, and
  the outline shows how many rows each group contributes to the current view.
- The toggle state is part of the shareable URL (`mode=differences`) so a link restores the view
  the user shared.
- When the differences view is empty (identical products, e.g. two configurations of one model),
  show "these products are identical on the recorded specs" plus the price comparison, rather than
  a blank page.

### 6.6 Stable, shareable URLs and canonicalisation

URL contract:

```
/compare/{slugA}-vs-{slugB}
/compare/{slugA}-vs-{slugB}-vs-{slugC}
/compare/{slugA}-vs-{slugB}-vs-{slugC}-vs-{slugD}
   ?mode=differences              # optional, default all_specs
   &cfg={variantIdA}-{variantIdB}[-...]   # optional, per-column configuration (CMP-11)
```

Rules:

1. The path identifies the set. Products appear in the order the user chose.
   That order is what the share link preserves; the canonical form of the same set is defined in
   rule 7 and differs from it only for reverse duplicates.
2. `mode` and `cfg` are presentation parameters: the canonical URL of the page is the same path
   **without** them, and every one of these URLs must still render a complete comparison for a
   crawler.
3. Slug segments are `{brand}-{model}-{stable-id}`; the stable id makes the segment unique and
   permanent even if the display name changes (`SEO-01`).
4. If a slug no longer resolves (product deleted), the route returns 404 with the valid siblings
   offered — never a redirect to a single product.
5. The share control copies the full URL including `mode`/`cfg`, and mentions that the link
   restores the same comparison.
6. `share_token` (`5.15`) is only needed for saved comparisons; a compare URL must work without a
   token, so a link never expires.
7. Reverse-order duplicates (`b-vs-a`) are the same set: both orders render, so old links keep
   working, and `rel=canonical` names the deterministic form of the set — the products sorted by
   product id (decision 13) — never "the order someone requested first", which no crawler can
   reproduce. The link the user copied (`CMP-10`) keeps the order they chose.

### 6.7 Add, remove and replace

- Add: from any card (`+ Compare`), from the tray, or from a filled slot's search. Adding a 5th
  product prompts replace-or-cancel (6.1).
- Remove: an `x` on each product column; removing a product from a 2-product comparison navigates
  to `/compare` with the remaining product pre-filled (observed behaviour pattern on
  mysmartprice.com's per-column `x`).
- Replace: search inside a column; choosing a product keeps the column position, so the user's
  visual memory of "the left one" survives (`CMP-08`, `CMP-09`).
- Every add/remove/replace updates the URL immediately with `history.replaceState`, so reload,
  back and share always match the screen (`CMP-10`).
- Empty slots render as a picker, not as an empty column, so a 3-product comparison does not look
  broken.

---

## 7. Scoring and benchmarks

The point of this section: a number on this site must be traceable to a measurement, a method
version and a date. If you cannot trace it, do not show it.

### 7.1 What is measured

Recorded tests (`lab_test` rows), grouped as the reviewed sites group them:

| Group | Test | Unit | Direction | Observed on |
| --- | --- | --- | --- | --- |
| display | max brightness (SDR, 100 % window) | nits | higher_better | laptopmedia.com, rtings.com, nanoreview.net |
| display | contrast ratio (native) | ratio | higher_better | laptopmedia.com, rtings.com, nanoreview.net |
| display | colour gamut sRGB / DCI-P3 / Adobe RGB | % | higher_better | laptopmedia.com, nanoreview.net, rtings.com |
| display | colour accuracy (average ΔE, calibrated and out-of-box) | ΔE | lower_better | laptopmedia.com, rtings.com |
| display | uniformity (luminance, colour deviation across 9 zones) | % / ΔE | lower_better | laptopmedia.com |
| display | response time | ms | lower_better | laptopmedia.com, rtings.com |
| display | PWM frequency | Hz | higher_better (0 Hz = none) | laptopmedia.com |
| battery | battery life — web browsing | minutes | higher_better | rtings.com, laptopmedia.com |
| battery | battery life — video playback | minutes | higher_better | rtings.com, nanoreview.net |
| battery | battery life — idle | minutes | higher_better | rtings.com |
| battery | charge time 0→100 % | minutes | lower_better | rtings.com, nanoreview.net |
| thermals | sustained-load performance retention | % of first-run score | higher_better | rtings.com (`Performance Stability`) |
| thermals | surface temperature at stated points under load | °C | lower_better | laptopmedia.com |
| noise | fan noise under load at stated distance | dB(A) | lower_better | rtings.com, nanoreview.net |
| audio | speaker max loudness | dB | higher_better | rtings.com, nanoreview.net |
| audio | speaker frequency response deviation | dB | lower_better | rtings.com |
| cpu | Geekbench 6 single / multi (version recorded) | points | higher_better | nanoreview.net, laptopmedia.com |
| cpu | Cinebench 2024 single / multi | points | higher_better | nanoreview.net, laptopmedia.com |
| gpu | 3DMark Time Spy Graphics | points | higher_better | laptopmedia.com |
| gpu | 3DMark Wild Life Extreme Unlimited | points | higher_better | laptopmedia.com |
| gpu | Blender GPU (monster/junk shop, version recorded) | samples/min | higher_better | nanoreview.net |
| gaming | FPS per game at stated preset and resolution | fps | higher_better | rtings.com, laptopmedia.com |
| storage | sequential read/write, random 4K | MB/s, IOPS | higher_better | rtings.com, laptopmedia.com |
| connectivity | port count by type, Wi-Fi standard, Bluetooth version | count / enum | higher_better / neutral | rtings.com, nanoreview.net |
| design | weight, thickness, footprint, screen-to-body ratio | kg, mm, cm², % | lower/lower/lower/higher | laptopvslaptop.com, nanoreview.net, laptopmedia.com |

`MVP` set: brightness, contrast, sRGB %, ΔE, battery per scenario, charge time, fan noise under
load, Geekbench 6 (SC/MC), Cinebench 2024 (MC), 3DMark Time Spy Graphics, weight, thickness.
`Later` set: uniformity, PWM, response time, surface temperature, speaker response, per-game FPS,
storage, idle battery.

Every test row carries its `conditions` (`5.10`): display tests at 100 % brightness unless stated,
battery tests at a stated brightness and power profile, noise at a stated distance, benchmarks at
the named version. A test without conditions is not publishable.

### 7.2 From raw measurement to score

1. **Cohort.** Each test is normalised against a cohort, not against an absolute scale. Cohort =
   all variants with a result for that test in the same `category` and, for gaming/performance,
   the same year window. Publish the cohort definition and its size.
2. **Normalisation.** Use a percentile-rank transform into 0–100 after a mild outlier clamp
   (values below p1 and above p99 are clamped to the bounds), so one absurd result cannot flatten
   the scale. For `lower_better`, invert after transforming. Keep the raw value next to the score.
3. **Category score.** Category = weighted mean of its test scores:
   - `performance` ← Geekbench 6 multi, Cinebench 2024 multi, storage (Later)
   - `display` ← brightness, contrast, sRGB, ΔE, uniformity (Later)
   - `battery` ← web browsing, video, charge time
   - `gaming` ← 3DMark Time Spy, per-game FPS average (Later until FPS exists; until then the
     gaming score must be labelled "estimated from GPU benchmarks")
   - `connectivity` ← port coverage, Wi-Fi standard, Bluetooth
   - `portability` ← weight, thickness, footprint, charger weight
   Weights live in a versioned config file, not in code, and are published on
   `/methodology/scoring`.
4. **Overall score.** Weighted mean of the category scores. Because the usage weights differ,
   the overall score is only one of several published scores — never the only number on a page
   (`TEST-11`, `TEST-12`).
5. **Rounding and display.** Store full precision, display integers. Never display a score with
   more than two significant figures next to a raw measurement that has one.
6. **Missing data.** A category score is only computed when every required test for that category
   exists. Otherwise the category shows "not enough data" and the overall score omits it with a
   visible note — never impute a missing test from a similar model.

### 7.3 Usage-based ratings

- A usage rating re-weights the same category scores per scenario. Scenario set for `MVP`
  (mirroring nanoreview.net's `Primary usage` list and rtings.com's by-usage lists):
  `balanced`, `gaming`, `programming`, `video_editing`, `business`, `study`, `multimedia`,
  `travel`.
- Example weights (versioned, published, editable by the owner):

  | Scenario | performance | display | battery | gaming | connectivity | portability |
  | --- | --- | --- | --- | --- | --- | --- |
  | balanced | 0.30 | 0.20 | 0.20 | 0.05 | 0.10 | 0.15 |
  | gaming | 0.20 | 0.25 | 0.05 | 0.35 | 0.10 | 0.05 |
  | programming | 0.40 | 0.20 | 0.10 | 0.00 | 0.15 | 0.15 |
  | video_editing | 0.30 | 0.30 | 0.10 | 0.15 | 0.10 | 0.05 |
  | business | 0.25 | 0.15 | 0.20 | 0.00 | 0.25 | 0.15 |
  | study | 0.15 | 0.15 | 0.30 | 0.00 | 0.15 | 0.25 |
  | multimedia | 0.15 | 0.35 | 0.20 | 0.10 | 0.10 | 0.10 |
  | travel | 0.10 | 0.15 | 0.30 | 0.00 | 0.10 | 0.35 |

- The scenario picker on the compare view (`FIND-03`) re-computes both products' usage scores live
  from stored inputs; it does not call a new endpoint with different logic.
- A usage score without a published weight table is invalid and must not be rendered.

### 7.4 Ranking positions

- A product page shows `Group Rank x / n` and `Overall Rank x / n` (observed on smartprix.com).
  Group must be printed next to the number: group = `category` + `form_factor` + price band. The
  price band boundaries are market config.
- Ties are resolved by, in order: overall score, price (lower first), release date (newer first),
  then product id — deterministic, so ranks do not flicker between renders.
- Ranks are recomputed when a cohort changes; store `computed_at` with them and show it in a
  tooltip.
- Ranking lists (`ranking_list`, `RANK-*`) store `position` explicitly and show their criteria and
  update date (`RANK-09`). A generated list is labelled `generated` and shows the rule that
  produced it.

### 7.5 Methodology and provenance publication

Publish, linked from every score:

1. `/methodology` — the test catalogue, the rig, the conditions, the cohort rule, the scoring
   formula, the weight tables with a version and a change log, the recalibration policy, and the
   limitations (what the score cannot tell you).
2. `/methodology/{test-key}` — one test: what is measured, unit, direction, equipment, conditions,
   sample size, what a good/bad number looks like, and the update history.
3. Provenance on every result (`TEST-16`): measurement date, sample size, rig, unit source
   (`purchased_retail` / `vendor_sample` / `loaner`), firmware/BIOS, benchmark version.
4. Statements of independence and purchase policy (`REV-07`, `EDIT-06`), and a corrections policy
   with a working error-report entry point (`REV-11`).
5. Relative-scoring disclosure (`TEST-13`): state that scores are relative, that new hardware can
   move an existing device's score, and what the last recalibration date was.
6. Community data policy (`TEST-15`, `Later`): community submissions are a separate provenance,
   shown separately, never merged silently.

---

## 8. Search and discovery

### 8.1 Autosuggest (`SRCH-01`)

- Returns, in this order: exact `model_code` matches, product names, series, brands, popular
  comparisons, articles.
- Each suggestion carries a type badge and a thumbnail; keyboard navigable; `Enter` on the search
  box goes to `/search?q=`.
- Debounced input, minimum two characters, cancellation of stale responses, cache of popular
  prefixes. Suggestions must work with JavaScript disabled as a plain form submit.

### 8.2 Popular and trending (`CMP-14`, `RANK-06`)

- `Popular comparisons`: top pairs by `saved_comparison.open_count` and `comparison.open` events
  in a rolling 30-day window; computed nightly; printed window on the page.
- `Trending laptops`: top products by product-page views and compare adds in a 7-day window.
- `Newest laptops`: by `release_date` descending, with `announced` items marked (`RANK-08`,
  `Later`).
- `Recent comparisons`: the visitor's own last comparisons (local), distinct from the site-wide
  list.

### 8.3 "Best laptop under X" entry points (`SEO-03`, `RANK-01`)

- Canonical pages for the market's price buckets (`/laptops/price/under/{amount}` and
  `/best/under-{amount}`), generated from a curated bucket list in config — not from arbitrary
  query strings.
- Each page: the bucket definition, count, ranked shortlist with reasons, "cheapest first" and
  "best score first" toggles, the price history of the top pick.
- Arbitrary amounts (`under-47300`) are served but `noindex` and canonicalised to the nearest
  curated bucket, so the crawl surface stays finite (`SEO-04`).

### 8.4 Filters on list pages (`SRCH-03`…`SRCH-06`)

Available in `MVP`: brand, price (min/max + buckets), CPU family and generation, GPU family, RAM
size, storage size and type, screen size band, OS, touch/convertible, availability (exclude
out of stock), year. Each facet shows counts computed with all *other* filters applied, and
multi-value facets are OR within a facet and AND across facets.
`Later` facets: refresh rate, panel type, weight band, colour gamut, battery hours (from tests),
game requirement (`SRCH-07`).

### 8.5 Discovery surfaces that must exist on every page

- Related products by spec similarity (`FIND-05`), capped at 8, excluding the product itself.
- Related comparisons for a product (`CMP-12`).
- Related searches (`SRCH-08`) built from `search_event` data.
- Related articles (`EDIT-05`).
- A visible path up: breadcrumbs (`SEO-05`) and a link to the parent list.

---

## 9. Non-functional requirements

### 9.1 SEO

- **Structured data** (`SEO-06`), one JSON-LD block per page, matching what is visible:
  - product page: `Product` + `BreadcrumbList`, plus `AggregateRating` only when
    `product_rating.count >= 5`; `Offer` per active offer with `price`, `priceCurrency`,
    `availability`.
  - comparison page: `WebPage` + `BreadcrumbList` + `ItemList` of the compared products; do not
    mark a comparison as a `Review` of a single product.
  - review article: `Review` with `itemReviewed` → the product, `reviewRating` from the published
    score, `author`, `datePublished`.
  - guide/news: `Article` with `author`, `datePublished`, `dateModified`.
  - curated list: `ItemList` with positions and `itemListOrder`.
  - Never emit `FAQPage` or review markup for content the user cannot see.
- **Canonical compare URLs** (`SEO-02`, `6.6`): one canonical per product set, order-normalised
  for reverse duplicates (product ids sorted, decision 13), presentation params (`mode`, `cfg`)
  stripped. Indexation follows decision 14: a comparison opened or internally linked at least the
  configured number of times is indexable and is one of the site's strongest long-tail pages;
  every other valid 2–4 product comparison still renders for users and crawlers but is served
  `noindex, follow` and kept out of the sitemaps.
- **Canonical rules for lists** (`SEO-04`): sorted/filtered variants canonicalise to the
  unfiltered path; uncurated price amounts and deep facet combinations are `noindex, follow`
  and blocked from sitemaps.
- **Sitemaps** (`SEO-07`): `/sitemap.xml` index →
  `/sitemap-products-{n}.xml`, `/sitemap-comparisons-{n}.xml`, `/sitemap-lists-{n}.xml`,
  `/sitemap-articles-{n}.xml`, each under the protocol limit, with accurate `lastmod`.
  `robots.txt` points at the index. Comparisons are only indexed after they have been opened or
  linked from elsewhere (a threshold in config) to avoid an unbounded URL space; the rule must be
  written down on `/methodology`.
- **URL hygiene**: lowercase, hyphenated, no session ids, no parameters carrying identity, no
  trailing-slash duplication, one canonical host.
- **Internal linking**: every product page links to at least two curated lists and two
  comparisons; every comparison links back to each product page. Orphan pages fail a build check.
- **Localisation readiness** (`LOC-02`): routes are locale-prefixable from day one;
  `hreflang` pairs, translated metadata and per-locale sitemaps ship only when a second locale
  exists.

### 9.2 Performance

Targets at the 75th percentile of real users on a mid-range Android phone over 4G, measured on
the production build:

| Metric | Target |
| --- | --- |
| LCP (product page, list page) | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.05 (0.1 absolute max) — ad slots and comparison tables reserve height |
| TTFB (server-rendered) | ≤ 600 ms at p75 |
| Compare page with 4 products | interactive in ≤ 3 s; the spec table renders server-side |
| JS budget per route | ≤ 170 KB gzipped for compare and product routes |
| Images | responsive `srcset`, AVIF/WebP, explicit width/height, lazy below the fold, no layout shift |
| Fonts | system stack or 2 self-hosted subsets with `font-display: swap` |

Implementation expectations: server-rendered HTML for every content route (the studied competitor
pages that render content only through client JavaScript are a cautionary example — rtings.com's
review body and tools are empty in the raw HTML, and laptopdecision.com could not be read at all
by a non-browser client); caching per route with explicit revalidation on price/test changes;
no third-party script in the critical path.

### 9.3 Accessibility

- WCAG 2.2 AA. Specifically for this product:
  - comparison tables are real `<table>` elements with `<th scope="col">` per product and
    `<th scope="row">` per spec; the winner marker is text plus an icon, never colour alone;
  - the differences-only toggle is a real control with state announced (`aria-pressed`);
  - charts (price history, benchmark bars) ship an adjacent data table and a text summary
    (`MEDIA-04`);
  - focus order follows the visual order in 4-column layouts; sticky headers never trap focus;
  - keyboard access to autosuggest, the compare tray and the slot pickers; `Esc` closes overlays;
  - contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI borders; the "winner" green/red
    palette must survive greyscale;
  - no content behind hover only (`DB-08` tooltips need focus/tap equivalents);
  - `prefers-reduced-motion` respected; no autoplay video.
- Test with keyboard-only navigation, a screen reader on the compare and product routes, and at
  200 % zoom.

### 9.4 Responsive breakpoints

| Name | Width | Behaviour |
| --- | --- | --- |
| `xs` | ≤ 479 px | 1 column; compare becomes a horizontal scroll with a sticky label column; facets in a bottom sheet; sticky "compare (n)" bar |
| `sm` | 480–767 px | 1 column; two-up cards; facets in a sheet |
| `md` | 768–1023 px | 2 columns for cards; compare shows 2 columns + label column, the rest scrolls |
| `lg` | 1024–1439 px | facet rail becomes a sidebar; compare shows up to 4 columns |
| `xl` | ≥ 1440 px | wider gutters, larger imagery, same information density |

Rules: the comparison never loses a column silently — if it cannot fit, it scrolls and says so;
touch targets ≥ 44 px; the sticky compare tray never covers the primary action; tables scroll
inside their container, the page never scrolls horizontally.

### 9.5 Analytics events

Event names are fixed; properties are minimal and contain no personal data. The list is the
contract for `CMP-14`, `RANK-06` and `SRCH-08`:

| Event | When | Properties |
| --- | --- | --- |
| `search.submit` | search submitted | `query`, `result_count` |
| `search.suggest_click` | suggestion chosen | `query`, `position`, `type` |
| `list.view` | list/landing rendered | `route_kind`, `facet_keys`, `result_count` |
| `filter.apply` / `filter.clear` | facet changed | `facet_key`, `value_count` |
| `product.view` | product page view | `product_id`, `has_price`, `has_tests` |
| `compare.add` / `compare.remove` | tray changed | `product_id`, `tray_size`, `source_route` |
| `compare.open` | comparison rendered | `pair_key` (hash of ordered ids), `product_ids`, `mode`, `column_count` |
| `compare.differences_toggle` | toggle used | `mode` |
| `compare.share` | share control used | `pair_key` |
| `compare.scenario_change` | usage scenario changed | `scenario` |
| `price.history_open` | history chart opened | `product_id`, `range` |
| `alert.create` | price alert created | `kind`, `channel` |
| `affiliate.click` | `/go/{offer_id}` hit | `offer_id`, `retailer_id`, `product_id` |
| `review.view` | review article view | `review_id`, `product_id` |
| `method.open` | methodology opened | `test_key` |
| `report.submit` | correction/missing-model form | `kind` |

Do not log: full IPs, emails in query strings, or the raw contents of user reviews.

### 9.6 Disclosure obligations (surfaces only, copy is the owner's)

- Every affiliate outbound link passes through `/go/{offer_id}` and is accompanied by a visible
  disclosure component on the page, plus a site-wide `/disclosure` page (`MON-01`, `EDIT-06`).
  Observed competitor practice: laptopvslaptop.com states "As an Amazon Associate we earn from
  qualifying purchases"; rtings.com discloses commission and membership support; laptopmedia.com
  offers paid calibration profiles.
- Sponsored placements carry the word "Sponsored" adjacent to the item and are excluded from
  rankings and from the compare verdict (`MON-03`).
- Ad slots are labelled and never styled as content; no ads inside the comparison table or
  between spec rows.
- Prices carry an "as of {timestamp}" note and a "price may have changed" note next to every
  outbound buy action.
- The owner supplies the legal copy; you build the slots, the `/disclosure` route and the
  component that renders whatever the owner supplies, with no hard-coded claim.

---

## 10. Build order

Phases are cumulative. Do not start a phase whose predecessor's acceptance checks fail. Every
phase must be shippable: the site works, is indexable, and its routes return real pages.

### Phase 0 — Skeleton that renders server-side (prerequisite, no product value on its own)

- Stack, database and hosting proposed and accepted by the owner (section 11, decision 12).
- Layout, header search form, footer, breadcrumbs, error routes (4.1.31), `/robots.txt`,
  sitemap index.
- Spec taxonomy (`spec_group`, `spec_key`) and scoring-model config file, both versioned.
- CI with build check for orphan pages and JSON-LD validity.

### Phase 1 — `MVP`: the decision loop (specs → compare → price → test → list)

Ship in this order; each item is a working route, not a stub.

1. **Catalogue + specs** — `DB-01`…`DB-05`, `DB-08`, `DB-10`, `DB-11`, `DB-14`; routes 4.1.2–4.1.7,
   4.1.9; seed data for one market and enough models (>100) for comparisons to be meaningful.
2. **Comparison engine** — `CMP-01`…`CMP-10`, `CMP-12`…`CMP-14`, `CMP-17`, `ACCT-05`; rules in
   section 6 verbatim; routes 4.1.12–4.1.14.
3. **Prices and history** — `PRICE-01`…`PRICE-05`, `PRICE-09`, `PRICE-11`, `PRICE-13`, `MON-01`;
   routes 4.1.10, 4.1.27; 90-day backfill (decision 15).
4. **Expert reviews and lab tests** — `REV-01`…`REV-05`, `REV-07`…`REV-11`, `TEST-01`, `TEST-03`,
   `TEST-05`, `TEST-08`, `TEST-09`, `TEST-11`…`TEST-13`, `TEST-16`; methodology routes
   4.1.23–4.1.25; scoring rules in section 7.
5. **Rankings and best-of** — `RANK-01`…`RANK-04`, `RANK-06`, `RANK-07`, `RANK-09`, `RANK-10`;
   routes 4.1.5, 4.1.6, 4.1.15–4.1.18.
6. **Search, facets, discovery** — `SRCH-01`…`SRCH-06`, `SRCH-08`…`SRCH-10`, `FIND-03`,
   `FIND-05`, `FIND-06`; sections 8.1–8.5.
7. **SEO and NFR pass** — `SEO-01`…`SEO-07`, `SEO-09`, `SEO-10`, `MON-02`, `LOC-03`, `LOC-04`,
   `MEDIA-01`, `MEDIA-02`, `MEDIA-04`, `COMM-01`, `COMM-02`, `COMM-07`, `EDIT-02`, `EDIT-04`…
   `EDIT-06`, `EDIT-09`, `EDIT-05`; sections 9.1–9.5.

Phase 1 exit criteria: from the home page a visitor can reach a comparison in ≤ 2 clicks, every
score has a methodology link, every product page has a canonical and valid structured data, the
compare route restores from a copied URL, and the site passes the accessibility checks in 9.3.

### Phase 2 — retention and trust

`ALERT-01`…`ALERT-05`, `ACCT-01`…`ACCT-04`, `COMM-03`…`COMM-06`, `PRICE-06`,
`PRICE-08`, `PRICE-10`, `REV-06`, `TEST-02`, `TEST-04`, `TEST-06`, `TEST-07`, `TEST-10`,
`TEST-14`, `TEST-17`,
`RANK-05`, `FIND-01`, `FIND-02`, `FIND-04`, `SRCH-07`, `MON-06`, `MON-08`, `MEDIA-03`,
`MEDIA-05`, `EDIT-01`, `EDIT-03`, `EDIT-07`, `DB-06`, `DB-07`, `DB-09`, `DB-12`, `DB-13`.

### Phase 3 — reach

`LOC-01`, `LOC-02`, `SEO-08`, `MON-03`, `MON-04`, `MON-05`, `MON-07`, `PRICE-07`, `PRICE-12`,
`CMP-11`, `CMP-15`, `CMP-16`, `RANK-08`, `TEST-15`, `TEST-18`, `EDIT-08`, `MEDIA-06`,
`COMM-08`, `COMM-09`, `DB-11` extensions to non-laptop categories.

### Phase gates

- No phase starts before the previous phase's routes exist and return 200 for a real URL.
- `Later` rows must not appear as disabled UI, "coming soon" labels or placeholder routes. They
  either exist or they are absent.
- Any schema field introduced for a `Later` feature (alerts, saved comparisons, community) must
  exist in `MVP` even if unused, because retrofitting price history and alert retention later is
  the expensive part.

---

## 11. Open decisions

Each decision has a default you may implement immediately. Do not stall on any of them; if the
owner later chooses otherwise, the default must be reversible without a data migration.

| # | Decision | Options | Default | Why the default |
| --- | --- | --- | --- | --- |
| 1 | Maximum products in one comparison | 2 / 3 / 4 | **4** | mysmartprice.com offers four slots; 4 is the widest observed and the section 6 rules handle 2–4 |
| 2 | Primary market and display currency | one market vs multi-market | **one market, `INR` display, amounts stored with currency code** | The two price-tracking competitors are India-first; multi-market is `LOC-01`, `Later` |
| 3 | Where specs come from | vendor sheets only / licensed database / editorial entry | **vendor spec sheets + editorial entry, with provenance on every value** | Licensing a database is explicitly out of scope for now |
| 4 | Lab testing at launch | own lab from day 1 / published benchmarks first | **published benchmarks first (`provenance = published_benchmark`), own rig in phase 2** | You cannot buy a colourimeter and a noise box in phase 1; the schema and methodology pages must be ready for both |
| 5 | Retailer data source | manual entry / feeds / affiliate APIs | **manual entry + one affiliate feed, refreshed daily**, with `observed_at` per offer | Ship `PRICE-01` without a partner contract |
| 6 | Lowest-price tie-break | first retailer / cheapest ever / configurable | **configurable retailer priority, then freshest `observed_at`** | Order must be deterministic and explainable on the page |
| 7 | User accounts in `MVP` | yes / no | **no** — anonymous compare tray; when alerts ship (phase 2) they are email-only and need no account | Accounts are `Later`; nothing in `MVP` needs identity |
| 8 | User reviews and comments in `MVP` | yes / no | **no** — show aggregates only | Requires moderation capacity the owner has not staffed |
| 9 | Moderation model | pre-moderation / post-moderation | **pre-moderation** | Applies when `COMM-03`/`COMM-05` ship |
| 10 | First alert channel | email / web push / messenger | **email** | Simplest to make reliable and auditable |
| 11 | Advertising in `MVP` | yes / no | **no ads; affiliate only**, but the ad slot components and reserved space exist | Ads without a network contract are dead weight; reserved height prevents a later CLS regression |
| 12 | Technology stack, database, hosting, CMS | any | **builder proposes in the first reply, owner approves** | Explicitly out of scope for this document |
| 13 | Comparison URL canonical order | first-seen order / sorted by id | **first-seen order in the path, sorted order in `rel=canonical` for reverse duplicates** | Keeps user intent visible while collapsing duplicates |
| 14 | Indexation of comparisons | index all / index after a popularity threshold | **index comparisons opened at least 5 times or linked from a curated page** | Prevents an unbounded URL space; the threshold is config |
| 15 | Price-history depth at launch | 30 / 90 / 365 days | **90 days of backfill, then unlimited retention** | Enough for a "price dropped" claim, cheap to store |
| 16 | Non-laptop categories | laptop-only / add phones and TVs | **laptop-only** | Issue scope; schema is category-agnostic so the decision stays open |
| 17 | Score visibility for models with partial tests | hide score / show with "not enough data" | **show category scores you have, hide the overall score with a visible note** | Never publish a number that implies completeness |
| 18 | Editorial voice and byline policy | named authors / brand voice | **named authors with a corrections contact** | Required for review credibility and for `Review` structured data |
| 19 | Image sourcing | own photography / licensed stock / manufacturer press kits | **own photography plus manufacturer press kits with documented permission** | Never hot-link a competitor or retailer CDN (`MEDIA-01`) |
| 20 | Deal/price-alert copy ownership | builder writes / owner writes | **owner writes, builder renders** | Legal and affiliate disclosure copy is the owner's (`9.6`) |

---

## 12. Coverage table

Research date 2026-10-31. "Pages studied" lists only URLs that returned a usable response.
Feature ids reference section 3. A site with a `0` in the verified column is *not* dropped — it
keeps its row and every capability for it is listed in **12.2 Not verified**.

### 12.1 Per-site coverage

| Site | Pages studied | Features extracted (section 3 ids) | Verified rows | Unverified |
| --- | --- | --- | --- | --- |
| **smartprix.com** | `https://www.smartprix.com/` · `https://www.smartprix.com/laptops` · `https://www.smartprix.com/laptops/compare.php` · `https://www.smartprix.com/laptops/hp-15-250r-g10-laptop-intel-core-3-100u-16gb-ppd1xqbaao1k` · `https://www.smartprix.com/laptops/lenovo_ideapad_slim_3_82x70034_vs_lenovo_ideapad_slim_3_15iru8_8-cpd1str36qcl_pd1qetcqwpb.php` · `https://www.smartprix.com/login` · `https://www.smartprix.com/about/editorial-guidelines` · `https://www.smartprix.com/robots.txt` | DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-11, DB-14, CMP-01, CMP-02, CMP-03, CMP-05, CMP-06, CMP-08, CMP-09, CMP-10, CMP-14, SRCH-01, SRCH-03, SRCH-04, SRCH-05, SRCH-06, SRCH-08, SRCH-09, SRCH-10, PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05, PRICE-06, PRICE-10, PRICE-11, PRICE-13, ALERT-01, ALERT-02, ALERT-04, ALERT-05, REV-01, REV-04, REV-07, REV-11, RANK-01, RANK-04, RANK-06, RANK-08, EDIT-01, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, COMM-01, COMM-03, COMM-04, COMM-07, COMM-09, ACCT-01, ACCT-03, ACCT-05, SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, SEO-08, SEO-09, SEO-10, MEDIA-01, MEDIA-03, MEDIA-04, MEDIA-05, MEDIA-06, LOC-01, LOC-02, LOC-03, MON-01, MON-06, MON-08, FIND-05 | 82 | comparison maximum (2 vs more) — see 12.2 item 4; video review embedding — see 12.2 item 5 |
| **mysmartprice.com** | `https://www.mysmartprice.com/compare-laptops/` (also linked twice in the Issue) · `https://www.mysmartprice.com/compare-laptops/infinix-inbook-x1-xl11-laptop-msf593664-vs-realme-book-slim-laptop-msf588182` · `https://www.mysmartprice.com/laptops/` · `https://www.mysmartprice.com/computer/pricelist/laptops-price-list-in-india.html` · `https://www.mysmartprice.com/computer/acer-swift-14-ai-sf14-51-nx.j2hsi.001-laptop-msf1002056` · `https://www.mysmartprice.com/mobile-benchmark-scores/` · `https://www.mysmartprice.com/robots.txt` | DB-01, DB-02, DB-05, DB-10, DB-11, CMP-01, CMP-02, CMP-03, CMP-04, CMP-08, CMP-09, CMP-10, CMP-13, CMP-14, CMP-17, SRCH-01, SRCH-03, SRCH-04, SRCH-05, SRCH-09, SRCH-10, PRICE-01, PRICE-02, PRICE-03, PRICE-06, PRICE-10, PRICE-11, PRICE-12, PRICE-13, ALERT-02, ALERT-05, REV-01, RANK-01, RANK-02, RANK-07, RANK-08, EDIT-01, EDIT-02, EDIT-03, EDIT-04, COMM-01, COMM-02, COMM-03, ACCT-05, SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, SEO-10, MEDIA-01, MEDIA-05, MEDIA-06, LOC-03, MON-01, MON-02, MON-03, MON-06, MON-07, FIND-05 | 62 | price-drop alert UI — see 12.2 item 6; benchmark hub verified for phones only, laptop benchmark data not verified |
| **laptopvslaptop.com** | `https://laptopvslaptop.com/` · `https://laptopvslaptop.com/laptops/popular` · `https://laptopvslaptop.com/laptop/Lenovo-Yoga-7i-2-in-1-16%E2%80%B3-83DL/115971a` · `https://laptopvslaptop.com/compare/Lenovo-Yoga-7i-2-in-1-16%E2%80%B3-83DL/HP-OmniBook-X-Flip-2-in-1-16%E2%80%B3-G814JVR-IS96/115971a/142874a/` · `https://laptopvslaptop.com/laptop-finder` · `https://laptopvslaptop.com/about` · `https://laptopvslaptop.com/robots.txt` | DB-01, DB-02, DB-03, DB-05, DB-08, DB-10, DB-11, DB-12, CMP-01, CMP-02, CMP-03, CMP-05, CMP-07, CMP-10, CMP-12, SRCH-01, SRCH-03, SRCH-04, SRCH-05, SRCH-07, PRICE-01, PRICE-03, PRICE-07, PRICE-09, PRICE-11, PRICE-13, REV-10, RANK-01, RANK-02, RANK-03, RANK-06, RANK-10, EDIT-02, ACCT-02, ACCT-03, ACCT-05, SEO-01, SEO-02, SEO-03, SEO-05, SEO-06, SEO-07, LOC-01, LOC-04, MON-01, FIND-01, FIND-02, FIND-05, FIND-06 | 49 | account/registration UI — see 12.2 item 7; game requirement pages verified by URL and intro content only |
| **nanoreview.net** | `https://nanoreview.net/` · `https://nanoreview.net/en/laptop-compare` · `https://nanoreview.net/en/laptop-compare/apple-macbook-pro-14-m5-2026-vs-apple-macbook-air-15-m5-2026` · `https://nanoreview.net/en/laptop/apple-macbook-pro-14-m5-2026` · `https://nanoreview.net/en/faq` · `https://nanoreview.net/en/about` | DB-01, DB-02, DB-03, DB-04, DB-07, DB-09, DB-10, DB-12, DB-14, CMP-02, CMP-03, CMP-05, CMP-06, CMP-07, CMP-09, CMP-10, CMP-11, PRICE-07, PRICE-08, REV-02, REV-04, REV-11, TEST-01, TEST-03, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-11, TEST-12, TEST-13, TEST-15, TEST-16, TEST-17, RANK-05, COMM-05, COMM-06, COMM-07, COMM-08, ACCT-01, ACCT-04, SEO-02, LOC-01, LOC-04, FIND-03, FIND-04, FIND-05, FIND-06 | 49 | laptop ranking list page — see 12.2 item 3; voting exists (FAQ documents it and markup shows vote counts) but the voting UI itself was not exercised |
| **rtings.com** | `https://www.rtings.com/` · `https://www.rtings.com/laptop/reviews` · `https://www.rtings.com/laptop/reviews/apple/macbook-air-13-m5-2026` · `https://www.rtings.com/laptop/tools/compare` · `https://www.rtings.com/laptop/tools/table` · `https://www.rtings.com/laptop/reviews/best/by-usage/college` | DB-01, CMP-05, CMP-15, CMP-16, ALERT-03, ALERT-04, REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, REV-07, REV-09, TEST-01, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-10, TEST-11, TEST-12, TEST-14, TEST-16, TEST-17, TEST-18, RANK-01, RANK-02, RANK-03, RANK-09, RANK-10, EDIT-06, EDIT-07, COMM-05, COMM-08, SEO-03, SEO-05, SEO-06, MEDIA-02, MEDIA-03, MEDIA-04, MON-01, MON-04 | 44 | compare/table tool behaviour and render — see 12.2 item 2; usage-score weights not published on the studied pages, so `TEST-12` is specified as *our* weight table, not a copy |
| **laptopdecision.com** | none — every request blocked (see 12.2 item 1) | **none extracted (0 rows)**; domain keeps this row so the omission is visible | 0 | **All capabilities for this domain: unverified.** Nothing on the site could be read, so no inventory row is attributed to it and no feature is claimed from it |
| **laptopmedia.com** | `https://laptopmedia.com/` · `https://laptopmedia.com/review/` · `https://laptopmedia.com/review/hp-omnibook-3-16-bu0000-review-13-hours-of-battery-and-the-new-intel-core-5-320/` · `https://laptopmedia.com/specs/` | DB-01, DB-02, DB-04, DB-06, DB-07, DB-11, DB-12, DB-13, DB-14, CMP-12, SRCH-01, SRCH-02, SRCH-03, PRICE-11, REV-01, REV-02, REV-03, REV-04, REV-05, REV-07, REV-08, REV-09, REV-10, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-10, TEST-16, RANK-05, RANK-07, RANK-09, EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-06, EDIT-08, EDIT-09, COMM-05, COMM-07, COMM-09, SEO-01, SEO-05, SEO-06, SEO-08, MEDIA-02, LOC-01, LOC-02, LOC-04, MON-01, MON-02, MON-05, MON-08 | 59 | sitemap — see 12.2 item 8; per-country editions verified by link presence, not by reading a translated page |

### 12.2 Not verified

This list is present even when short: a silent omission must be impossible.

1. **`https://www.laptopdecision.com/`** (and `https://laptopdecision.com/`, `/laptops`,
   `/compare`, `/robots.txt`, `/sitemap.xml`) — **blocked, not read**. Every request returned
   `HTTP 403` with a Cloudflare interstitial (`<title>Just a moment...</title>`), for a desktop
   Chrome user agent, a Googlebot user agent, over `http` and `https`, on the apex and `www`
   hosts. A text-extraction proxy also refused anonymous access (`401`). Reason: bot challenge,
   not a 404 and not a JavaScript app.
   **Status:** the site keeps its coverage row (12.1) with `0` verified rows. Every capability
   that could have been observed there — comparison, finder, rankings, price display, reviews —
   is **unverified**, and no inventory row claims it. If the owner can supply a snapshot or an
   accessible mirror, re-run the research for this domain before building anything modelled on it.
2. **`https://www.rtings.com/laptop/tools/compare`** and **`https://www.rtings.com/laptop/tools/table`**
   — page returned `HTTP 200`, but the tool body is rendered client-side: the raw HTML contains
   the navigation and an embedded application payload, not the rendered controls. The test
   taxonomy used in `TEST-*` was read from the embedded payload and from the review page's
   `#test_<id>` anchors, which is why the rows are listed as verified; the **controls themselves**
   (how many products a comparison accepts, how columns are picked, how the table is sorted,
   how ratings are re-weighted) were **not verified**. `CMP-15`, `CMP-16`, `TEST-14`, `TEST-18`
   are therefore specified as *our* product's behaviour, not as a copy of rtings.com's.
3. **`https://nanoreview.net/en/laptop-list`** — `HTTP 404`. No laptop ranking-list route was
   found; the verified ranking pages are component lists (`/en/cpu-list/laptop-chips-rating`,
   `/en/gpu-list/laptop-graphics-rating`). The laptop-list feature is therefore attributed to
   smartprix.com and rtings.com only (`RANK-04`, `RANK-05`), not to nanoreview.net.
4. **smartprix.com maximum products per comparison** — the two-product compare page shows an
   `Add Another Product` control and multiple `Add Product` slots, but the enforced maximum is
   client-side and was **not verified**. Section 6.1 keeps the default at 4 and lists it as
   decision 1.
5. **Video reviews** — no studied page embedded a player in its server-rendered HTML. Only
   outbound channel links were observed (smartprix.com's site-wide YouTube link, rtings.com's
   video presence). `MEDIA-03` is `Later` and marked as an unverified shape.
6. **mysmartprice.com price-alert user interface** — the site loads a `push_notification`
   module and its copy mentions "deal alerts", but no price-alert form was reachable on the
   studied pages (the product page exposes market status and store links, not an alert control).
   `ALERT-01`/`ALERT-05` are attributed to smartprix.com; the mysmartprice.com attribution for
   `ALERT-02` rests on the push-notification module only.
7. **laptopvslaptop.com accounts** — `Save for later` exists as a control, but no sign-in route
   or account UI was verified. `ACCT-02`/`ACCT-03` are `Later` and the saved-state shape is
   unspecified until confirmed.
8. **laptopmedia.com sitemap** — the footer renders a `Sitemap` link with `href="#"`; no sitemap
   URL could be verified. `SEO-07` is attributed only to smartprix.com, mysmartprice.com and
   laptopvslaptop.com, whose `robots.txt` files name their sitemaps.
9. **laptopmedia.com translated editions** — the country links (`/de/`, `/fr/`, `/it/`, …) were
   read from the link list; no translated page body was opened, so the *quality* and *coverage*
   of each edition is unverified. `LOC-02` only claims that per-locale URL prefixes exist.

### 12.3 What was not in scope of the research

Competitor backend systems, their data acquisition, their pricing of ads, their legal copy, and
every category outside laptops on smartprix.com and mysmartprice.com (phones, TVs, appliances)
were not inventoried beyond the note that they exist and are `Later` (`LOC-01`, decision 16).

### 12.4 How acceptance is met

| Acceptance criterion | Where it is satisfied | How to check it in this file |
| --- | --- | --- |
| 1. Every inventory row carries an id, a capability area, the user action, at least one source domain, a priority of `MVP` or `Later`, and every required capability area has at least one row | section 3 | the 16 tables carry 155 rows; the rowwise columns are Id / Capability area / What the user can do / Source domain(s) / Priority / Variant note; section 3 closes with the per-area count table (A–P, all non-zero) |
| 2. Every linked site appears in the coverage table and the per-site feature lists add up to the inventory: no inventory row without a source domain, no coverage row without features | sections 3 and 12.1 | each of the seven domains has a 12.1 row with the exact ids attributed to it; the ids in a row are the ids whose "Source domain(s)" cell names that domain; the blocked domain's row states explicitly that it has zero rows and why |
| 3. A site or page that cannot be read keeps its coverage row, its URL is named in `Not verified` with the reason, and the features that could not be checked are marked unverified | sections 12.1 and 12.2 | `laptopdecision.com` keeps a 12.1 row with `0` verified rows and appears as 12.2 item 1 with the concrete failure (HTTP 403 Cloudflare challenge, browser and Googlebot user agents, http and https); 12.2 items 2–9 do the same for client-rendered and unverified pages on the readable sites |

Beyond the three acceptance criteria, a builder should be able to read section 4 for a route list,
section 5 for an entity list, section 6 for the comparison rules, section 7 for the scoring rules
and section 10 for the order to build them in — without asking a question. Any gap you find there
is a defect in this document: fix the document before writing code.

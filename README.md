# Laptop Review Site

Browse a seeded catalogue of laptop models with manufacturer model codes, hardware and the
current lowest price in INR, then open one laptop to read its identity header, quick specs,
lowest-price callout and every recorded specification grouped into the vendor spec groups.
This slice covers the catalogue list routes and the product/specs routes from `PROMPT.md`
(slices of Phase 0 + Phase 1 item 1).

## Stack

- **Next.js 15 (App Router) + TypeScript**, server-rendered routes, no client state library.
- **SQLite through Node's built-in `node:sqlite`**, with the relational schema from
  `PROMPT.md` §5 (`brand`, `model`, `product`, `variant`, `retailer`, `offer`, and the spec
  taxonomy `spec_group`, `spec_key`, `spec_value`, plus the `moderation_item` queue) in
  [`db/schema.sql`](db/schema.sql). Server components read it via [`lib/db.ts`](lib/db.ts).
  The parent Issue proposed Prisma + Postgres; this environment has no Postgres server, and
  the page/query layers only see typed rows, so swapping the driver is a local change.
- **Seed data** is versioned in the repository: [`data/laptops.json`](data/laptops.json) has
  106 products across 12 brands with one observed price per variant (observed 30 Oct 2026),
  and [`data/spec-sheets.json`](data/spec-sheets.json) holds the explicit vendor sheets for
  the products with a complete specification sheet. Every product also records the specs its
  variant row already knows (model code, display, CPU, graphics, RAM, storage, OS).
  `npm run seed` rebuilds `db/catalogue.sqlite` deterministically.
- **Spec taxonomy** — the vendor groups, spec keys, help text, units and editorial qualifier
  buckets live in [`lib/spec-taxonomy.ts`](lib/spec-taxonomy.ts), are seeded into
  `spec_group`/`spec_key`, and are read from there by the pages.

## Requirements

- Node.js **22.5 or newer** (`node:sqlite` is built in; no database server needed).
- npm.

## Setup

```bash
npm install
npm run seed      # builds db/catalogue.sqlite from db/schema.sql + data/*.json
npm run dev       # or: npm run build && npm start
```

Open <http://localhost:3000/laptops>. `npm run dev` and `npm run build` run the seed first,
so the catalogue is always present.

## Routes that exist today

| Route | What it renders |
| --- | --- |
| `/` | Entry links into the catalogue: all laptops, price bands, popular brands |
| `/laptops` | Server-rendered grid + facet rail (brand, price band, processor, RAM, storage, screen size, graphics, OS, touch, form factor), sort control, `<a href>` pagination (24 per page). Each card links to its product page |
| `/laptops/{brand}` | The same list scoped to one brand, with header, model count and last-updated date |
| `/laptops/price/under/{amount}` | Models whose current lowest price is under the amount |
| `/laptops/price/between/{min}-{max}` | Models inside the amount range |
| `/laptop/{slug}-{code}` | Product page: identity header with the printed manufacturer model code, release date and lowest-price callout, quick specs with units and qualifiers, and the spec-group outline. The stored slug is readable and ends with the URL-safe model code (`/laptop/asus-vivobook-15-x1504va-x1504va-nj521ws`) |
| `/laptop/{slug}/specs` | Specs tab: every recorded spec grouped into General, Display, Processor, Graphics, Memory, Storage, Battery, Connectivity, Input, Audio, Software, Warranty, with per-row help, metric + imperial units, the three missing-value renderings, the conflicting-value warning and the variant switch. Empty groups ask for feedback |
| `/corrections` | Data-correction form behind the conflicting-value warning and the empty spec groups; posts to `/api/corrections`, which writes one `pending` moderation item (no account needed) |
| `/robots.txt`, `/sitemap.xml`, `/compare`, `/best` | **Not in this slice** (separate Issues from `PROMPT.md` §10) |

Every facet, the custom min/max price, the sort and the page are URL parameters, so a copied
URL restores the identical list. Filtered variants canonicalise to the unfiltered list and
are served `noindex, follow` (`PROMPT.md` `SEO-04`); unfiltered list pages carry a
`BreadcrumbList` JSON-LD block. Product pages carry a canonical URL plus `Product` and
`BreadcrumbList` structured data. Price buckets, page size and facet labels live in
[`lib/config.ts`](lib/config.ts), not in templates.

## Spec values and their states

A spec value is rendered in one of the three states `PROMPT.md` §6.3 requires — never one
bare dash for all three:

- **present** — value plus unit, with the metric/imperial partner where the unit family has
  one (inches ↔ cm, mm ↔ inches, kg ↔ lb) and the editorial qualifier as a hint beside the
  value ("15.6 inches (39.6 cm) · Large"), never as the value itself;
- **not disclosed** — italic `Not disclosed` with the "the vendor does not publish this
  specification" tooltip;
- **absent** — `No` for a boolean, `—` for a numeric/text value, with the "this product does
  not have it" tooltip.

Values whose source disagrees carry `confidence = conflicting` and render a warning marker
that links to the correction form. Per-spec help is a native `<details>/<summary>` control,
so the definition opens with the keyboard (`Tab`, `Enter`) and on tap, not hover only.

## Tests

```bash
npm run test:unit   # node:test via tsx: URL round-trip, filters, facet counts, sort,
                    # pagination, narrowest-filter, spec units/qualifiers/missing states,
                    # seeded-database spec contract
npm run test:e2e    # Playwright against a real `next build` + `next start`
```

The Playwright suites (`tests/e2e/catalogue.spec.ts`, `tests/e2e/product.spec.ts`) build and
start the app on port 3104, then check the real flows: server-rendered grid, facet rail and
sort control, a filtered URL reopened in a second tab (same filters, page and order), the
empty state with its narrowest-filter removal, brand and budget headers with counts and
dates, the product page opened from a catalogue card, the grouped spec sheet with the
variant switch and the empty-group feedback link, the three missing-value renderings, the
metric/imperial pairs and qualifiers, spec help reached by keyboard with Tab and Enter, and
the correction form's success and rejected paths. Full-page screenshots are written to
`.orbi/screenshots/`.

The first run needs the browser binary: `npx playwright install chromium`. On a machine
without the usual X/GTK/font shared libraries (as in this build container), the suite picks
up a local dependency prefix from `~/.local/chromium-deps` if it exists; on a normal
workstation that block in `playwright.config.ts` is a no-op.

## Data and provenance

- Prices are stored in minor units with a currency code (`INR`) per `PROMPT.md` §5, so a
  later market switch is a data change.
- Popularity is an editorial seed order, not analytics data; the "Most popular" sort is
  therefore deterministic.
- Specs come from vendor spec sheets and editorial entry; no competitor data, images or
  review prose is included. Every `spec_value` row carries `source`, `source_url`,
  `raw_value` and `confidence`; the demo complete sheet is X1504VA-NJ521WS, a model that also
  has two sibling variants so the variant switch is exercised.
- The correction form writes to `moderation_item` with `state = 'pending'`; reading and
  resolving that queue is a later slice.

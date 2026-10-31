# Laptop Review Site

Browse a seeded catalogue of laptop models with manufacturer model codes, hardware and the
current lowest price in INR. This slice delivers the catalogue list routes from `PROMPT.md`
(slices of Phase 0 + Phase 1 item 1): `/laptops`, `/laptops/{brand}` and the budget lists.

## Stack

- **Next.js 15 (App Router) + TypeScript**, server-rendered routes, no client state library.
- **SQLite through Node's built-in `node:sqlite`**, with the relational schema from
  `PROMPT.md` §5 (`brand`, `model`, `product`, `variant`, `retailer`, `offer`) in
  [`db/schema.sql`](db/schema.sql). Server components read it via [`lib/db.ts`](lib/db.ts).
  The parent Issue proposed Prisma + Postgres; this environment has no Postgres server, and
  the page/query layers only see `CatalogueRow[]`, so swapping the driver is a local change.
- **Seed data** is a versioned fixture ([`data/laptops.json`](data/laptops.json)): 106
  products across 12 brands, entered as vendor spec sheets with one observed price per
  variant (observed 30 Oct 2026). `npm run seed` rebuilds `db/catalogue.sqlite`
  deterministically.

## Requirements

- Node.js **22.5 or newer** (`node:sqlite` is built in; no database server needed).
- npm.

## Setup

```bash
npm install
npm run seed      # builds db/catalogue.sqlite from db/schema.sql + data/laptops.json
npm run dev       # or: npm run build && npm start
```

Open <http://localhost:3000/laptops>. `npm run dev` and `npm run build` run the seed first,
so the catalogue is always present.

## Routes that exist today

| Route | What it renders |
| --- | --- |
| `/` | Entry links into the catalogue: all laptops, price bands, popular brands |
| `/laptops` | Server-rendered grid + facet rail (brand, price band, processor, RAM, storage, screen size, graphics, OS, touch, form factor), sort control, `<a href>` pagination (24 per page) |
| `/laptops/{brand}` | The same list scoped to one brand, with header, model count and last-updated date |
| `/laptops/price/under/{amount}` | Models whose current lowest price is under the amount |
| `/laptops/price/between/{min}-{max}` | Models inside the amount range |
| `/robots.txt`, `/sitemap.xml`, `/laptop/{slug}`, `/compare`, `/best` | **Not in this slice** (separate Issues from `PROMPT.md` §10) |

Every facet, the custom min/max price, the sort and the page are URL parameters, so a copied
URL restores the identical list. Filtered variants canonicalise to the unfiltered list and
are served `noindex, follow` (`PROMPT.md` `SEO-04`); unfiltered list pages carry a
`BreadcrumbList` JSON-LD block. Price buckets, page size and facet labels live in
[`lib/config.ts`](lib/config.ts), not in templates.

Product cards are deliberately not links: `/laptop/{slug}` belongs to another slice, and
`PROMPT.md` §10 forbids linking to a route that does not exist yet.

## Tests

```bash
npm run test:unit   # node:test via tsx: URL round-trip, filters, facet counts, sort,
                    # pagination, narrowest-filter, seeded-database contract
npm run test:e2e    # Playwright against a real `next build` + `next start`
```

The Playwright suite (`tests/e2e/catalogue.spec.ts`) builds and starts the app on port 3104,
then checks the real flows: server-rendered grid, facet rail and sort control, a filtered
URL reopened in a second tab (same filters, page and order), the empty state with its
narrowest-filter removal, brand and budget headers with counts and dates, the 404
alternatives, and the same list with JavaScript disabled. Full-page screenshots are written
to `.orbi/screenshots/`.

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
  review prose is included.

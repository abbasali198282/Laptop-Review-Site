import assert from "node:assert/strict";
import test from "node:test";
import {
  fallbackLinks,
  filterRows,
  narrowestFilter,
  parsePage,
  parseSort,
  runCatalogueQuery,
  scopeFromParams,
  sortRows,
  type CatalogueScope,
} from "../../lib/catalogue";
import { activeFilterChips, emptyFilters, hrefWith, parseFilters, type Filters } from "../../lib/facets";
import { loadCatalogueRows } from "../../lib/db";
import { sampleRows } from "./helpers";

function scope(overrides: Partial<CatalogueScope> = {}): CatalogueScope {
  return {
    basePath: "/laptops",
    filters: emptyFilters(),
    sort: "popular",
    page: 1,
    ...overrides,
  };
}

test("no filters returns the whole catalogue", () => {
  const result = runCatalogueQuery(sampleRows, scope());
  assert.equal(result.total, sampleRows.length);
  assert.equal(result.rows.length, sampleRows.length);
});

test("multi-values are OR within a facet and AND across facets", () => {
  const filters = parseFilters(new URLSearchParams("brand=asus,lenovo&ram=16,32"));
  const rows = filterRows(sampleRows, filters);
  assert.deepEqual(
    rows.map((row) => row.productId).sort((a, b) => a - b),
    [2, 3, 5, 6],
  );
});

test("brand scope from the path always applies", () => {
  const rows = filterRows(sampleRows, emptyFilters(), "lenovo");
  assert.deepEqual(rows.map((row) => row.productId), [4, 5, 6]);
});

test("price range is inclusive and excludes rows with no price", () => {
  const filters = parseFilters(new URLSearchParams("min_price=40000&max_price=80000"));
  const rows = filterRows(sampleRows, filters);
  assert.deepEqual(rows.map((row) => row.productId), [2, 4]);
});

test("screen-size facets match their band", () => {
  const filters = parseFilters(new URLSearchParams("screen=14"));
  assert.deepEqual(
    filterRows(sampleRows, filters).map((row) => row.productId),
    [1, 3, 6],
  );
});

test("facet counts use every other filter but not the facet's own selection", () => {
  const filters = parseFilters(new URLSearchParams("brand=asus&ram=16,32"));
  const result = runCatalogueQuery(sampleRows, scope({ filters }));
  const brandFacet = result.facets.find((facet) => facet.key === "brand");
  const ramFacet = result.facets.find((facet) => facet.key === "ram");

  // Brand counts ignore the brand selection, so Lenovo still shows its (RAM-filtered) count.
  assert.equal(brandFacet?.options.find((option) => option.key === "asus")?.count, 2);
  assert.equal(brandFacet?.options.find((option) => option.key === "lenovo")?.count, 2);

  // RAM counts ignore the RAM selection, so 8 GB is offered again within ASUS.
  assert.equal(ramFacet?.options.find((option) => option.key === "8")?.count, 1);
  assert.equal(ramFacet?.options.find((option) => option.key === "16")?.count, 1);
  assert.equal(ramFacet?.options.find((option) => option.key === "16")?.selected, true);
});

test("selected facet options link to their own removal", () => {
  const filters = parseFilters(new URLSearchParams("brand=asus"));
  const result = runCatalogueQuery(sampleRows, scope({ filters }));
  const asus = result.facets
    .find((facet) => facet.key === "brand")
    ?.options.find((option) => option.key === "asus");
  assert.equal(asus?.selected, true);
  assert.equal(asus?.href, "/laptops");
});

test("sort orders are deterministic and price sorts put unpriced models last", () => {
  const asc = sortRows(sampleRows, "price-asc").map((row) => row.priceMinor);
  assert.deepEqual(asc, [3999000, 4699000, 6299000, 10499000, 15499000, null]);
  const desc = sortRows(sampleRows, "price-desc").map((row) => row.priceMinor);
  assert.deepEqual(desc, [15499000, 10499000, 6299000, 4699000, 3999000, null]);
  const newest = sortRows(sampleRows, "newest").map((row) => row.releaseDate);
  assert.equal(newest[0], "2024-06-01");
  const popular = sortRows(sampleRows, "popular").map((row) => row.popularity);
  assert.deepEqual(popular, [490, 485, 475, 470, 460, 450]);
});

test("sort is stable across calls", () => {
  assert.deepEqual(
    sortRows(sampleRows, "popular").map((row) => row.productId),
    sortRows(sampleRows, "popular").map((row) => row.productId),
  );
});

test("an unknown sort falls back to the default and pages parse safely", () => {
  assert.equal(parseSort("bogus"), "popular");
  assert.equal(parseSort(null), "popular");
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage("-2"), 1);
  assert.equal(parsePage("abc"), 1);
  assert.equal(parsePage("3"), 3);
});

test("pagination links preserve filters and sort, and clamp to the last page", () => {
  const filters = parseFilters(new URLSearchParams("brand=asus&ram=16"));
  const result = runCatalogueQuery(sampleRows, scope({ filters, sort: "price-asc", page: 9 }));
  assert.equal(result.pageCount, 1);
  assert.equal(result.page, 1);
  assert.equal(result.total, 1);
});

test("an impossible combination yields count 0 and still lists every active filter", () => {
  const filters = parseFilters(new URLSearchParams("brand=asus&ram=64&screen=14"));
  const result = runCatalogueQuery(sampleRows, scope({ filters }));
  assert.equal(result.total, 0);
  assert.deepEqual(
    result.chips.map((chip) => chip.label),
    ["ASUS", "64 GB", '14"'],
  );
});

test("the empty state proposes removing the narrowest filter", () => {
  // Removing ram=64 recovers the two ASUS rows inside the 14" band, removing screen or brand
  // recovers nothing: RAM is the filter that is actually emptying this list.
  const filters = parseFilters(new URLSearchParams("brand=asus&ram=64&screen=14"));
  const chips = activeFilterChips(filters, { asus: "ASUS" });
  const narrowest = narrowestFilter(sampleRows, scope({ filters }), chips);
  assert.equal(narrowest?.facet, "ram");
  assert.equal(narrowest?.label, "RAM: 64 GB");
  assert.equal(narrowest?.countAfterRemoval, 2);
  assert.equal(narrowest?.href, "/laptops?brand=asus&screen=14");
  assert.equal(
    runCatalogueQuery(sampleRows, scope({ filters, basePath: "/laptops" })).narrowest?.href,
    narrowest?.href,
  );
});

test("a budget list's narrowest offer counts inside the route's own price band", () => {
  // Only the ASUS A-1 row (8 GB, 512 GB) is under ₹40,000. Counting without the path band
  // would say the storage filter hides two models; inside the band it hides exactly one.
  const band = { minPriceMinor: 0, maxPriceMinor: 4000000 };
  const query = parseFilters(new URLSearchParams("ram=8&storage=1024"));
  const filters: Filters = { ...query, ...band };
  const linkFilters: Filters = { ...filters, minPriceMinor: null, maxPriceMinor: null };
  const result = runCatalogueQuery(sampleRows, {
    basePath: "/laptops/price/under/40000",
    filters,
    sort: "popular",
    page: 1,
    linkFilters,
  });

  assert.equal(result.total, 0);
  assert.equal(result.narrowest?.label, "Storage: 1 TB");
  assert.equal(result.narrowest?.countAfterRemoval, 1);
  assert.equal(result.narrowest?.href, "/laptops/price/under/40000?ram=8");

  // Same query without the band: the count (2) is the whole-catalogue number, not this list's.
  const unscoped = runCatalogueQuery(sampleRows, {
    basePath: "/laptops/price/under/40000",
    filters: linkFilters,
    sort: "popular",
    page: 1,
  });
  assert.notEqual(unscoped.narrowest?.countAfterRemoval, 1);
});

test("the seeded budget list gives the in-band recovery count, not the catalogue-wide one", () => {
  // Reproduces /laptops/price/between/40000-60000?storage=1024&ram=16: no model in the band
  // has a 1 TB drive, so dropping storage recovers the eight 16 GB models inside the band —
  // not the 76 sixteen-GB models the whole catalogue holds.
  const band = { minPriceMinor: 4000000, maxPriceMinor: 6000000 };
  const query = parseFilters(new URLSearchParams("storage=1024&ram=16"));
  const filters: Filters = { ...query, ...band };
  const result = runCatalogueQuery(loadCatalogueRows(), {
    basePath: "/laptops/price/between/40000-60000",
    filters,
    sort: "popular",
    page: 1,
    linkFilters: { ...filters, minPriceMinor: null, maxPriceMinor: null },
  });

  assert.equal(result.total, 0);
  assert.equal(result.narrowest?.label, "Storage: 1 TB");
  assert.equal(result.narrowest?.countAfterRemoval, 8);
  assert.equal(result.narrowest?.href, "/laptops/price/between/40000-60000?ram=16");
});

test("a copied URL restores identical filters, page and order", () => {
  const params = new URLSearchParams(
    "brand=asus,lenovo&ram=16,32&min_price=40000&max_price=120000&sort=price-desc",
  );
  const first = runCatalogueQuery(sampleRows, scopeFromParams("/laptops", params));
  const copiedHref = hrefWith("/laptops", parseFilters(params), {
    sort: "price-desc",
    page: first.page,
  });
  assert.equal(
    copiedHref,
    "/laptops?brand=asus%2Clenovo&ram=16%2C32&min_price=40000&max_price=120000&sort=price-desc",
  );

  const copiedParams = new URLSearchParams(copiedHref.split("?")[1]);
  const second = runCatalogueQuery(sampleRows, scopeFromParams("/laptops", copiedParams));
  assert.deepEqual(
    first.rows.map((row) => row.productId),
    second.rows.map((row) => row.productId),
  );
  assert.equal(first.total, second.total);
  assert.equal(first.page, second.page);
});

test("brand-scoped lists only count that brand", () => {
  const result = runCatalogueQuery(sampleRows, scope({ basePath: "/laptops/asus", brandSlug: "asus" }));
  assert.equal(result.total, 3);
  assert.ok(result.rows.every((row) => row.brandSlug === "asus"));
  const brandFacet = result.facets.find((facet) => facet.key === "brand");
  assert.deepEqual(brandFacet?.options.map((option) => option.key), ["asus"]);
});

test("fallback links point at brand and budget routes with real counts", () => {
  const fallbacks = fallbackLinks(sampleRows);
  assert.deepEqual(fallbacks.popularBrands[0], { label: "ASUS", href: "/laptops/asus", count: 3 });
  assert.ok(fallbacks.priceBands.some((band) => band.href === "/laptops/price/under/40000"));
  assert.ok(fallbacks.popularFeatures.length > 0);
});

test("seeded catalogue loads from the real SQLite schema with more than 100 models", () => {
  const rows = loadCatalogueRows();
  assert.ok(rows.length > 100, `expected >100 products, got ${rows.length}`);
  assert.ok(new Set(rows.map((row) => row.brandSlug)).size >= 10);
  assert.ok(rows.every((row) => row.priceMinor === null || row.priceMinor > 0));
  const result = runCatalogueQuery(rows, scope());
  assert.equal(result.total, rows.length);
  assert.ok(result.facets.every((facet) => facet.options.length > 0));
});

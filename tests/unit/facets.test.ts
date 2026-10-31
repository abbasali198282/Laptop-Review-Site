import assert from "node:assert/strict";
import test from "node:test";
import {
  activeFilterChips,
  emptyFilters,
  facetValueLabel,
  hasActiveFilters,
  hrefWith,
  parseFilters,
  priceFilterLabel,
  toggleFacetValue,
  toSearchParams,
} from "../../lib/facets";
import { priceBucketHref, priceBuckets, screenBands } from "../../lib/config";

test("parses comma-separated facet values and normalises their order", () => {
  const filters = parseFilters(
    new URLSearchParams("brand=lenovo,asus&ram=16,8&storage=1024,512&touch=yes"),
  );
  assert.deepEqual(filters.brand, ["asus", "lenovo"]);
  assert.deepEqual(filters.ram, ["8", "16"]);
  assert.deepEqual(filters.storage, ["512", "1024"]);
  assert.deepEqual(filters.touch, ["yes"]);
  assert.equal(hasActiveFilters(filters), true);
});

test("parses custom min/max price in rupees into minor units", () => {
  const filters = parseFilters(new URLSearchParams("min_price=40000&max_price=80000"));
  assert.equal(filters.minPriceMinor, 4000000);
  assert.equal(filters.maxPriceMinor, 8000000);
});

test("ignores invalid price parameters instead of throwing", () => {
  const filters = parseFilters(new URLSearchParams("min_price=abc&max_price=-5"));
  assert.equal(filters.minPriceMinor, null);
  assert.equal(filters.maxPriceMinor, null);
});

test("serialises in a fixed order so equal selections give byte-identical URLs", () => {
  const a = parseFilters(new URLSearchParams("ram=16,8&brand=lenovo,asus&sort=price-asc"));
  const b = parseFilters(new URLSearchParams("brand=asus,lenovo&ram=8,16"));
  assert.equal(toSearchParams(a, { sort: "price-asc" }).toString(), "brand=asus%2Clenovo&ram=8%2C16&sort=price-asc");
  assert.equal(
    toSearchParams(a, { sort: "price-asc" }).toString(),
    toSearchParams(b, { sort: "price-asc" }).toString(),
  );
});

test("URL -> filters -> URL round-trip preserves every filter, sort and page", () => {
  const original = "brand=asus%2Clenovo&cpu=Intel+Core+i5&ram=8%2C16&min_price=40000&max_price=80000&sort=newest&page=2";
  const filters = parseFilters(new URLSearchParams(original));
  const rebuilt = toSearchParams(filters, { sort: "newest", page: 2 }).toString();
  assert.equal(rebuilt, "brand=asus%2Clenovo&cpu=Intel+Core+i5&ram=8%2C16&min_price=40000&max_price=80000&sort=newest&page=2");
  assert.deepEqual(parseFilters(new URLSearchParams(rebuilt)), filters);
});

test("hrefWith omits the query string when nothing is active", () => {
  assert.equal(hrefWith("/laptops", emptyFilters(), {}), "/laptops");
  assert.equal(hrefWith("/laptops/asus", emptyFilters(), { sort: "popular" }), "/laptops/asus");
  assert.equal(
    hrefWith("/laptops/asus", emptyFilters(), { sort: "newest" }),
    "/laptops/asus?sort=newest",
  );
});

test("page 1 is not written into the URL", () => {
  assert.equal(toSearchParams(emptyFilters(), { page: 1 }).toString(), "");
  assert.equal(toSearchParams(emptyFilters(), { page: 3 }).toString(), "page=3");
});

test("toggling a facet value adds, replaces and removes it", () => {
  let filters = emptyFilters();
  filters = toggleFacetValue(filters, "brand", "asus");
  filters = toggleFacetValue(filters, "brand", "lenovo");
  assert.deepEqual(filters.brand, ["asus", "lenovo"]);
  filters = toggleFacetValue(filters, "brand", "asus");
  assert.deepEqual(filters.brand, ["lenovo"]);
});

test("active chips name each filter and carry the state without it", () => {
  const filters = parseFilters(new URLSearchParams("brand=asus&ram=16&min_price=40000"));
  const chips = activeFilterChips(filters, { asus: "ASUS" });
  assert.deepEqual(
    chips.map((chip) => chip.label),
    ["ASUS", "₹40,000 and above", "16 GB"],
  );
  const ramChip = chips.find((chip) => chip.facet === "ram");
  assert.deepEqual(ramChip?.removeFilters.ram, []);
  assert.deepEqual(ramChip?.removeFilters.brand, ["asus"]);
});

test("facet value labels come from the taxonomy, not from raw URL tokens", () => {
  assert.equal(facetValueLabel("ram", "16"), "16 GB");
  assert.equal(facetValueLabel("storage", "1024"), "1 TB");
  assert.equal(facetValueLabel("os", "windows-11-home"), "Windows 11 Home");
  assert.equal(facetValueLabel("touch", "yes"), "Touchscreen");
  assert.equal(facetValueLabel("form", "convertible"), "Convertible");
  assert.equal(facetValueLabel("gpu", "nvidia"), "NVIDIA GeForce");
  assert.equal(facetValueLabel("brand", "asus", { asus: "ASUS" }), "ASUS");
  assert.equal(facetValueLabel("screen", "14"), '14"');
});

test("price filter label renders Indian-formatted rupee amounts", () => {
  assert.equal(priceFilterLabel(4000000, 8000000), "₹40,000 – ₹80,000");
  assert.equal(priceFilterLabel(null, 4000000), "Under ₹40,000");
  assert.equal(priceFilterLabel(null, null), "Any price");
});

test("curated price bands link to the budget routes this slice renders", () => {
  assert.equal(priceBucketHref(priceBuckets[0]), "/laptops/price/under/40000");
  assert.equal(priceBucketHref(priceBuckets[1]), "/laptops/price/between/40000-60000");
  assert.equal(priceBucketHref(priceBuckets[4]), "/laptops/price/between/100000-300000");
});

test("screen bands do not overlap and cover every seeded size", () => {
  for (const size of [13.3, 13.6, 14.0, 14.2, 15.3, 15.6, 16.0, 16.1, 17.0]) {
    const matches = screenBands.filter((band) => size >= band.min && size < band.max);
    assert.equal(matches.length, 1, `size ${size} matched ${matches.length} bands`);
  }
});

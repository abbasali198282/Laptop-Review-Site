import assert from "node:assert/strict";
import test from "node:test";
import robotsRoute from "../../app/robots";
import { priceBucketHref, priceBuckets } from "../../lib/config";
import { loadCatalogueRows } from "../../lib/db";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  breadcrumbNode,
  listJsonLd,
  productItemListJsonLd,
  productNode,
  sitemapEntries,
  type Crumb,
} from "../../lib/seo";
import { makeRow, sampleRows } from "./helpers";

const crumbs: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "All laptops", href: "/laptops" },
  { label: "ASUS", href: "/laptops/asus" },
];

/** The shape the schema.org validator sees, kept explicit so the test can read optional offers. */
type ProductLdNode = {
  "@type": string;
  name: string;
  sku: string;
  mpn: string;
  brand: { "@type": string; name: string };
  url: string;
  offers?: { "@type": string; price: string; priceCurrency: string; availability: string };
};

const asProduct = (node: unknown) => node as ProductLdNode;

test("the breadcrumb node mirrors the visible trail with absolute item URLs and positions", () => {
  const node = breadcrumbNode(crumbs);
  assert.equal(node["@type"], "BreadcrumbList");
  assert.deepEqual(
    node.itemListElement.map((item) => [item.position, item.name, item.item]),
    [
      [1, "Home", absoluteUrl("/")],
      [2, "All laptops", absoluteUrl("/laptops")],
      [3, "ASUS", absoluteUrl("/laptops/asus")],
    ],
  );
  // The single-block helper carries the context once; graph pages reuse the bare node.
  const block = breadcrumbJsonLd(crumbs);
  assert.equal(block["@context"], "https://schema.org");
  assert.equal(block["@type"], "BreadcrumbList");
});

test("a product node carries the model code and the observed price in the schema currency form", () => {
  const node = asProduct(productNode(makeRow()));
  assert.equal(node["@type"], "Product");
  assert.equal(node.sku, "X1504VA-NJ521WS");
  assert.equal(node.mpn, "X1504VA-NJ521WS");
  assert.equal(node.brand.name, "ASUS");
  assert.equal(node.url, absoluteUrl("/laptop/asus-vivobook-15-x1504va-nj521ws"));
  assert.equal(node.offers?.price, "62990.00");
  assert.equal(node.offers?.priceCurrency, "INR");
  assert.equal(node.offers?.availability, "https://schema.org/InStock");

  const unpriced = asProduct(productNode(makeRow({ priceMinor: null })));
  assert.equal(unpriced.offers, undefined);
});

test("the product node accepts the specs-tab path so its url matches the page it describes", () => {
  const node = asProduct(
    productNode(makeRow({ priceMinor: null }), "/laptop/asus-vivobook-15-x1504va-nj521ws/specs"),
  );
  assert.equal(node.url, absoluteUrl("/laptop/asus-vivobook-15-x1504va-nj521ws/specs"));
});

test("the list item list gives every visible card a Product with a position", () => {
  const node = productItemListJsonLd(sampleRows);
  assert.equal(node["@type"], "ItemList");
  assert.equal(node.numberOfItems, sampleRows.length);
  assert.equal(node.itemListOrder, "https://schema.org/ItemListUnordered");
  assert.deepEqual(
    node.itemListElement.map((entry) => entry.position),
    sampleRows.map((_row, index) => index + 1),
  );
  assert.deepEqual(
    node.itemListElement.map((entry) => asProduct(entry.item)["@type"]),
    sampleRows.map(() => "Product"),
  );
  assert.deepEqual(
    node.itemListElement.map((entry) => asProduct(entry.item).url),
    sampleRows.map((row) => absoluteUrl(`/laptop/${row.slug}`)),
  );
});

test("a list page emits one block with the breadcrumb and the products it renders", () => {
  const block = listJsonLd({ crumbs, rows: sampleRows });
  assert.equal(block["@context"], "https://schema.org");
  assert.deepEqual(
    block["@graph"].map((node) => node["@type"]),
    ["BreadcrumbList", "ItemList"],
  );

  // An empty result has no list to describe, only the trail.
  const empty = listJsonLd({ crumbs, rows: [] });
  assert.deepEqual(
    empty["@graph"].map((node) => node["@type"]),
    ["BreadcrumbList"],
  );
});

test("the sitemap lists the catalogue, every brand, every curated budget band and every product", () => {
  const rows = sampleRows.map((row) => ({ ...row, slug: `test-laptop-${row.productId}` }));
  const entries = sitemapEntries(rows);
  const urls = entries.map((entry) => entry.url);

  assert.equal(new Set(urls).size, urls.length, "sitemap URLs are unique");
  assert.equal(entries.length, 1 + 2 + priceBuckets.length + rows.length);
  assert.ok(urls.includes(absoluteUrl("/laptops")));
  assert.ok(urls.includes(absoluteUrl("/laptops/asus")));
  assert.ok(urls.includes(absoluteUrl("/laptops/lenovo")));
  for (const bucket of priceBuckets) {
    assert.ok(urls.includes(absoluteUrl(priceBucketHref(bucket))), bucket.key);
  }
  for (const row of rows) {
    assert.ok(urls.includes(absoluteUrl(`/laptop/${row.slug}`)), row.slug);
  }

  // Sorted, filtered and paged variants are noindex and must not leak into the sitemap.
  for (const url of urls) {
    assert.equal(url.includes("?"), false, url);
    assert.match(url, /^http:\/\/localhost:3000\//);
  }

  for (const entry of entries) {
    assert.equal(Number.isNaN(Date.parse(entry.lastModified)), false, `${entry.url} lastmod`);
    assert.ok(entry.priority > 0 && entry.priority <= 1);
  }
});

test("sitemap lastmod is the latest price observation of that list, not the newest row overall", () => {
  const rows = [
    makeRow({ productId: 1, slug: "one", brandSlug: "asus", brandName: "ASUS", updatedAt: "2026-10-01T00:00:00Z" }),
    makeRow({ productId: 2, slug: "two", brandSlug: "lenovo", brandName: "Lenovo", updatedAt: "2026-10-30T06:00:00Z" }),
  ];
  const byUrl = new Map(sitemapEntries(rows).map((entry) => [entry.url, entry]));
  assert.equal(byUrl.get(absoluteUrl("/laptops"))?.lastModified, "2026-10-30T06:00:00Z");
  assert.equal(byUrl.get(absoluteUrl("/laptops/asus"))?.lastModified, "2026-10-01T00:00:00Z");
  assert.equal(byUrl.get(absoluteUrl("/laptops/lenovo"))?.lastModified, "2026-10-30T06:00:00Z");
  assert.equal(byUrl.get(absoluteUrl("/laptop/one"))?.lastModified, "2026-10-01T00:00:00Z");
});

test("the seeded catalogue produces one sitemap URL per product plus its lists", () => {
  const rows = loadCatalogueRows();
  const entries = sitemapEntries(rows);
  const urls = new Set(entries.map((entry) => entry.url));

  assert.equal(urls.size, entries.length);
  assert.equal(rows.length, 106);
  assert.equal(entries.length, 1 + 12 + priceBuckets.length + rows.length);

  const demo = rows.find((row) => row.modelCode === "X1504VA-NJ521WS");
  assert.ok(demo);
  assert.ok(urls.has(absoluteUrl(`/laptop/${demo.slug}`)));
});

test("robots.txt allows the site, keeps the form endpoint out and names the sitemap absolutely", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://laptops.example";
  try {
    const robots = robotsRoute();
    assert.deepEqual(robots.rules, [{ userAgent: "*", allow: "/", disallow: ["/api/"] }]);
    assert.equal(robots.sitemap, "https://laptops.example/sitemap.xml");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

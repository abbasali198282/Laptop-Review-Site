import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";

const screenshots = ".orbi/screenshots";
fs.mkdirSync(screenshots, { recursive: true });

/** Matches `use.baseURL` in playwright.config.ts (and NEXT_PUBLIC_SITE_URL in webServer.env). */
const origin = "http://127.0.0.1:3104";
const demoSlug = "asus-vivobook-15-x1504va-x1504va-nj521ws";

type JsonLdNode = Record<string, unknown> & { "@type"?: string };
type StructuredData = { context?: string; nodes: JsonLdNode[] };

/** Collect real browser failures so a rendered page that throws is a test failure. */
function watchBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

/** Parse every JSON-LD block the page really ships; a broken block is a test failure. */
async function structuredData(page: Page): Promise<StructuredData[]> {
  return page.evaluate(() => {
    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
    return scripts.map((script) => {
      const block = JSON.parse(script.textContent ?? "null") as Record<string, unknown>;
      const graph = block["@graph"];
      const nodes = (Array.isArray(graph) ? graph : [block]) as Record<string, unknown>[];
      return { context: block["@context"] as string | undefined, nodes };
    });
  });
}

function nodeOfType(nodes: JsonLdNode[], type: string): JsonLdNode[] {
  return nodes.filter((node) => node["@type"] === type);
}

function breadcrumbItemUrls(node: JsonLdNode): string[] {
  const items = (node.itemListElement ?? []) as Array<Record<string, unknown>>;
  return items.map((item) => String(item.item));
}

type ListRoute = { path: string; crumbLabel: string; cardCount: number };

const listRoutes: ListRoute[] = [
  { path: "/laptops", crumbLabel: "All laptops", cardCount: 24 },
  { path: "/laptops/asus", crumbLabel: "ASUS", cardCount: 18 },
  { path: "/laptops/price/under/40000", crumbLabel: "Under ₹40,000", cardCount: 6 },
  { path: "/laptops/price/between/40000-60000", crumbLabel: "₹40,000 – ₹60,000", cardCount: 16 },
];

const productRoutes = [
  { path: `/laptop/${demoSlug}`, crumbLabel: "Vivobook 15 X1504VA (X1504VA-NJ521WS)" },
  { path: `/laptop/${demoSlug}/specs`, crumbLabel: "Specifications" },
];

test("every list, brand and budget route emits a canonical URL, a breadcrumb trail and valid BreadcrumbList plus Product JSON-LD", async ({ page }) => {
  const errors = watchBrowserErrors(page);

  for (const route of listRoutes) {
    const response = await page.goto(route.path);
    expect(response?.status(), route.path).toBe(200);

    // Canonical URL: the unfiltered list path, absolute (SEO-04).
    await expect(page.locator('link[rel="canonical"]'), route.path).toHaveAttribute(
      "href",
      `${origin}${route.path}`,
    );
    await expect(page.locator('meta[name="robots"]'), route.path).toHaveAttribute("content", /index/);

    // Visible breadcrumb trail ending on this route (SEO-05).
    const trail = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(trail, route.path).toBeVisible();
    await expect(trail.locator("li").last()).toContainText(route.crumbLabel);
    await expect(trail.locator("li").last().locator("[aria-current='page']")).toHaveText(route.crumbLabel);

    // One valid JSON-LD block with BreadcrumbList and the Product cards the page renders.
    const blocks = await structuredData(page);
    expect(blocks.length, `${route.path} JSON-LD blocks`).toBe(1);
    expect(blocks[0].context).toBe("https://schema.org");

    const breadcrumbs = nodeOfType(blocks[0].nodes, "BreadcrumbList");
    expect(breadcrumbs.length, `${route.path} BreadcrumbList`).toBe(1);
    expect(breadcrumbItemUrls(breadcrumbs[0])).toHaveLength(await trail.locator("li").count());
    expect(breadcrumbItemUrls(breadcrumbs[0]).at(-1)).toBe(`${origin}${route.path}`);

    const itemLists = nodeOfType(blocks[0].nodes, "ItemList");
    expect(itemLists.length, `${route.path} ItemList`).toBe(1);
    const items = itemLists[0].itemListElement as Array<{ position: number; item: JsonLdNode }>;
    const cards = page.getByTestId("laptop-card");
    await expect(cards, route.path).toHaveCount(route.cardCount);
    expect(items).toHaveLength(route.cardCount);
    expect(items.map((entry) => entry.position)).toEqual(
      Array.from({ length: route.cardCount }, (_unused, index) => index + 1),
    );

    const products = nodeOfType(
      items.map((entry) => entry.item),
      "Product",
    );
    expect(products, `${route.path} Product nodes`).toHaveLength(route.cardCount);
    const cardLinks = await cards.locator("a.laptop-card__title-link").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? ""),
    );
    expect(products.map((product) => product.url)).toEqual(
      cardLinks.map((href) => `${origin}${href}`),
    );
    for (const product of products) {
      expect(String(product.mpn)).toMatch(/^[A-Z0-9]/);
      expect(product.brand).toBeTruthy();
    }
  }

  // Pagination on the long list is real links, not buttons (SEO-10).
  await page.goto("/laptops");
  const pagination = page.getByRole("navigation", { name: "Pagination" });
  await expect(pagination.getByRole("link", { name: "Page 2" })).toHaveAttribute("href", /page=2/);
  await expect(pagination.getByRole("button")).toHaveCount(0);
  await page.screenshot({ path: `${screenshots}/seo-list-breadcrumb.png`, fullPage: true });

  expect(errors).toEqual([]);
});

test("the product page and the specs tab emit a canonical URL, the full trail and a Product node for their own URL", async ({ page }) => {
  const errors = watchBrowserErrors(page);

  for (const route of productRoutes) {
    const response = await page.goto(route.path);
    expect(response?.status(), route.path).toBe(200);

    await expect(page.locator('link[rel="canonical"]'), route.path).toHaveAttribute(
      "href",
      `${origin}${route.path}`,
    );

    const trail = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(trail.locator("li").last(), route.path).toContainText(route.crumbLabel);

    const blocks = await structuredData(page);
    expect(blocks.length, `${route.path} JSON-LD blocks`).toBe(1);
    expect(blocks[0].context).toBe("https://schema.org");

    const products = nodeOfType(blocks[0].nodes, "Product");
    expect(products, `${route.path} Product`).toHaveLength(1);
    expect(products[0].mpn).toBe("X1504VA-NJ521WS");
    expect(products[0].sku).toBe("X1504VA-NJ521WS");
    expect(products[0].url).toBe(`${origin}${route.path}`);
    expect((products[0].brand as { name?: string }).name).toBe("ASUS");

    const breadcrumbs = nodeOfType(blocks[0].nodes, "BreadcrumbList");
    expect(breadcrumbs, `${route.path} BreadcrumbList`).toHaveLength(1);
    expect(breadcrumbItemUrls(breadcrumbs[0]).at(-1)).toBe(`${origin}${route.path}`);
    expect(await trail.locator("li").count()).toBe(breadcrumbItemUrls(breadcrumbs[0]).length);
  }

  await page.screenshot({ path: `${screenshots}/seo-product-breadcrumb.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("robots.txt allows the site and names the sitemap; sitemap.xml parses as XML and lists the seeded products and lists", async ({ page, request }) => {
  const errors = watchBrowserErrors(page);

  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.status()).toBe(200);
  expect(robotsResponse.headers()["content-type"]).toContain("text/plain");
  const robots = await robotsResponse.text();
  expect(robots).toContain("User-Agent: *");
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Disallow: /api/");
  expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  expect(sitemapResponse.headers()["content-type"]).toContain("application/xml");
  const sitemapText = await sitemapResponse.text();

  // The served body is parsed as XML by a real parser: a malformed document yields a
  // parsererror node instead of a urlset root.
  const xml = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    const parserError = doc.getElementsByTagName("parsererror")[0];
    const root = doc.documentElement;
    return {
      parserError: parserError ? (parserError.textContent ?? "parse error").slice(0, 300) : null,
      rootName: root.nodeName,
      namespace: root.namespaceURI,
      locs: [...root.getElementsByTagName("loc")].map((node) => node.textContent ?? ""),
      lastMods: [...root.getElementsByTagName("lastmod")].map((node) => node.textContent ?? ""),
    };
  }, sitemapText);

  expect(xml.parserError).toBeNull();
  expect(xml.rootName).toBe("urlset");
  expect(xml.namespace).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");

  // 106 seeded products + /laptops + 12 brand lists + 5 curated budget bands.
  expect(xml.locs).toHaveLength(106 + 1 + 12 + 5);
  expect(new Set(xml.locs).size).toBe(xml.locs.length);
  expect(xml.lastMods).toHaveLength(xml.locs.length);
  for (const lastMod of xml.lastMods) {
    expect(Number.isNaN(Date.parse(lastMod)), lastMod).toBe(false);
  }

  for (const url of [
    `${origin}/laptops`,
    `${origin}/laptops/asus`,
    `${origin}/laptops/price/under/40000`,
    `${origin}/laptops/price/between/40000-60000`,
    `${origin}/laptop/${demoSlug}`,
  ]) {
    expect(xml.locs, url).toContain(url);
  }

  // Only canonical URLs: no sorted, filtered or paged variants.
  expect(xml.locs.some((url) => url.includes("?"))).toBe(false);
  expect(xml.locs.every((url) => url.startsWith(`${origin}/`))).toBe(true);

  // The browser can open the crawl file too (Chromium's XML viewer renders the document).
  const rendered = await page.goto("/sitemap.xml");
  expect(rendered?.status()).toBe(200);
  await page.screenshot({ path: `${screenshots}/sitemap-xml.png`, fullPage: true });
  expect(errors.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
});

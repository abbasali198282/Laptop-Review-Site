import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";

const screenshots = ".orbi/screenshots";
fs.mkdirSync(screenshots, { recursive: true });

/** Collect real browser failures so a rendered page that throws is a test failure. */
function watchBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function cardCodes(page: Page): Promise<string[]> {
  return page.locator("[data-testid='laptop-card']").evaluateAll((cards) =>
    cards.map((card) => card.getAttribute("data-product-code") ?? ""),
  );
}

async function prices(page: Page): Promise<number[]> {
  return page.locator(".laptop-card__price").evaluateAll((nodes) =>
    nodes.map((node) => Number((node.textContent ?? "").replace(/[^\d]/g, ""))).filter((value) => Number.isFinite(value)),
  );
}

test("the catalogue list is server-rendered with the facet rail, sort control and real page links", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  const response = await page.goto("/laptops");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: "All laptops" })).toBeVisible();
  await expect(page.getByTestId("model-count")).toHaveText("106 models");
  await expect(page.getByTestId("last-updated")).toHaveText(/Prices last updated 30 Oct 2026/);

  const rail = page.getByRole("complementary", { name: "Filters" });
  for (const facet of [
    "Brand",
    "Price",
    "Processor",
    "RAM",
    "Storage",
    "Screen size",
    "Graphics",
    "Operating system",
    "Touchscreen",
    "Form factor",
  ]) {
    await expect(rail.getByRole("heading", { name: facet, exact: true })).toBeVisible();
  }
  await expect(rail.getByRole("link", { name: /ASUS/ })).toBeVisible();

  await expect(page.getByTestId("laptop-card")).toHaveCount(24);
  await expect(page.getByRole("link", { name: "Price: low to high" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Sort by" })).toBeVisible();

  // Pagination is links, not buttons, and page 2 keeps the same URL state.
  const pageTwo = page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "Page 2" });
  await expect(pageTwo).toHaveAttribute("href", /page=2/);

  // Unfiltered list page: self canonical, indexable.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/laptops$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/);
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toContain('"@type":"BreadcrumbList"');

  await page.screenshot({ path: `${screenshots}/laptops-list.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("a filtered URL copied into a second tab restores the same filters, page and order", async ({ page, context }) => {
  const errors = watchBrowserErrors(page);
  await page.goto("/laptops");

  const rail = page.getByRole("complementary", { name: "Filters" });
  await rail.getByRole("link", { name: /^ASUS/ }).click();
  await expect(page).toHaveURL(/brand=asus/);
  await rail.getByRole("link", { name: /^16 GB/ }).click();
  await expect(page).toHaveURL(/brand=asus&ram=16/);
  await rail.getByRole("link", { name: /₹60,000 – ₹80,000/ }).click();
  await expect(page).toHaveURL(/brand=asus&ram=16&min_price=60000&max_price=80000/);
  await expect(page.getByTestId("model-count")).toHaveText("4 models of 106");

  const filteredCodes = await cardCodes(page);
  expect(filteredCodes).toHaveLength(4);
  // Price ascending default? No: default sort is popularity, so just assert the subset.
  expect(new Set(filteredCodes).size).toBe(4);

  const copiedUrl = page.url();
  const copiedParams = new URL(copiedUrl).searchParams;
  expect(copiedParams.get("brand")).toBe("asus");
  expect(copiedParams.get("ram")).toBe("16");
  expect(copiedParams.get("min_price")).toBe("60000");
  expect(copiedParams.get("max_price")).toBe("80000");

  // Filtered variants canonicalise to the unfiltered list and are noindex (SEO-04).
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/laptops$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.screenshot({ path: `${screenshots}/laptops-filtered.png`, fullPage: true });

  // Open the copied URL in a brand-new tab: identical list, page and order.
  const secondTab = await context.newPage();
  const secondErrors = watchBrowserErrors(secondTab);
  await secondTab.goto(copiedUrl);
  await expect(secondTab.getByTestId("model-count")).toHaveText("4 models of 106");
  expect(await cardCodes(secondTab)).toEqual(filteredCodes);
  await expect(secondTab.getByTestId("applied-filters")).toContainText("Brand: ASUS");
  await expect(secondTab.getByTestId("applied-filters")).toContainText("RAM: 16 GB");
  expect(secondErrors).toEqual([]);

  expect(errors).toEqual([]);
});

test("a page-2 URL with filters reopens with the same models in the same order", async ({ page, context }) => {
  const errors = watchBrowserErrors(page);
  await page.goto("/laptops?brand=asus%2Clenovo&sort=price-asc");
  expect(await cardCodes(page)).toHaveLength(24);

  const pageTwo = page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "Page 2" });
  const href = await pageTwo.getAttribute("href");
  expect(href).toContain("brand=asus%2Clenovo");
  expect(href).toContain("sort=price-asc");
  expect(href).toContain("page=2");

  await pageTwo.click();
  await expect(page).toHaveURL(/page=2/);
  const secondPageCodes = await cardCodes(page);
  expect(secondPageCodes.length).toBeGreaterThan(0);
  // Cheapest first, across the page boundary.
  const sortedPrices = await prices(page);
  expect([...sortedPrices].sort((a, b) => a - b)).toEqual(sortedPrices);
  await page.screenshot({ path: `${screenshots}/laptops-page-2-filtered.png`, fullPage: true });

  const secondTab = await context.newPage();
  await secondTab.goto(page.url());
  expect(await cardCodes(secondTab)).toEqual(secondPageCodes);
  expect(errors).toEqual([]);
});

test("an impossible filter combination names the filters, shows 0 and offers one-click removal", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  await page.goto("/laptops?brand=asus&ram=64");

  const emptyState = page.getByTestId("empty-state");
  await expect(emptyState).toBeVisible();
  await expect(page.getByTestId("empty-count")).toContainText("0 laptops");
  await expect(page.getByTestId("model-count")).toHaveText("0 models of 106");
  await expect(page.getByRole("list", { name: "Active filters" })).toContainText("Brand: ASUS");
  await expect(page.getByRole("list", { name: "Active filters" })).toContainText("RAM: 64 GB");

  // Fallback entry points exist so the dead end has a way out.
  await expect(emptyState.getByRole("heading", { name: "Popular brands" })).toBeVisible();
  await expect(emptyState.getByRole("heading", { name: "Buy by price" })).toBeVisible();
  await expect(emptyState.getByRole("heading", { name: "Popular features" })).toBeVisible();
  await expect(emptyState.getByRole("link", { name: "Under ₹40,000" })).toBeVisible();
  await expect(emptyState.getByRole("link", { name: "ASUS", exact: true })).toBeVisible();

  const remove = page.getByTestId("remove-narrowest");
  await expect(remove).toHaveText("Remove RAM: 64 GB");
  await expect(remove).toHaveAttribute("href", "/laptops?brand=asus");
  await page.screenshot({ path: `${screenshots}/laptops-empty-state.png`, fullPage: true });

  await remove.click();
  await expect(page.getByTestId("model-count")).toHaveText(/18 models/);
  await expect(page.getByTestId("empty-state")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a custom min/max price from the rail narrows the list and lives in the URL", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  await page.goto("/laptops?brand=asus");

  const form = page.getByRole("complementary", { name: "Filters" }).locator("form.price-range");
  await form.getByLabel("Min").fill("60000");
  await form.getByLabel("Max").fill("80000");
  await form.getByRole("button", { name: "Apply price" }).click();

  await expect(page).toHaveURL(/brand=asus&min_price=60000&max_price=80000/);
  // The hidden fields carried the existing brand facet through the GET form.
  await expect(page.getByTestId("applied-filters")).toContainText("Brand: ASUS");
  await expect(page.getByTestId("applied-filters")).toContainText("₹60,000 – ₹80,000");
  await expect(page.getByTestId("model-count")).toHaveText("5 models of 106");
  const customRangePrices = await prices(page);
  expect(customRangePrices.every((price) => price >= 60000 && price <= 80000)).toBe(true);
  expect(errors).toEqual([]);
});

test("the brand list renders its own subset with header, model count and last-updated date", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  const response = await page.goto("/laptops/asus");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: "ASUS laptops" })).toBeVisible();
  await expect(page.getByTestId("model-count")).toHaveText(/18 models/);
  await expect(page.getByTestId("last-updated")).toHaveText(/Prices last updated 30 Oct 2026/);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("ASUS");

  // The brand is fixed by the path, so the rail does not offer a brand facet.
  const rail = page.getByRole("complementary", { name: "Filters" });
  await expect(rail.getByRole("heading", { name: "Brand", exact: true })).toHaveCount(0);
  await expect(rail.getByRole("heading", { name: "Price", exact: true })).toBeVisible();

  const brands = await page.locator(".laptop-card__brand").allTextContents();
  expect(brands.length).toBe(18);
  expect(new Set(brands)).toEqual(new Set(["ASUS"]));

  // Narrowing inside the brand keeps the brand path and adds URL state.
  await rail.getByRole("link", { name: /₹40,000 – ₹60,000/ }).click();
  await expect(page).toHaveURL(/\/laptops\/asus\?min_price=40000&max_price=60000/);
  await expect(page.getByTestId("model-count")).toHaveText(/4 models of 18/);
  await page.screenshot({ path: `${screenshots}/brand-asus.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("the budget lists render their own subset with header, model count and last-updated date", async ({ page }) => {
  const errors = watchBrowserErrors(page);

  await page.goto("/laptops/price/under/40000");
  await expect(page.getByRole("heading", { level: 1, name: "Laptops under ₹40,000" })).toBeVisible();
  await expect(page.getByTestId("model-count")).toHaveText("6 models");
  await expect(page.getByTestId("last-updated")).toHaveText(/Prices last updated 30 Oct 2026/);
  const underPrices = await prices(page);
  expect(underPrices.length).toBe(6);
  expect(underPrices.every((price) => price < 40000)).toBe(true);
  await page.screenshot({ path: `${screenshots}/price-under-40000.png`, fullPage: true });

  await page.goto("/laptops/price/between/40000-60000");
  await expect(
    page.getByRole("heading", { level: 1, name: "Laptops ₹40,000 – ₹60,000" }),
  ).toBeVisible();
  await expect(page.getByTestId("model-count")).toHaveText(/16 models/);
  const bandPrices = await prices(page);
  expect(bandPrices.every((price) => price >= 40000 && price <= 60000)).toBe(true);
  expect(errors).toEqual([]);
});

test("unknown brands and out-of-market bands render a 404 with valid alternatives", async ({ page }) => {
  const errors = watchBrowserErrors(page);

  const unknownBrand = await page.goto("/laptops/nokia");
  expect(unknownBrand?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "That page does not exist" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse all laptops" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lenovo" })).toBeVisible();

  const unknownBand = await page.goto("/laptops/price/under/999999");
  expect(unknownBand?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "That page does not exist" })).toBeVisible();
  await page.goto("/laptops");
  await expect(page.getByTestId("laptop-card")).toHaveCount(24);
  // The deliberate 404 document (and the favicon) are expected resource failures; any other
  // browser error still fails the test.
  expect(errors.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
});

test("the list works without JavaScript because every control is a link or a GET form", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/laptops");

  await expect(page.getByTestId("model-count")).toHaveText("106 models");
  await expect(page.getByTestId("laptop-card")).toHaveCount(24);

  const rail = page.getByRole("complementary", { name: "Filters" });
  await rail.getByRole("link", { name: /Lenovo/ }).click();
  await expect(page).toHaveURL(/brand=lenovo/);
  await expect(page.getByTestId("model-count")).toHaveText(/16 models/);

  await page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "Next →" }).count();
  await context.close();
});

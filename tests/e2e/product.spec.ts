import { expect, test, type Locator, type Page } from "@playwright/test";
import fs from "node:fs";

const screenshots = ".orbi/screenshots";
fs.mkdirSync(screenshots, { recursive: true });

const demoSlug = "asus-vivobook-15-x1504va-x1504va-nj521ws";
const demoSpecsPath = `/laptop/${demoSlug}/specs`;
const sparseSlug = "asus-vivobook-15-x1504va-x1504va-nj321ws";

/** Collect real browser failures so a rendered page that throws is a test failure. */
function watchBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

function specRow(page: Page, specKey: string): Locator {
  return page.locator(`tr[data-spec-key="${specKey}"]`);
}

/** Tab with the real keyboard until `target` has focus, proving the control is in tab order. */
async function tabTo(page: Page, target: Locator, maxTabs = 300): Promise<void> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const focused = await target.evaluate((node) => node === document.activeElement);
    if (focused) return;
  }
  throw new Error(`Tab did not reach the target within ${maxTabs} presses`);
}

test("a visitor opens a laptop from the catalogue and reads the identity header, quick specs and lowest-price callout", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  await page.goto("/laptops");

  // The second seeded card is the X1504VA core i5 variant: same model as two other SKUs.
  const demoCard = page.getByTestId("laptop-card").nth(1);
  await expect(demoCard).toHaveAttribute("data-product-code", "X1504VA-NJ521WS");
  await demoCard.getByRole("link", { name: /Full specs and price/ }).click();

  await expect(page).toHaveURL(new RegExp(`/laptop/${demoSlug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vivobook 15 X1504VA");
  await expect(page.getByTestId("model-code")).toHaveText("X1504VA-NJ521WS");
  await expect(page.getByText("Manufacturer model code")).toBeVisible();
  await expect(page.getByText(/Released 15 Mar 2024/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("ASUS");

  const price = page.getByTestId("lowest-price");
  await expect(price).toContainText("₹62,990");
  await expect(price).toContainText("Amazon India");
  await expect(price).toContainText("observed 30 Oct 2026");

  const quickSpecs = page.getByTestId("quick-specs");
  await expect(quickSpecs).toContainText("15.6 inches");
  await expect(quickSpecs).toContainText("(39.6 cm)");
  await expect(quickSpecs).toContainText("Large");
  await expect(quickSpecs).toContainText("Core i5-1335U");
  await expect(quickSpecs).toContainText("16 GB");

  // Canonical, breadcrumb and Product structured data (SEO-01, SEO-05, SEO-06).
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    new RegExp(`/laptop/${demoSlug}$`),
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/);
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toContain('"@type":"Product"');
  expect(jsonLd).toContain('"mpn":"X1504VA-NJ521WS"');
  expect(jsonLd).toContain('"@type":"BreadcrumbList"');
  expect(jsonLd).toContain('"price":"62990.00"');

  await expect(page.getByTestId("spec-outline")).toContainText("General");
  await expect(page.getByTestId("spec-outline")).toContainText("Warranty");

  await page.screenshot({ path: `${screenshots}/product-overview.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("the specs tab groups every recorded spec, switches variants and asks for feedback on an empty group", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  const response = await page.goto(demoSpecsPath);
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: "Vivobook 15 X1504VA specifications" })).toBeVisible();
  await expect(page.getByTestId("model-code")).toHaveText("X1504VA-NJ521WS");

  for (const group of [
    "General",
    "Display",
    "Processor",
    "Graphics",
    "Memory",
    "Storage",
    "Battery",
    "Connectivity",
    "Input",
    "Audio",
    "Software",
    "Warranty",
  ]) {
    await expect(page.getByRole("heading", { level: 2, name: group, exact: true })).toBeVisible();
  }

  // The complete sheet records a value in every vendor group, so no group is empty here.
  await expect(page.getByTestId("spec-group-empty")).toHaveCount(0);

  const variantSwitch = page.getByTestId("variant-switch");
  await expect(variantSwitch).toBeVisible();
  await expect(variantSwitch.locator("li")).toHaveCount(3);
  await expect(variantSwitch).toContainText("(this variant)");
  await expect(variantSwitch.getByTestId("variant-link")).toHaveCount(2);
  await expect(variantSwitch.getByTestId("variant-link").first()).toHaveAttribute(
    "href",
    `/laptop/${sparseSlug}/specs`,
  );

  await page.screenshot({ path: `${screenshots}/product-specs.png`, fullPage: true });

  // Switching to the sibling SKU keeps the visitor on the same model's specs tab.
  await variantSwitch.getByTestId("variant-link").first().click();
  await expect(page).toHaveURL(new RegExp(`/laptop/${sparseSlug}/specs$`));
  await expect(page.getByTestId("model-code")).toHaveText("X1504VA-NJ321WS");

  // Sparse sheet: the vendor has published nothing for Warranty, so the group asks for feedback.
  const warranty = page.getByTestId("spec-group-warranty");
  await expect(warranty.getByTestId("spec-group-empty")).toBeVisible();
  await expect(warranty.getByRole("link", { name: "Send us this specification" })).toHaveAttribute(
    "href",
    new RegExp(`/corrections\\?kind=missing_spec&product=${sparseSlug}&group=warranty`),
  );

  expect(errors).toEqual([]);
});

test("present values, not-disclosed values and absent values use three distinct renderings with units, qualifiers and a conflict marker", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  await page.goto(demoSpecsPath);

  // Present number: value + unit, metric/imperial pair, editorial qualifier beside the value.
  const screen = specRow(page, "display.screen_size_in");
  await expect(screen).toContainText("15.6 inches");
  await expect(screen).toContainText("(39.6 cm)");
  await expect(screen.getByTestId("spec-qualifier")).toHaveText(/Large/);

  const weight = specRow(page, "general.weight_kg");
  await expect(weight).toContainText("1.7 kg");
  await expect(weight).toContainText("(3.7 lb)");
  await expect(weight.getByTestId("spec-qualifier")).toHaveText(/Light/);

  const brightness = specRow(page, "display.brightness_max");
  await expect(brightness).toContainText("250 nits");
  await expect(brightness.getByTestId("spec-qualifier")).toHaveText(/Dim/);

  // Not disclosed: italic text with the vendor tooltip, available on focus.
  const memoryType = specRow(page, "memory.memory_type");
  const notDisclosed = memoryType.locator(".spec-value__missing");
  await expect(notDisclosed.locator("em")).toHaveText("Not disclosed");
  await expect(notDisclosed.locator("em")).toHaveCSS("font-style", "italic");
  await expect(notDisclosed.locator(".spec-value__tooltip")).toBeHidden();
  await notDisclosed.focus();
  await expect(notDisclosed.locator(".spec-value__tooltip")).toBeVisible();
  await expect(notDisclosed.locator(".spec-value__tooltip")).toHaveText(
    "The vendor does not publish this specification.",
  );

  // Absent numeric: an em dash with the "does not have it" tooltip, not "Not disclosed".
  const maxRam = specRow(page, "memory.max_ram_gb").locator(".spec-value__missing");
  await expect(maxRam).toHaveText(/^—This product does not have it\.$/);
  await maxRam.focus();
  await expect(maxRam.locator(".spec-value__tooltip")).toBeVisible();
  await expect(maxRam.locator(".spec-value__tooltip")).toHaveText("This product does not have it.");

  // Absent boolean: `No`, same tooltip as the absent numeric, different from not-disclosed.
  const ethernet = specRow(page, "connectivity.ethernet").locator(".spec-value__missing");
  await expect(ethernet).toContainText("No");
  await ethernet.focus();
  await expect(ethernet.locator(".spec-value__tooltip")).toHaveText("This product does not have it.");

  // A present boolean `No` is not the absent state and carries no tooltip.
  const touch = specRow(page, "display.touchscreen");
  await expect(touch).toContainText("No");
  await expect(touch.locator(".spec-value__tooltip")).toHaveCount(0);

  // Conflicting value: warning marker with the correction-form link.
  const refresh = specRow(page, "display.refresh_rate_hz");
  await expect(refresh).toContainText("60 Hz");
  const conflict = refresh.getByTestId("spec-conflict");
  await expect(conflict).toBeVisible();
  await expect(conflict).toContainText("Conflicting sources");
  await expect(conflict.getByRole("link", { name: "Report a correction" })).toHaveAttribute(
    "href",
    new RegExp(`/corrections\\?kind=spec_correction&product=${demoSlug}&spec=display.refresh_rate_hz`),
  );

  await page.screenshot({ path: `${screenshots}/product-spec-states.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("spec help is reachable by keyboard alone and opens without hover", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  await page.goto(demoSpecsPath);

  const help = page.getByTestId("spec-help-display.brightness_max");
  const summary = help.locator("summary");
  const helpText = help.locator(".spec-help__text");
  await expect(helpText).toBeHidden();

  // Reach the spec name with Tab (no mouse), then open the definition with the keyboard.
  await tabTo(page, summary);
  await page.keyboard.press("Enter");
  await expect(helpText).toBeVisible();
  await expect(helpText).toContainText("300 nits is comfortable indoors");

  await page.screenshot({ path: `${screenshots}/product-specs-help.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("the conflicting-value warning leads to a working correction form, and an empty report is rejected", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  await page.goto(demoSpecsPath);

  await specRow(page, "display.refresh_rate_hz")
    .getByRole("link", { name: "Report a correction" })
    .click();

  await expect(page).toHaveURL(/\/corrections\?kind=spec_correction/);
  await expect(page.getByRole("heading", { level: 1, name: "Report a wrong specification" })).toBeVisible();
  await expect(page.getByTestId("correction-context")).toContainText("X1504VA-NJ521WS");
  await expect(page.getByTestId("correction-context")).toContainText("Refresh rate");

  const note = page.getByLabel("What is wrong or missing?");
  await expect(note).toHaveValue(/refresh rate value looks wrong/);
  await note.fill("The vendor sheet says 60 Hz but the retail listing says 90 Hz; please recheck the panel.");
  await page.screenshot({ path: `${screenshots}/correction-form.png`, fullPage: true });
  await page.getByRole("button", { name: "Send report" }).click();

  await expect(page).toHaveURL(/submitted=1/);
  await expect(page.getByTestId("correction-success")).toBeVisible();
  await expect(page.getByTestId("correction-success")).toContainText("moderation queue");

  // Server-side failure path: a note that is too short comes back with the error message.
  const rejected = await page.request.post("/api/corrections", {
    form: { kind: "spec_correction", product_slug: demoSlug, note: "short" },
    maxRedirects: 0,
  });
  expect(rejected.status()).toBe(303);
  const location = rejected.headers()["location"] ?? "";
  expect(location).toContain("error=note");
  await page.goto(location);
  await expect(page.getByTestId("correction-error")).toBeVisible();
  await expect(page.getByTestId("correction-error")).toContainText("at least 10 characters");

  expect(errors).toEqual([]);
});

test("an unknown laptop slug renders the 404 with a way back into the catalogue", async ({ page }) => {
  const errors = watchBrowserErrors(page);
  const response = await page.goto("/laptop/not-a-real-laptop-abc123");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "That page does not exist" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse all laptops" })).toBeVisible();
  expect(errors.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
});

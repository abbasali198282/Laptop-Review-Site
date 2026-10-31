/**
 * Deterministic seed: rebuilds db/catalogue.sqlite from db/schema.sql + data/laptops.json.
 * Seed content is versioned in the repository (vendor spec sheets + editorial entry, with the
 * observation date kept on every offer), so the catalogue the reviewer browses is reproducible.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const databasePath = process.env.CATALOGUE_DB_PATH ?? path.join(root, "db", "catalogue.sqlite");
const schemaPath = path.join(root, "db", "schema.sql");
const fixturePath = path.join(root, "data", "laptops.json");

type FixtureVariant = {
  code: string;
  cpuFamily: string;
  cpuModel: string;
  gpuFamily: string;
  gpuModel: string;
  ramGb: number;
  storageGb: number;
  storageType: string;
  os: string;
  screenSizeIn: number;
  touch: boolean;
  priceInr: number;
};

type FixtureFamily = {
  name: string;
  year: number;
  formFactor: string;
  releaseDate: string;
  variants: FixtureVariant[];
};

type FixtureBrand = {
  slug: string;
  name: string;
  description: string;
  families: FixtureFamily[];
};

type Fixture = {
  market: string;
  currency: string;
  observedAt: string;
  source: string;
  note: string;
  brands: FixtureBrand[];
};

const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Fixture;

if (fixture.currency !== "INR") {
  throw new Error(`Seed fixture currency must be INR for this market, got ${fixture.currency}`);
}

const retailers = [
  { slug: "flipkart", name: "Flipkart" },
  { slug: "amazon", name: "Amazon India" },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const storageLabel = (variant: FixtureVariant) =>
  `${variant.storageGb >= 1024 ? variant.storageGb / 1024 : variant.storageGb}${
    variant.storageGb >= 1024 ? "TB" : "GB"
  } ${variant.storageType.toUpperCase()}`;

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  fs.rmSync(`${databasePath}${suffix}`, { force: true });
}

const db = new DatabaseSync(databasePath);
db.exec(fs.readFileSync(schemaPath, "utf8"));

const now = fixture.observedAt;
let modelCount = 0;
let productCount = 0;
let variantCount = 0;

db.exec("BEGIN");
try {
  const insertBrand = db.prepare(
    "INSERT INTO brand (slug, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
  );
  const insertModel = db.prepare(
    "INSERT INTO model (brand_id, name, category, year, form_factor, release_date, status, created_at, updated_at) VALUES (?, ?, 'laptop', ?, ?, ?, 'available', ?, ?)",
  );
  const insertProduct = db.prepare(
    "INSERT INTO product (model_id, slug, model_code, display_name, launch_price_minor, currency, lowest_price_minor, lowest_price_updated_at, market_status, popularity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?)",
  );
  const insertVariant = db.prepare(
    "INSERT INTO variant (product_id, code, cpu_family, cpu_model, gpu_family, gpu_model, ram_gb, storage_gb, storage_type, os, screen_size_in, touch, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
  );
  const insertRetailer = db.prepare(
    "INSERT INTO retailer (slug, name, market, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
  );
  const insertOffer = db.prepare(
    "INSERT INTO offer (variant_id, retailer_id, price_minor, currency, in_stock, observed_at, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)",
  );

  const retailerIds = new Map<string, number>();
  for (const retailer of retailers) {
    const result = insertRetailer.run(retailer.slug, retailer.name, fixture.market, now, now);
    retailerIds.set(retailer.slug, Number(result.lastInsertRowid));
  }

  for (const brand of fixture.brands) {
    const brandResult = insertBrand.run(brand.slug, brand.name, brand.description, now, now);
    const brandId = Number(brandResult.lastInsertRowid);

    for (const family of brand.families) {
      const modelIndex = modelCount++;
      const modelResult = insertModel.run(
        brandId,
        family.name,
        family.year,
        family.formFactor,
        family.releaseDate,
        now,
        now,
      );
      const modelId = Number(modelResult.lastInsertRowid);

      family.variants.forEach((variant, variantIndex) => {
        const productIndex = productCount++;
        const popularity = 500 - modelIndex * 4 - variantIndex;
        // One product page per SKU family variant (PROMPT.md §5.3); the default variant is
        // the one the list row shows.
        const displayName = `${brand.name} ${family.name} (${variant.cpuModel}/${variant.ramGb}GB/${storageLabel(
          variant,
        )})`;
        const slug = `${brand.slug}-${slugify(family.name)}-${slugify(variant.code)}`;
        const priceMinor = variant.priceInr * 100;

        const productResult = insertProduct.run(
          modelId,
          slug,
          variant.code,
          displayName,
          priceMinor,
          fixture.currency,
          priceMinor,
          now,
          popularity,
          now,
          now,
        );
        const productId = Number(productResult.lastInsertRowid);

        const variantResult = insertVariant.run(
          productId,
          variant.code,
          variant.cpuFamily,
          variant.cpuModel,
          variant.gpuFamily,
          variant.gpuModel,
          variant.ramGb,
          variant.storageGb,
          variant.storageType,
          variant.os,
          variant.screenSizeIn,
          variant.touch ? 1 : 0,
          now,
          now,
        );
        variantCount++;
        const variantId = Number(variantResult.lastInsertRowid);

        const retailerSlug = retailers[productIndex % retailers.length].slug;
        insertOffer.run(
          variantId,
          retailerIds.get(retailerSlug)!,
          priceMinor,
          fixture.currency,
          now,
          now,
          now,
        );
      });
    }
  }

  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

const count = (table: string) =>
  Number((db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n);

console.log(
  `Seeded ${path.relative(root, databasePath)}: ${count("brand")} brands, ${count(
    "model",
  )} models, ${count("product")} products, ${variantCount} variants, ${count(
    "offer",
  )} offers (observed ${now}).`,
);

if (count("product") < 100) {
  throw new Error(`Seed produced ${count("product")} products; the catalogue needs more than 100.`);
}

db.close();

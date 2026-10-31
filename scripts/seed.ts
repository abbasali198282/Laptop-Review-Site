/**
 * Deterministic seed: rebuilds db/catalogue.sqlite from db/schema.sql + data/laptops.json.
 * Seed content is versioned in the repository (vendor spec sheets + editorial entry, with the
 * observation date kept on every offer), so the catalogue the reviewer browses is reproducible.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formFactorLabels, gpuFamilyLabels, osLabels } from "../lib/config";
import { specGroups, specKeyMap, specKeys } from "../lib/spec-taxonomy";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const databasePath = process.env.CATALOGUE_DB_PATH ?? path.join(root, "db", "catalogue.sqlite");
const schemaPath = path.join(root, "db", "schema.sql");
const fixturePath = path.join(root, "data", "laptops.json");
const specSheetsPath = path.join(root, "data", "spec-sheets.json");

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

type FixtureSpecValue = {
  specKey: string;
  state: "present" | "not_disclosed" | "absent";
  valueNumber?: number;
  valueText?: string;
  valueBool?: boolean;
  unit?: string;
  rawValue?: string;
  confidence?: "verified" | "unverified" | "conflicting";
};

type FixtureSpecSheet = {
  variantCode: string;
  source: string;
  sourceUrl?: string;
  values: FixtureSpecValue[];
};

type SpecSheetFixture = {
  note: string;
  sheets: FixtureSpecSheet[];
};

const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Fixture;
const specSheetFixture = JSON.parse(fs.readFileSync(specSheetsPath, "utf8")) as SpecSheetFixture;

if (fixture.currency !== "INR") {
  throw new Error(`Seed fixture currency must be INR for this market, got ${fixture.currency}`);
}

const sheetsByCode = new Map(specSheetFixture.sheets.map((sheet) => [sheet.variantCode, sheet]));

/** One spec value as it is written to `spec_value`. */
type SeedSpecValue = {
  specKey: string;
  state: "present" | "not_disclosed" | "absent";
  valueNumber: number | null;
  valueText: string | null;
  valueBool: boolean | null;
  unit: string | null;
  rawValue: string | null;
  source: string;
  sourceUrl: string | null;
  confidence: "verified" | "unverified" | "conflicting";
};

function specValue(
  specKey: string,
  partial: Partial<Omit<SeedSpecValue, "specKey">> = {},
): SeedSpecValue {
  const definition = specKeyMap.get(specKey);
  if (!definition) {
    throw new Error(`Seed spec value uses an unknown spec key: ${specKey}`);
  }
  return {
    specKey,
    state: "present",
    valueNumber: null,
    valueText: null,
    valueBool: null,
    unit: definition.unit,
    rawValue: null,
    source: "vendor_spec_sheet",
    sourceUrl: null,
    confidence: "verified",
    ...partial,
  };
}

/** What the variant row already tells us, recorded as the baseline vendor sheet for a product. */
function derivedSpecValues(variant: FixtureVariant, family: FixtureFamily): SeedSpecValue[] {
  return [
    specValue("general.model_code", { valueText: variant.code, rawValue: variant.code }),
    specValue("general.release_date", { valueText: family.releaseDate, rawValue: family.releaseDate }),
    specValue("general.form_factor", {
      valueText: formFactorLabels[family.formFactor] ?? family.formFactor,
      rawValue: family.formFactor,
    }),
    specValue("display.screen_size_in", { valueNumber: variant.screenSizeIn, unit: "inches" }),
    specValue("display.touchscreen", { valueBool: variant.touch }),
    specValue("processor.cpu_family", { valueText: variant.cpuFamily }),
    specValue("processor.cpu_model", { valueText: variant.cpuModel }),
    specValue("graphics.gpu_model", {
      valueText: variant.gpuModel || gpuFamilyLabels[variant.gpuFamily] || variant.gpuFamily,
    }),
    specValue("memory.ram_gb", { valueNumber: variant.ramGb, unit: "GB" }),
    specValue("storage.capacity_gb", { valueNumber: variant.storageGb, unit: "GB" }),
    specValue("storage.type", { valueText: variant.storageType.toUpperCase() }),
    specValue("software.os", {
      valueText: osLabels[variant.os] ?? variant.os,
      rawValue: variant.os,
    }),
  ];
}

function sheetSpecValues(sheet: FixtureSpecSheet): SeedSpecValue[] {
  return sheet.values.map((value) => {
    if (value.state === "present" && value.valueNumber === undefined && value.valueText === undefined && value.valueBool === undefined) {
      throw new Error(`${sheet.variantCode} records ${value.specKey} as present without a value`);
    }
    return specValue(value.specKey, {
      state: value.state,
      valueNumber: value.valueNumber ?? null,
      valueText: value.valueText ?? null,
      valueBool: value.valueBool ?? null,
      unit: value.unit ?? specKeyMap.get(value.specKey)?.unit ?? null,
      rawValue: value.rawValue ?? null,
      source: sheet.source,
      sourceUrl: sheet.sourceUrl ?? null,
      confidence: value.confidence ?? "verified",
    });
  });
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
let specValueCount = 0;
const seededSheetCodes = new Set<string>();

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
  const insertSpecGroup = db.prepare(
    "INSERT INTO spec_group (key, label, sort_order, category) VALUES (?, ?, ?, 'laptop')",
  );
  const insertSpecKey = db.prepare(
    "INSERT INTO spec_key (key, group_key, label, value_type, unit, unit_family, direction, comparable, help_text, qualifier_buckets, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const insertSpecValue = db.prepare(
    "INSERT INTO spec_value (product_id, spec_key, state, value_number, value_text, value_bool, unit, raw_value, source, source_url, confidence, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );

  specGroups.forEach((group, index) => {
    insertSpecGroup.run(group.key, group.label, index);
  });
  specKeys.forEach((key, index) => {
    insertSpecKey.run(
      key.key,
      key.group,
      key.label,
      key.valueType,
      key.unit,
      key.unitFamily,
      key.direction ?? "neutral",
      key.comparable === false ? 0 : 1,
      key.helpText,
      key.qualifierBuckets ? JSON.stringify(key.qualifierBuckets) : null,
      index,
    );
  });

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

        // Baseline vendor-sheet values from the variant row, then the explicit demo sheet
        // overrides (and adds) values for products with a complete specification sheet.
        const values = new Map<string, SeedSpecValue>();
        for (const value of derivedSpecValues(variant, family)) {
          values.set(value.specKey, value);
        }
        const sheet = sheetsByCode.get(variant.code);
        if (sheet) {
          seededSheetCodes.add(variant.code);
          for (const value of sheetSpecValues(sheet)) {
            values.set(value.specKey, value);
          }
        }
        for (const value of values.values()) {
          insertSpecValue.run(
            productId,
            value.specKey,
            value.state,
            value.valueNumber,
            value.valueText,
            value.valueBool === null ? null : value.valueBool ? 1 : 0,
            value.unit,
            value.rawValue,
            value.source,
            value.sourceUrl,
            value.confidence,
            now,
            now,
          );
          specValueCount++;
        }
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
  )} offers, ${specValueCount} spec values across ${count("spec_key")} spec keys (observed ${now}).`,
);

const completeSheets = specSheetFixture.sheets.length;
if (completeSheets === 0) {
  throw new Error("The seed needs at least one complete vendor spec sheet to exercise the specs tab.");
}
for (const sheet of specSheetFixture.sheets) {
  if (!seededSheetCodes.has(sheet.variantCode)) {
    throw new Error(`data/spec-sheets.json references an unknown variant code: ${sheet.variantCode}`);
  }
}

if (count("product") < 100) {
  throw new Error(`Seed produced ${count("product")} products; the catalogue needs more than 100.`);
}

db.close();

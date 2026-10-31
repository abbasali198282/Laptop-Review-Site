/**
 * SQLite catalogue access. The relational shape follows PROMPT.md §5
 * (brand → model → product → variant, retailer → offer).
 *
 * The driver is Node's built-in `node:sqlite`: the environment this slice runs in has no
 * Postgres server, and the ticket must work from the documented command. Routes and query
 * logic only see `CatalogueRow[]`, so replacing this file with a Prisma/Postgres reader is
 * a local change.
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import type { CatalogueRow } from "./types";
import type {
  QualifierBucket,
  SpecConfidence,
  SpecState,
  SpecValueInput,
  SpecValueType,
} from "./specs";

export const databasePath =
  process.env.CATALOGUE_DB_PATH ?? path.join(process.cwd(), "db", "catalogue.sqlite");

type SqliteRow = {
  product_id: number;
  slug: string;
  model_code: string;
  display_name: string;
  brand_slug: string;
  brand_name: string;
  model_name: string;
  year: number;
  form_factor: string;
  release_date: string;
  cpu_family: string;
  cpu_model: string;
  gpu_family: string;
  gpu_model: string | null;
  ram_gb: number;
  storage_gb: number;
  storage_type: string;
  os: string;
  screen_size_in: number;
  touch: number;
  price_minor: number | null;
  currency: string;
  popularity: number;
  updated_at: string;
};

const CATALOGUE_SQL = `
  SELECT
    p.id            AS product_id,
    p.slug          AS slug,
    p.model_code    AS model_code,
    p.display_name  AS display_name,
    b.slug          AS brand_slug,
    b.name          AS brand_name,
    m.name          AS model_name,
    m.year          AS year,
    m.form_factor   AS form_factor,
    m.release_date  AS release_date,
    v.cpu_family    AS cpu_family,
    v.cpu_model     AS cpu_model,
    v.gpu_family    AS gpu_family,
    v.gpu_model     AS gpu_model,
    v.ram_gb        AS ram_gb,
    v.storage_gb    AS storage_gb,
    v.storage_type  AS storage_type,
    v.os            AS os,
    v.screen_size_in AS screen_size_in,
    v.touch         AS touch,
    p.lowest_price_minor AS price_minor,
    p.currency      AS currency,
    p.popularity    AS popularity,
    p.lowest_price_updated_at AS updated_at
  FROM product p
  JOIN model m  ON m.id = p.model_id
  JOIN brand b  ON b.id = m.brand_id
  JOIN variant v ON v.product_id = p.id AND v.is_default = 1
  WHERE p.market_status <> 'discontinued'
  ORDER BY p.id
`;

const globalForDb = globalThis as unknown as { __catalogueDb?: DatabaseSync };

function connection(): DatabaseSync {
  if (!globalForDb.__catalogueDb) {
    try {
      globalForDb.__catalogueDb = new DatabaseSync(databasePath, { readOnly: true });
    } catch (error) {
      throw new Error(
        `Catalogue database not found at ${databasePath}. Run \`npm run seed\` to build it. ` +
          `(${(error as Error).message})`,
      );
    }
  }
  return globalForDb.__catalogueDb;
}

export function loadCatalogueRows(): CatalogueRow[] {
  const rows = connection().prepare(CATALOGUE_SQL).all() as unknown as SqliteRow[];
  return rows.map((row) => ({
    productId: row.product_id,
    slug: row.slug,
    modelCode: row.model_code,
    displayName: row.display_name,
    brandSlug: row.brand_slug,
    brandName: row.brand_name,
    modelName: row.model_name,
    year: row.year,
    formFactor: row.form_factor,
    releaseDate: row.release_date,
    cpuFamily: row.cpu_family,
    cpuModel: row.cpu_model,
    gpuFamily: row.gpu_family,
    gpuModel: row.gpu_model,
    ramGb: row.ram_gb,
    storageGb: row.storage_gb,
    storageType: row.storage_type,
    os: row.os,
    screenSizeIn: row.screen_size_in,
    touch: row.touch === 1,
    priceMinor: row.price_minor,
    currency: row.currency,
    popularity: row.popularity,
    updatedAt: row.updated_at,
  }));
}

/* ---------------------------------------------------------------------------------------
 * One product page (routes 4.1.7 and 4.1.9)
 * ------------------------------------------------------------------------------------- */

export type OfferRow = {
  offerId: number;
  retailerName: string;
  priceMinor: number;
  currency: string;
  observedAt: string;
};

/** Another SKU of the same model, used by the variant switch (DB-04). */
export type VariantLink = {
  productId: number;
  slug: string;
  modelCode: string;
  cpuModel: string;
  ramGb: number;
  storageGb: number;
  storageType: string;
  isCurrent: boolean;
};

export type ProductDetail = {
  productId: number;
  slug: string;
  modelCode: string;
  displayName: string;
  brandSlug: string;
  brandName: string;
  modelName: string;
  year: number;
  formFactor: string;
  releaseDate: string;
  /** Cached lowest price; the offers list carries the retailer and observation date. */
  lowestPriceMinor: number | null;
  /** Every product of the same model, current one included and flagged. */
  variants: VariantLink[];
  /** In-stock offers for this product's variants, cheapest first. */
  offers: OfferRow[];
};

/** A recorded spec value joined to its taxonomy row: everything the specs tab needs. */
export type SpecValueRow = SpecValueInput & {
  groupKey: string;
  groupLabel: string;
  groupOrder: number;
  helpText: string;
  source: string;
};

type ProductSqliteRow = {
  product_id: number;
  model_id: number;
  slug: string;
  model_code: string;
  display_name: string;
  brand_slug: string;
  brand_name: string;
  model_name: string;
  year: number;
  form_factor: string;
  release_date: string;
  lowest_price_minor: number | null;
};

const PRODUCT_SQL = `
  SELECT
    p.id AS product_id, p.model_id AS model_id, p.slug AS slug, p.model_code AS model_code,
    p.display_name AS display_name, p.lowest_price_minor AS lowest_price_minor,
    b.slug AS brand_slug, b.name AS brand_name,
    m.name AS model_name, m.year AS year, m.form_factor AS form_factor,
    m.release_date AS release_date
  FROM product p
  JOIN model m ON m.id = p.model_id
  JOIN brand b ON b.id = m.brand_id
  WHERE p.slug = ?
`;

const VARIANT_LINKS_SQL = `
  SELECT p.id AS product_id, p.slug AS slug, p.model_code AS model_code,
         v.cpu_model AS cpu_model, v.ram_gb AS ram_gb,
         v.storage_gb AS storage_gb, v.storage_type AS storage_type
  FROM product p
  JOIN variant v ON v.product_id = p.id AND v.is_default = 1
  WHERE p.model_id = ?
  ORDER BY p.id
`;

const OFFERS_SQL = `
  SELECT o.id AS offer_id, r.name AS retailer_name, o.price_minor AS price_minor,
         o.currency AS currency, o.observed_at AS observed_at
  FROM offer o
  JOIN retailer r ON r.id = o.retailer_id
  JOIN variant v ON v.id = o.variant_id
  WHERE v.product_id = ? AND o.in_stock = 1
  ORDER BY o.price_minor ASC, o.id ASC
`;

const SPEC_VALUES_SQL = `
  SELECT sv.spec_key AS spec_key, k.group_key AS group_key, g.label AS group_label,
         g.sort_order AS group_order, k.label AS label,
         k.value_type AS value_type, COALESCE(sv.unit, k.unit) AS unit,
         k.help_text AS help_text, k.qualifier_buckets AS qualifier_buckets,
         sv.state AS state, sv.value_number AS value_number, sv.value_text AS value_text,
         sv.value_bool AS value_bool, sv.confidence AS confidence, sv.source AS source
  FROM spec_value sv
  JOIN spec_key k ON k.key = sv.spec_key
  JOIN spec_group g ON g.key = k.group_key
  WHERE sv.product_id = ? OR sv.variant_id IN (SELECT id FROM variant WHERE product_id = ?)
  ORDER BY g.sort_order, k.sort_order, sv.id
`;

function parseQualifierBuckets(value: string | null): QualifierBucket[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as QualifierBucket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadProductBySlug(slug: string): ProductDetail | null {
  const db = connection();
  const product = db.prepare(PRODUCT_SQL).get(slug) as ProductSqliteRow | undefined;
  if (!product) return null;

  const variantRows = db
    .prepare(VARIANT_LINKS_SQL)
    .all(product.model_id) as unknown as Array<{
    product_id: number;
    slug: string;
    model_code: string;
    cpu_model: string;
    ram_gb: number;
    storage_gb: number;
    storage_type: string;
  }>;

  const offerRows = db.prepare(OFFERS_SQL).all(product.product_id) as unknown as Array<{
    offer_id: number;
    retailer_name: string;
    price_minor: number;
    currency: string;
    observed_at: string;
  }>;

  return {
    productId: product.product_id,
    slug: product.slug,
    modelCode: product.model_code,
    displayName: product.display_name,
    brandSlug: product.brand_slug,
    brandName: product.brand_name,
    modelName: product.model_name,
    year: product.year,
    formFactor: product.form_factor,
    releaseDate: product.release_date,
    lowestPriceMinor: product.lowest_price_minor,
    variants: variantRows.map((row) => ({
      productId: row.product_id,
      slug: row.slug,
      modelCode: row.model_code,
      cpuModel: row.cpu_model,
      ramGb: row.ram_gb,
      storageGb: row.storage_gb,
      storageType: row.storage_type,
      isCurrent: row.product_id === product.product_id,
    })),
    offers: offerRows.map((row) => ({
      offerId: row.offer_id,
      retailerName: row.retailer_name,
      priceMinor: row.price_minor,
      currency: row.currency,
      observedAt: row.observed_at,
    })),
  };
}

export function loadSpecValues(productId: number): SpecValueRow[] {
  const rows = connection()
    .prepare(SPEC_VALUES_SQL)
    .all(productId, productId) as unknown as Array<{
    spec_key: string;
    group_key: string;
    group_label: string;
    group_order: number;
    label: string;
    value_type: SpecValueType;
    unit: string | null;
    help_text: string;
    qualifier_buckets: string | null;
    state: SpecState;
    value_number: number | null;
    value_text: string | null;
    value_bool: number | null;
    confidence: SpecConfidence;
    source: string;
  }>;

  return rows.map((row) => ({
    specKey: row.spec_key,
    label: row.label,
    valueType: row.value_type,
    unit: row.unit,
    state: row.state,
    valueNumber: row.value_number,
    valueText: row.value_text,
    valueBool: row.value_bool === null ? null : row.value_bool === 1,
    qualifierBuckets: parseQualifierBuckets(row.qualifier_buckets),
    confidence: row.confidence,
    groupKey: row.group_key,
    groupLabel: row.group_label,
    groupOrder: row.group_order,
    helpText: row.help_text,
    source: row.source,
  }));
}

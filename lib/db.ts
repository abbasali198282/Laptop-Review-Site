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

const databasePath =
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

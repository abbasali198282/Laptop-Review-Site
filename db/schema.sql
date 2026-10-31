-- Catalogue schema for the seeded MVP market (PROMPT.md §5.1–5.4, §5.7).
-- Built by `npm run seed`; re-running rebuilds the file from data/laptops.json.

PRAGMA foreign_keys = ON;

CREATE TABLE brand (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE model (
  id           INTEGER PRIMARY KEY,
  brand_id     INTEGER NOT NULL REFERENCES brand (id),
  name         TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'laptop',
  year         INTEGER NOT NULL,
  form_factor  TEXT NOT NULL,
  release_date TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'available',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX model_brand_idx ON model (brand_id);

CREATE TABLE product (
  id                       INTEGER PRIMARY KEY,
  model_id                 INTEGER NOT NULL REFERENCES model (id),
  slug                     TEXT NOT NULL UNIQUE,
  model_code               TEXT NOT NULL,
  display_name             TEXT NOT NULL,
  launch_price_minor       INTEGER,
  currency                 TEXT NOT NULL DEFAULT 'INR',
  lowest_price_minor       INTEGER,
  lowest_price_updated_at  TEXT,
  market_status            TEXT NOT NULL DEFAULT 'available',
  popularity               INTEGER NOT NULL DEFAULT 0,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);
CREATE INDEX product_model_idx ON product (model_id);
CREATE INDEX product_price_idx ON product (lowest_price_minor);

CREATE TABLE variant (
  id             INTEGER PRIMARY KEY,
  product_id     INTEGER NOT NULL REFERENCES product (id),
  code           TEXT NOT NULL,
  cpu_family     TEXT NOT NULL,
  cpu_model      TEXT NOT NULL,
  gpu_family     TEXT NOT NULL,
  gpu_model      TEXT,
  ram_gb         INTEGER NOT NULL,
  storage_gb     INTEGER NOT NULL,
  storage_type   TEXT NOT NULL,
  os             TEXT NOT NULL,
  screen_size_in REAL NOT NULL,
  touch          INTEGER NOT NULL DEFAULT 0,
  is_default     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX variant_product_idx ON variant (product_id);

CREATE TABLE retailer (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  market      TEXT NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE offer (
  id           INTEGER PRIMARY KEY,
  variant_id   INTEGER NOT NULL REFERENCES variant (id),
  retailer_id  INTEGER NOT NULL REFERENCES retailer (id),
  price_minor  INTEGER NOT NULL,
  currency     TEXT NOT NULL,
  in_stock     INTEGER NOT NULL DEFAULT 1,
  observed_at  TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX offer_variant_idx ON offer (variant_id);

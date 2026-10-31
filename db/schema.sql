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

-- Spec taxonomy (PROMPT.md §5.5): vendor spec groups and the comparable spec keys.
CREATE TABLE spec_group (
  key        TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  category   TEXT NOT NULL DEFAULT 'laptop'
);

CREATE TABLE spec_key (
  key               TEXT PRIMARY KEY,
  group_key         TEXT NOT NULL REFERENCES spec_group (key),
  label             TEXT NOT NULL,
  value_type        TEXT NOT NULL,
  unit              TEXT,
  unit_family       TEXT,
  direction         TEXT NOT NULL DEFAULT 'neutral',
  comparable        INTEGER NOT NULL DEFAULT 1,
  help_text         TEXT NOT NULL,
  qualifier_buckets TEXT,
  sort_order        INTEGER NOT NULL
);
CREATE INDEX spec_key_group_idx ON spec_key (group_key);

-- One recorded spec value per product/variant and spec key (PROMPT.md §5.6).
CREATE TABLE spec_value (
  id           INTEGER PRIMARY KEY,
  product_id   INTEGER REFERENCES product (id),
  variant_id   INTEGER REFERENCES variant (id),
  spec_key     TEXT NOT NULL REFERENCES spec_key (key),
  state        TEXT NOT NULL,
  value_number REAL,
  value_text   TEXT,
  value_bool   INTEGER,
  unit         TEXT,
  raw_value    TEXT,
  source       TEXT NOT NULL,
  source_url   TEXT,
  confidence   TEXT NOT NULL DEFAULT 'unverified',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  CHECK (product_id IS NOT NULL OR variant_id IS NOT NULL)
);
CREATE INDEX spec_value_product_idx ON spec_value (product_id);
CREATE INDEX spec_value_variant_idx ON spec_value (variant_id);

-- Data-correction queue behind DB-14 / COMM-07 (no account required).
CREATE TABLE moderation_item (
  id              INTEGER PRIMARY KEY,
  kind            TEXT NOT NULL,
  product_id      INTEGER REFERENCES product (id),
  spec_key        TEXT,
  payload         TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT 'pending',
  resolution_note TEXT,
  resolved_by     TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX moderation_item_state_idx ON moderation_item (state);

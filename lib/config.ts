/**
 * Market and list configuration (PROMPT.md §11 decision 2: one market, INR display).
 * Bucket boundaries live in config, not in templates, so editorial can retune them
 * without touching a route (LOC-03).
 */

export type PriceBucket = {
  key: string;
  label: string;
  minMinor: number;
  maxMinor: number;
};

const rupee = (amount: number) => amount * 100;

export const market = {
  code: "IN",
  currency: "INR",
  locale: "en-IN",
  /** Highest amount the budget routes accept; anything above is outside the market config. */
  maxPriceMinor: rupee(300000),
  pageSize: 24,
} as const;

/** Curated price bands; the crawlable set the budget routes and facet rail link to. */
export const priceBuckets: PriceBucket[] = [
  { key: "under-40000", label: "Under ₹40,000", minMinor: 0, maxMinor: rupee(40000) },
  { key: "40000-60000", label: "₹40,000 – ₹60,000", minMinor: rupee(40000), maxMinor: rupee(60000) },
  { key: "60000-80000", label: "₹60,000 – ₹80,000", minMinor: rupee(60000), maxMinor: rupee(80000) },
  { key: "80000-100000", label: "₹80,000 – ₹1,00,000", minMinor: rupee(80000), maxMinor: rupee(100000) },
  { key: "over-100000", label: "Over ₹1,00,000", minMinor: rupee(100000), maxMinor: rupee(300000) },
];

/** URL href for a curated band: under/over use the single-amount route, the rest the range route. */
export function priceBucketHref(bucket: PriceBucket): string {
  if (bucket.minMinor === 0) {
    return `/laptops/price/under/${bucket.maxMinor / 100}`;
  }
  return `/laptops/price/between/${bucket.minMinor / 100}-${bucket.maxMinor / 100}`;
}

export const sortOptions = [
  { key: "popular", label: "Most popular" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "newest", label: "Newest first" },
] as const;

export type SortKey = (typeof sortOptions)[number]["key"];

export const defaultSort: SortKey = "popular";

/** Canonical display order for CPU families, derived from the spec taxonomy order. */
export const cpuFamilyOrder = [
  "Intel Core i3",
  "Intel Core i5",
  "Intel Core i7",
  "Intel Core i9",
  "Intel Core Ultra 5",
  "Intel Core Ultra 7",
  "Intel Core Ultra 9",
  "AMD Ryzen 3",
  "AMD Ryzen 5",
  "AMD Ryzen 7",
  "AMD Ryzen 9",
  "AMD Ryzen AI 9",
  "Apple M2",
  "Apple M3",
  "Apple M3 Pro",
  "Apple M4 Pro",
  "Qualcomm Snapdragon X",
];

export const gpuFamilyLabels: Record<string, string> = {
  integrated: "Integrated graphics",
  nvidia: "NVIDIA GeForce",
  amd: "AMD Radeon",
  apple: "Apple GPU",
};

export const osLabels: Record<string, string> = {
  "windows-11-home": "Windows 11 Home",
  "windows-11-pro": "Windows 11 Pro",
  macos: "macOS",
  chromeos: "ChromeOS",
};

export const formFactorLabels: Record<string, string> = {
  clamshell: "Clamshell",
  convertible: "Convertible",
  detachable: "Detachable",
  chromebook: "Chromebook",
  gaming: "Gaming",
};

export const touchLabels: Record<string, string> = {
  yes: "Touchscreen",
  no: "No touchscreen",
};

/** Screen-size bands, matched against `variant.screen_size_in`. */
export const screenBands = [
  { key: "13", label: '13" and smaller', min: 0, max: 13.5 },
  { key: "14", label: '14"', min: 13.5, max: 14.6 },
  { key: "15", label: '15"', min: 14.6, max: 15.7 },
  { key: "16", label: '16" and larger', min: 15.7, max: 100 },
] as const;

/**
 * Parse a budget route amount (whole rupees). Returns null when the amount is not a positive
 * integer inside the market config, which the route turns into a 404 with valid alternatives.
 */
export function parseBudgetAmount(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  if (amount > market.maxPriceMinor / 100) return null;
  return amount;
}

/** Parse a `{min}-{max}` budget range (whole rupees), or null when it is outside the market. */
export function parseBudgetRange(value: string): { min: number; max: number } | null {
  const match = /^(\d+)-(\d+)$/.exec(value);
  if (!match) return null;
  const min = parseBudgetAmount(match[1]);
  const max = parseBudgetAmount(match[2]);
  if (min === null || max === null || min >= max) return null;
  return { min, max };
}


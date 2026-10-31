/**
 * Catalogue query layer: filters, facet counts, sort, pagination and the empty-state escape
 * route. Pure functions over `CatalogueRow[]` so the whole list contract is unit-testable
 * (PROMPT.md §8.4: counts are computed with all *other* filters applied).
 */
import {
  defaultSort,
  market,
  priceBucketHref,
  priceBuckets,
  screenBands,
  sortOptions,
  type SortKey,
} from "./config";
import {
  activeFilterChips,
  facetLabels,
  facetOrder,
  facetValueLabel,
  hrefWith,
  orderCpuFamilies,
  toggleFacetValue,
  type ActiveFilterChip,
  type FacetKey,
  type FilterKey,
  type Filters,
  parseFilters,
} from "./facets";
import type { CatalogueRow } from "./types";

export type FacetOption = {
  key: string;
  label: string;
  count: number;
  selected: boolean;
  href: string;
};

export type FacetGroup = {
  key: FacetKey;
  label: string;
  options: FacetOption[];
};

export type CatalogueScope = {
  /** Path the links on this page point at (`/laptops`, `/laptops/asus`, …). */
  basePath: string;
  filters: Filters;
  sort: SortKey;
  page: number;
  /** Brand scope for `/laptops/{brand}`; the brand facet is then fixed by the path. */
  brandSlug?: string;
  /** Facets fixed by the route itself (e.g. brand on `/laptops/{brand}`, price on budget lists). */
  hideFacets?: FacetKey[];
  /**
   * State used when building links. Budget routes keep their band in the path, so links carry
   * only the facets the visitor applied, never a duplicate `min_price`/`max_price`.
   */
  linkFilters?: Filters;
};

export type NarrowestFilter = {
  facet: FacetKey;
  label: string;
  href: string;
  countAfterRemoval: number;
};

export type CatalogueResult = {
  rows: CatalogueRow[];
  total: number;
  page: number;
  pageCount: number;
  facets: FacetGroup[];
  chips: ActiveFilterChip[];
  narrowest: NarrowestFilter | null;
  brandNames: Record<string, string>;
  lastUpdated: string | null;
};

export type FallbackLinks = {
  popularBrands: { label: string; href: string; count: number }[];
  priceBands: { label: string; href: string }[];
  popularFeatures: { label: string; href: string }[];
};

export function parsePage(value: string | string[] | null | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function parseSort(value: string | string[] | null | undefined): SortKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return sortOptions.some((option) => option.key === raw) ? (raw as SortKey) : defaultSort;
}

/** Build the list scope from the request URL; brand is fixed by the path on `/laptops/{brand}`. */
export function scopeFromParams(
  basePath: string,
  params: Pick<URLSearchParams, "get" | "getAll">,
  brandSlug?: string,
): CatalogueScope {
  return {
    basePath,
    filters: parseFilters(params),
    sort: parseSort(params.get("sort")),
    page: parsePage(params.get("page")),
    brandSlug,
  };
}

function screenBandMatches(key: string, screenSizeIn: number): boolean {
  const band = screenBands.find((item) => item.key === key);
  if (!band) return false;
  return screenSizeIn >= band.min && screenSizeIn < band.max;
}

function matchesFilter(row: CatalogueRow, facet: FilterKey, values: string[]): boolean {
  if (values.length === 0) return true;
  switch (facet) {
    case "brand":
      return values.includes(row.brandSlug);
    case "cpu":
      return values.includes(row.cpuFamily);
    case "ram":
      return values.includes(String(row.ramGb));
    case "storage":
      return values.includes(String(row.storageGb));
    case "screen":
      return values.some((value) => screenBandMatches(value, row.screenSizeIn));
    case "gpu":
      return values.includes(row.gpuFamily);
    case "os":
      return values.includes(row.os);
    case "touch":
      return values.includes(row.touch ? "yes" : "no");
    case "form":
      return values.includes(row.formFactor);
  }
}

function matchesPrice(row: CatalogueRow, filters: Filters): boolean {
  if (filters.minPriceMinor === null && filters.maxPriceMinor === null) return true;
  if (row.priceMinor === null) return false;
  if (filters.minPriceMinor !== null && row.priceMinor < filters.minPriceMinor) return false;
  if (filters.maxPriceMinor !== null && row.priceMinor > filters.maxPriceMinor) return false;
  return true;
}

/** Rows matching every active facet, with one facet optionally ignored (for facet counts). */
export function filterRows(
  rows: CatalogueRow[],
  filters: Filters,
  scopeBrand?: string,
  ignoreFacet?: FacetKey,
): CatalogueRow[] {
  return rows.filter((row) => {
    if (scopeBrand && row.brandSlug !== scopeBrand) return false;
    for (const facet of FACET_KEYS) {
      if (facet === ignoreFacet) continue;
      if (!matchesFilter(row, facet, filters[facet])) return false;
    }
    if (ignoreFacet !== "price" && !matchesPrice(row, filters)) return false;
    return true;
  });
}

const FACET_KEYS: FilterKey[] = [
  "brand",
  "cpu",
  "ram",
  "storage",
  "screen",
  "gpu",
  "os",
  "touch",
  "form",
];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function countBy<T>(rows: CatalogueRow[], pick: (row: CatalogueRow) => T): Map<T, number> {
  const counts = new Map<T, number>();
  for (const row of rows) {
    const key = pick(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function optionHref(
  scope: CatalogueScope,
  filters: Filters,
  facet: FilterKey,
  value: string,
): string {
  return hrefWith(scope.basePath, toggleFacetValue(filters, facet, value), { sort: scope.sort });
}

function linkFilters(scope: CatalogueScope): Filters {
  return scope.linkFilters ?? scope.filters;
}

function valueFacet(
  scope: CatalogueScope,
  rows: CatalogueRow[],
  facet: FilterKey,
  keys: string[],
  labelFor: (value: string) => string = (value) => facetValueLabel(facet, value),
): FacetGroup {
  // Counts use every other filter, but not this facet's own selection.
  const counted = countBy(filterRows(rows, scope.filters, scope.brandSlug, facet), (row) =>
    String(pickFacetValue(row, facet)),
  );
  const selected = new Set(scope.filters[facet]);
  const options = keys
    .map((key) => ({
      key,
      label: labelFor(key),
      count: counted.get(key) ?? 0,
      selected: selected.has(key),
      href: optionHref(scope, linkFilters(scope), facet, key),
    }))
    .filter((option) => option.count > 0 || option.selected);
  return { key: facet, label: facetLabels[facet], options };
}

function pickFacetValue(row: CatalogueRow, facet: FilterKey): string {
  switch (facet) {
    case "brand":
      return row.brandSlug;
    case "cpu":
      return row.cpuFamily;
    case "ram":
      return String(row.ramGb);
    case "storage":
      return String(row.storageGb);
    case "screen":
      return (
        screenBands.find(
          (band) => row.screenSizeIn >= band.min && row.screenSizeIn < band.max,
        )?.key ?? "16"
      );
    case "gpu":
      return row.gpuFamily;
    case "os":
      return row.os;
    case "touch":
      return row.touch ? "yes" : "no";
    case "form":
      return row.formFactor;
  }
}

function priceFacet(scope: CatalogueScope, rows: CatalogueRow[]): FacetGroup {
  const counted = filterRows(rows, scope.filters, scope.brandSlug, "price");
  const options = priceBuckets.map((bucket) => {
    const selected =
      scope.filters.minPriceMinor === bucket.minMinor &&
      scope.filters.maxPriceMinor === bucket.maxMinor;
    const count = counted.filter(
      (row) =>
        row.priceMinor !== null &&
        row.priceMinor >= bucket.minMinor &&
        row.priceMinor <= bucket.maxMinor,
    ).length;
    return {
      key: bucket.key,
      label: bucket.label,
      count,
      selected,
      href: hrefWith(
        scope.basePath,
        { ...linkFilters(scope), minPriceMinor: bucket.minMinor, maxPriceMinor: bucket.maxMinor },
        { sort: scope.sort },
      ),
    };
  });
  return { key: "price", label: facetLabels.price, options };
}

/** Distinct values present in the scope, in the taxonomy's display order. */
function facetKeysPresent(rows: CatalogueRow[], facet: FilterKey): string[] {
  const values = unique(rows.map((row) => pickFacetValue(row, facet)));
  switch (facet) {
    case "brand":
      return values.sort();
    case "cpu":
      return orderCpuFamilies(values);
    case "ram":
    case "storage":
      return values.sort((a, b) => Number(a) - Number(b));
    case "screen":
      return screenBands.map((band) => band.key).filter((key) => values.includes(key));
    case "touch":
      return ["yes", "no"];
    default:
      return values.sort();
  }
}

function brandNameMap(rows: CatalogueRow[]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const row of rows) {
    names[row.brandSlug] = row.brandName;
  }
  return names;
}

function latestUpdate(rows: CatalogueRow[]): string | null {
  let latest: string | null = null;
  for (const row of rows) {
    if (latest === null || row.updatedAt > latest) latest = row.updatedAt;
  }
  return latest;
}

export function sortRows(rows: CatalogueRow[], sort: SortKey): CatalogueRow[] {
  // Unpriced models sort last in both directions.
  const byPrice = (direction: 1 | -1) => (a: CatalogueRow, b: CatalogueRow) => {
    if (a.priceMinor === null && b.priceMinor === null) return 0;
    if (a.priceMinor === null) return 1;
    if (b.priceMinor === null) return -1;
    return direction * (a.priceMinor - b.priceMinor);
  };
  const sorted = [...rows];
  switch (sort) {
    case "price-asc":
      sorted.sort(
        (a, b) =>
          byPrice(1)(a, b) || b.popularity - a.popularity || a.modelCode.localeCompare(b.modelCode),
      );
      break;
    case "price-desc":
      sorted.sort(
        (a, b) =>
          byPrice(-1)(a, b) || b.popularity - a.popularity || a.modelCode.localeCompare(b.modelCode),
      );
      break;
    case "newest":
      sorted.sort(
        (a, b) =>
          b.releaseDate.localeCompare(a.releaseDate) ||
          b.popularity - a.popularity ||
          a.modelCode.localeCompare(b.modelCode),
      );
      break;
    case "popular":
    default:
      sorted.sort(
        (a, b) =>
          b.popularity - a.popularity || byPrice(1)(a, b) || a.modelCode.localeCompare(b.modelCode),
      );
      break;
  }
  return sorted;
}

/**
 * The filter to offer removing in the empty state: the one whose removal recovers the most
 * models, i.e. the narrowest remaining filter. Ties keep rail order, so the offer is stable.
 */
export function narrowestFilter(
  rows: CatalogueRow[],
  scope: CatalogueScope,
  chips: ActiveFilterChip[],
): NarrowestFilter | null {
  if (chips.length === 0) return null;
  let best: NarrowestFilter | null = null;
  for (const chip of chips) {
    const count = filterRows(rows, chip.removeFilters, scope.brandSlug).length;
    if (best === null || count > best.countAfterRemoval) {
      best = {
        facet: chip.facet,
        label: `${facetLabels[chip.facet]}: ${chip.label}`,
        href: hrefWith(scope.basePath, chip.removeFilters, { sort: scope.sort }),
        countAfterRemoval: count,
      };
    }
  }
  return best;
}

export function fallbackLinks(rows: CatalogueRow[]): FallbackLinks {
  const brandCounts = countBy(rows, (row) => row.brandSlug);
  const popularBrands = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([slug, count]) => ({
      label: brandNameMap(rows)[slug] ?? slug,
      href: `/laptops/${slug}`,
      count,
    }));

  const priceBands = priceBuckets.map((bucket) => ({
    label: bucket.label,
    href: priceBucketHref(bucket),
  }));

  const ramCounts = countBy(rows, (row) => row.ramGb);
  const popularRam = [...ramCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 3)
    .map(([ramGb, count]) => ({
      label: `${ramGb} GB RAM`,
      href: `/laptops?ram=${ramGb}`,
      count,
    }));
  const cpuCounts = countBy(rows, (row) => row.cpuFamily);
  const popularCpu = [...cpuCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([cpuFamily, count]) => ({
      label: cpuFamily,
      href: `/laptops?cpu=${encodeURIComponent(cpuFamily)}`,
      count,
    }));

  return {
    popularBrands,
    priceBands,
    popularFeatures: [...popularRam, ...popularCpu].map(({ label, href }) => ({ label, href })),
  };
}

export function runCatalogueQuery(rows: CatalogueRow[], scope: CatalogueScope): CatalogueResult {
  const brandNames = brandNameMap(rows);
  const scopedRows = scope.brandSlug
    ? rows.filter((row) => row.brandSlug === scope.brandSlug)
    : rows;
  const matched = filterRows(rows, scope.filters, scope.brandSlug);
  const sorted = sortRows(matched, scope.sort);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / market.pageSize));
  const page = Math.min(scope.page, pageCount);
  const pageRows = sorted.slice((page - 1) * market.pageSize, page * market.pageSize);

  const hidden = new Set(scope.hideFacets ?? []);
  const facets = facetOrder.filter((facet) => !hidden.has(facet)).map((facet) => {
    if (facet === "price") return priceFacet(scope, rows);
    const keys = facetKeysPresent(scopedRows, facet);
    return valueFacet(
      scope,
      rows,
      facet,
      keys,
      facet === "brand"
        ? (value) => brandNames[value] ?? value
        : (value) => facetValueLabel(facet, value),
    );
  });

  const chips = activeFilterChips(linkFilters(scope), brandNames);

  return {
    rows: pageRows,
    total,
    page,
    pageCount,
    facets,
    chips,
    narrowest: narrowestFilter(rows, scope, chips),
    brandNames,
    lastUpdated: latestUpdate(matched.length > 0 ? matched : scopedRows),
  };
}

export function totalPages(total: number): number {
  return Math.max(1, Math.ceil(total / market.pageSize));
}

/**
 * Facet state lives in the URL (SRCH-03…SRCH-05, SRCH-09): every filter, the sort and the page
 * are parameters, so reload, back/forward and a copied URL restore the identical list.
 *
 * Conventions: a multi-value facet is one comma-separated parameter (`?ram=8,16`), values are
 * sorted before serialisation so equal selections produce byte-identical URLs, multi-values
 * are OR within a facet and facets AND across (PROMPT.md §8.4).
 */
import {
  cpuFamilyOrder,
  defaultSort,
  formFactorLabels,
  gpuFamilyLabels,
  osLabels,
  screenBands,
  touchLabels,
} from "./config";

export const filterParams = [
  "brand",
  "cpu",
  "ram",
  "storage",
  "screen",
  "gpu",
  "os",
  "touch",
  "form",
] as const;

export type FilterKey = (typeof filterParams)[number];
export type FacetKey = FilterKey | "price";

export type Filters = {
  brand: string[];
  cpu: string[];
  ram: string[];
  storage: string[];
  screen: string[];
  gpu: string[];
  os: string[];
  touch: string[];
  form: string[];
  minPriceMinor: number | null;
  maxPriceMinor: number | null;
};

export type FilterHrefOptions = { sort?: string; page?: number };

export const facetLabels: Record<FacetKey, string> = {
  brand: "Brand",
  price: "Price",
  cpu: "Processor",
  ram: "RAM",
  storage: "Storage",
  screen: "Screen size",
  gpu: "Graphics",
  os: "Operating system",
  touch: "Touchscreen",
  form: "Form factor",
};

/** Rail display order (brand and price first, hardware after). */
export const facetOrder: FacetKey[] = [
  "brand",
  "price",
  "cpu",
  "ram",
  "storage",
  "screen",
  "gpu",
  "os",
  "touch",
  "form",
];

const numericParams = new Set<string>(["ram", "storage"]);

export function emptyFilters(): Filters {
  return {
    brand: [],
    cpu: [],
    ram: [],
    storage: [],
    screen: [],
    gpu: [],
    os: [],
    touch: [],
    form: [],
    minPriceMinor: null,
    maxPriceMinor: null,
  };
}

function normaliseValues(param: string, values: string[]): string[] {
  const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  unique.sort((a, b) => {
    if (numericParams.has(param)) {
      return Number(a) - Number(b);
    }
    return a.localeCompare(b);
  });
  return unique;
}

function parseRupees(value: string | null): number | null {
  if (!value) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount) * 100;
}

export type SearchParamsLike = Pick<URLSearchParams, "get" | "getAll">;

export function parseFilters(params: SearchParamsLike): Filters {
  const filters = emptyFilters();
  for (const param of filterParams) {
    const raw = params.getAll(param).flatMap((value) => value.split(","));
    filters[param] = normaliseValues(param, raw);
  }
  filters.minPriceMinor = parseRupees(params.get("min_price"));
  filters.maxPriceMinor = parseRupees(params.get("max_price"));
  return filters;
}

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filterParams.some((param) => filters[param].length > 0) ||
    filters.minPriceMinor !== null ||
    filters.maxPriceMinor !== null
  );
}

export function clearFacet(filters: Filters, facet: FacetKey): Filters {
  const next: Filters = { ...filters };
  if (facet === "price") {
    next.minPriceMinor = null;
    next.maxPriceMinor = null;
  } else {
    next[facet] = [];
  }
  return next;
}

export function toggleFacetValue(filters: Filters, facet: FilterKey, value: string): Filters {
  const current = filters[facet];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : normaliseValues(facet, [...current, value]);
  return { ...filters, [facet]: next };
}

/** Serialise filter state in a fixed parameter order so equal selections give equal URLs. */
export function toSearchParams(filters: Filters, options: FilterHrefOptions = {}): URLSearchParams {
  const params = new URLSearchParams();
  for (const param of filterParams) {
    if (filters[param].length > 0) {
      params.set(param, filters[param].join(","));
    }
  }
  if (filters.minPriceMinor !== null) {
    params.set("min_price", String(Math.round(filters.minPriceMinor / 100)));
  }
  if (filters.maxPriceMinor !== null) {
    params.set("max_price", String(Math.round(filters.maxPriceMinor / 100)));
  }
  // The default sort is omitted so the base URL stays the canonical one (SEO-04).
  if (options.sort && options.sort !== defaultSort) {
    params.set("sort", options.sort);
  }
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }
  return params;
}

export function hrefWith(
  basePath: string,
  filters: Filters,
  options: FilterHrefOptions = {},
): string {
  const query = toSearchParams(filters, options).toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Human label for one facet value, using the taxonomy labels where they exist. */
export function facetValueLabel(
  facet: FilterKey,
  value: string,
  brandNames: Record<string, string> = {},
): string {
  switch (facet) {
    case "brand":
      return brandNames[value] ?? value;
    case "ram":
      return `${value} GB`;
    case "storage":
      return Number(value) >= 1024
        ? `${Number(value) / 1024} TB`
        : `${value} GB`;
    case "screen":
      return screenBands.find((band) => band.key === value)?.label ?? `${value}"`;
    case "gpu":
      return gpuFamilyLabels[value] ?? value;
    case "os":
      return osLabels[value] ?? value;
    case "touch":
      return touchLabels[value] ?? value;
    case "form":
      return formFactorLabels[value] ?? value;
    case "cpu":
      return value;
  }
}

/** State used for links: on budget routes the price band lives in the path, not the query. */
export function linkState(filters: Filters, priceOwnedByPath: boolean): Filters {
  return priceOwnedByPath ? clearFacet(filters, "price") : filters;
}

export function priceFilterLabel(minMinor: number | null, maxMinor: number | null): string {
  const fmt = (minor: number) =>
    `₹${(minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  if (minMinor !== null && maxMinor !== null) {
    return `${fmt(minMinor)} – ${fmt(maxMinor)}`;
  }
  if (minMinor !== null) {
    return `${fmt(minMinor)} and above`;
  }
  if (maxMinor !== null) {
    return `Under ${fmt(maxMinor)}`;
  }
  return "Any price";
}

export type ActiveFilterChip = {
  facet: FacetKey;
  value?: string;
  label: string;
  /** Filters with just this chip removed. */
  removeFilters: Filters;
};

export function activeFilterChips(
  filters: Filters,
  brandNames: Record<string, string> = {},
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  for (const facet of facetOrder) {
    if (facet === "price") {
      if (filters.minPriceMinor !== null || filters.maxPriceMinor !== null) {
        chips.push({
          facet,
          label: priceFilterLabel(filters.minPriceMinor, filters.maxPriceMinor),
          removeFilters: clearFacet(filters, "price"),
        });
      }
      continue;
    }
    for (const value of filters[facet]) {
      chips.push({
        facet,
        value,
        label: facetValueLabel(facet, value, brandNames),
        removeFilters: toggleFacetValue(filters, facet, value),
      });
    }
  }
  return chips;
}

/** CPU families sorted by taxonomy order, unknown families alphabetically at the end. */
export function orderCpuFamilies(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const indexA = cpuFamilyOrder.indexOf(a);
    const indexB = cpuFamilyOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
}

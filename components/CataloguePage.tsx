import Link from "next/link";
import { loadCatalogueRows } from "../lib/db";
import {
  fallbackLinks,
  parsePage,
  parseSort,
  runCatalogueQuery,
  type CatalogueScope,
} from "../lib/catalogue";
import {
  facetLabels,
  hrefWith,
  linkState,
  parseFilters,
  type FacetKey,
  type Filters,
} from "../lib/facets";
import { toUrlSearchParams, type NextSearchParams } from "../lib/params";
import { listJsonLd, type Crumb } from "../lib/seo";
import { formatDate, formatRupees } from "../lib/format";
import { Breadcrumbs } from "./Breadcrumbs";
import { FacetRail } from "./FacetRail";
import { SortControl } from "./SortControl";
import { ProductGrid } from "./ProductGrid";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";

export type CataloguePageProps = {
  heading: string;
  intro: string;
  basePath: string;
  searchParams: NextSearchParams;
  crumbs: Crumb[];
  brandSlug?: string;
  /** Budget routes own their range in the path; query min/max are ignored there. */
  priceRange?: { minMinor: number; maxMinor: number };
  hideFacets?: FacetKey[];
};

/**
 * The catalogue list screen shared by `/laptops`, `/laptops/{brand}` and the budget routes
 * (routes 4.1.2–4.1.4). All state comes from the URL, so the page is a plain server render.
 */
export function CataloguePage({
  heading,
  intro,
  basePath,
  searchParams,
  crumbs,
  brandSlug,
  priceRange,
  hideFacets,
}: CataloguePageProps) {
  const params = toUrlSearchParams(searchParams);
  const rows = loadCatalogueRows();

  const filters: Filters = parseFilters(params);
  if (priceRange) {
    filters.minPriceMinor = priceRange.minMinor;
    filters.maxPriceMinor = priceRange.maxMinor;
  }

  const scope: CatalogueScope = {
    basePath,
    filters,
    sort: parseSort(params.get("sort")),
    page: parsePage(params.get("page")),
    brandSlug,
    hideFacets,
    linkFilters: linkState(filters, Boolean(priceRange)),
  };

  const result = runCatalogueQuery(rows, scope);
  const fallbacks = fallbackLinks(rows);
  // The band a budget route owns in its path; the empty state names it when no facet is active.
  const bandLabel = priceRange
    ? priceRange.minMinor === 0
      ? `under ${formatRupees(priceRange.maxMinor)}`
      : `between ${formatRupees(priceRange.minMinor)} and ${formatRupees(priceRange.maxMinor)}`
    : undefined;
  // "N models of M": M is the list's own size. Budget routes are their own list, so they
  // only show the count of models inside the band.
  const listSize = priceRange
    ? null
    : brandSlug
      ? rows.filter((row) => row.brandSlug === brandSlug).length
      : rows.length;
  const filtered = listSize !== null && result.total !== listSize;
  const jsonLd = listJsonLd({ crumbs, rows: result.rows });

  return (
    <div className="catalogue">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={crumbs} />

      <header className="list-header">
        <h1>{heading}</h1>
        <p className="list-header__intro">{intro}</p>
        <p className="list-header__meta" data-testid="list-meta">
          <span data-testid="model-count">
            {result.total} {result.total === 1 ? "model" : "models"}
            {filtered ? ` of ${listSize}` : ""}
          </span>
          <span aria-hidden="true"> · </span>
          <span data-testid="last-updated">Prices last updated {formatDate(result.lastUpdated)}</span>
        </p>
      </header>

      <div className="catalogue__body">
        <FacetRail
          facets={result.facets}
          basePath={basePath}
          filters={scope.linkFilters ?? filters}
          sort={scope.sort}
          showPriceRangeForm={!priceRange && !(hideFacets ?? []).includes("price")}
        />

        <section className="results" aria-label="Results">
          <SortControl
            basePath={basePath}
            filters={scope.linkFilters ?? filters}
            sort={scope.sort}
            resultCount={result.total}
          />

          {result.chips.length > 0 ? (
            <div className="applied-filters" data-testid="applied-filters">
              <span>Applied:</span>
              <ul>
                {result.chips.map((chip) => (
                  <li key={`${chip.facet}-${chip.value ?? "range"}`}>
                    <Link href={hrefWith(basePath, chip.removeFilters, { sort: scope.sort })}>
                      {facetLabels[chip.facet]}: {chip.label}
                      <span aria-hidden="true"> ×</span>
                      <span className="visually-hidden"> (remove this filter)</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="link-quiet" href={basePath}>
                Clear all
              </Link>
            </div>
          ) : null}

          {result.total === 0 ? (
            <EmptyState
              basePath={basePath}
              chips={result.chips}
              narrowest={result.narrowest}
              fallbacks={fallbacks}
              bandLabel={bandLabel}
            />
          ) : (
            <>
              <ProductGrid rows={result.rows} />
              <Pagination
                basePath={basePath}
                filters={scope.linkFilters ?? filters}
                sort={scope.sort}
                page={result.page}
                pageCount={result.pageCount}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

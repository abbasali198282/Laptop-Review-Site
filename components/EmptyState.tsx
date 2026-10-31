import Link from "next/link";
import { facetLabels, hrefWith, type ActiveFilterChip } from "../lib/facets";
import type { NarrowestFilter, FallbackLinks } from "../lib/catalogue";

type EmptyStateProps = {
  basePath: string;
  chips: ActiveFilterChip[];
  narrowest: NarrowestFilter | null;
  fallbacks: FallbackLinks;
};

/**
 * Empty state (SRCH-10, route 4.1.2): names every active filter, states the count 0 and
 * offers a one-click removal of the filter that is actually emptying the list, plus fallback
 * entry links so the dead end has a way out.
 */
export function EmptyState({ basePath, chips, narrowest, fallbacks }: EmptyStateProps) {
  return (
    <div className="empty-state" data-testid="empty-state">
      <h2>No laptops match these filters</h2>
      <p data-testid="empty-count">
        <strong>0 laptops</strong> match the{" "}
        {chips.length === 1 ? "filter" : `${chips.length} filters`} below.
      </p>

      {chips.length > 0 ? (
        <>
          <h3>Active filters</h3>
          <ul className="active-filters" aria-label="Active filters">
            {chips.map((chip) => (
              <li key={`${chip.facet}-${chip.value ?? "range"}`}>
                <Link href={hrefWith(basePath, chip.removeFilters)}>
                  <span className="active-filters__facet">{facetLabels[chip.facet]}:</span> {chip.label}
                  <span aria-hidden="true"> ×</span>
                  <span className="visually-hidden"> (remove this filter)</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {narrowest ? (
        <p className="empty-state__escape">
          <Link className="button" href={narrowest.href} data-testid="remove-narrowest">
            Remove {narrowest.label}
          </Link>{" "}
          <span>
            — that single filter is hiding {narrowest.countAfterRemoval}{" "}
            {narrowest.countAfterRemoval === 1 ? "laptop" : "laptops"} that match everything else.
          </span>
        </p>
      ) : null}

      <p>
        <Link href={basePath}>Clear all filters</Link>
      </p>

      <div className="fallbacks">
        <section aria-labelledby="fallback-brands">
          <h3 id="fallback-brands">Popular brands</h3>
          <ul>
            {fallbacks.popularBrands.map((brand) => (
              <li key={brand.href}>
                <Link href={brand.href}>{brand.label}</Link>{" "}
                <span className="muted">({brand.count})</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="fallback-price">
          <h3 id="fallback-price">Buy by price</h3>
          <ul>
            {fallbacks.priceBands.map((band) => (
              <li key={band.href}>
                <Link href={band.href}>{band.label}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="fallback-features">
          <h3 id="fallback-features">Popular features</h3>
          <ul>
            {fallbacks.popularFeatures.map((feature) => (
              <li key={feature.href}>
                <Link href={feature.href}>{feature.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

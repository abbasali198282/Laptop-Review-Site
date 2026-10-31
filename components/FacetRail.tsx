import Link from "next/link";
import type { FacetGroup } from "../lib/catalogue";
import { hrefWith } from "../lib/facets";
import type { Filters } from "../lib/facets";
import type { SortKey } from "../lib/config";
import { PriceRangeForm } from "./PriceRangeForm";

type FacetRailProps = {
  facets: FacetGroup[];
  basePath: string;
  filters: Filters;
  sort: SortKey;
  /** Budget routes own their price range in the path, so the custom range form is hidden. */
  showPriceRangeForm: boolean;
};

/**
 * Server-rendered facet rail (SRCH-03): every option is a real link that toggles one value,
 * so the whole rail works without client JavaScript and every state has a URL.
 */
export function FacetRail({
  facets,
  basePath,
  filters,
  sort,
  showPriceRangeForm,
}: FacetRailProps) {
  return (
    <aside className="facet-rail" aria-label="Filters">
      <div className="facet-rail__header">
        <h2>Filters</h2>
        <Link className="link-quiet" href={basePath}>
          Clear all
        </Link>
      </div>
      {facets.map((facet) => (
        <section className="facet" key={facet.key} aria-labelledby={`facet-${facet.key}`}>
          <h3 id={`facet-${facet.key}`}>{facet.label}</h3>
          <ul>
            {facet.options.map((option) => (
              <li key={option.key}>
                <Link
                  href={option.href}
                  className={option.selected ? "facet-option facet-option--selected" : "facet-option"}
                  aria-current={option.selected ? "true" : undefined}
                >
                  <span className="facet-option__label">{option.label}</span>
                  <span className="facet-option__count">{option.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          {facet.key === "price" && showPriceRangeForm ? (
            <PriceRangeForm basePath={basePath} filters={filters} sort={sort} />
          ) : null}
        </section>
      ))}
      {!showPriceRangeForm ? (
        <p className="facet-note">
          This list is fixed to a price band. <Link href={hrefWith("/laptops", filters, { sort })}>All price bands</Link>
        </p>
      ) : null}
    </aside>
  );
}

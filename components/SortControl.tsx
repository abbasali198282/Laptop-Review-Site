import Link from "next/link";
import { sortOptions, type SortKey } from "../lib/config";
import { hrefWith, type Filters } from "../lib/facets";

type SortControlProps = {
  basePath: string;
  filters: Filters;
  sort: SortKey;
  resultCount: number;
};

/** Sort as crawlable links (SRCH-05): each option is a URL that restores the same list. */
export function SortControl({ basePath, filters, sort, resultCount }: SortControlProps) {
  return (
    <div className="sort-control">
      <p className="result-count" aria-live="polite">
        {resultCount === 0
          ? "0 laptops"
          : `${resultCount} ${resultCount === 1 ? "laptop" : "laptops"}`}
      </p>
      <nav aria-label="Sort by">
        <span className="sort-control__label">Sort</span>
        <ul>
          {sortOptions.map((option) => (
            <li key={option.key}>
              <Link
                href={hrefWith(basePath, filters, { sort: option.key })}
                aria-current={option.key === sort ? "true" : undefined}
                className={option.key === sort ? "sort-option sort-option--active" : "sort-option"}
              >
                {option.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

import Link from "next/link";
import { hrefWith, type Filters } from "../lib/facets";
import type { SortKey } from "../lib/config";

type PaginationProps = {
  basePath: string;
  filters: Filters;
  sort: SortKey;
  page: number;
  pageCount: number;
};

/** Real `<a href>` pagination (SEO-10): every page is a crawlable, shareable URL. */
export function Pagination({ basePath, filters, sort, page, pageCount }: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const visible = [...pages].filter((candidate) => candidate >= 1 && candidate <= pageCount).sort((a, b) => a - b);

  const link = (target: number) => hrefWith(basePath, filters, { sort, page: target });

  return (
    <nav className="pagination" aria-label="Pagination">
      <ul>
        <li>
          {page > 1 ? (
            <Link href={link(page - 1)} rel="prev">
              ← Previous
            </Link>
          ) : (
            <span aria-disabled="true">← Previous</span>
          )}
        </li>
        {visible.map((target, index) => (
          <li key={target}>
            {index > 0 && target - visible[index - 1] > 1 ? <span className="pagination__gap">…</span> : null}
            {target === page ? (
              <span className="pagination__current" aria-current="page">
                {target}
              </span>
            ) : (
              <Link href={link(target)} aria-label={`Page ${target}`}>
                {target}
              </Link>
            )}
          </li>
        ))}
        <li>
          {page < pageCount ? (
            <Link href={link(page + 1)} rel="next">
              Next →
            </Link>
          ) : (
            <span aria-disabled="true">Next →</span>
          )}
        </li>
      </ul>
    </nav>
  );
}

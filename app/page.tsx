import Link from "next/link";
import { loadCatalogueRows } from "../lib/db";
import { fallbackLinks } from "../lib/catalogue";
import { formatDate } from "../lib/format";
import { market, priceBuckets, priceBucketHref } from "../lib/config";
import { siteName } from "../lib/seo";

export const dynamic = "force-dynamic";

/**
 * Minimal entry page for this slice (route 4.1.1 is delivered by its own slice): it only
 * routes the visitor into the catalogue routes that exist today.
 */
export default function HomePage() {
  const rows = loadCatalogueRows();
  const fallbacks = fallbackLinks(rows);
  const lastUpdated = rows.reduce((latest, row) => (row.updatedAt > latest ? row.updatedAt : latest), "");

  return (
    <div className="home">
      <h1>{siteName}</h1>
      <p className="home__lead">
        Browse {rows.length} laptop models with their manufacturer model codes, hardware and
        current lowest price. Every filter is a link you can copy.
      </p>

      <p>
        <Link className="button" href="/laptops">
          Browse all laptops
        </Link>
      </p>

      <section aria-labelledby="home-price">
        <h2 id="home-price">Shop by budget</h2>
        <ul className="link-cloud">
          {priceBuckets.map((bucket) => (
            <li key={bucket.key}>
              <Link href={priceBucketHref(bucket)}>{bucket.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-brands">
        <h2 id="home-brands">Popular brands</h2>
        <ul className="link-cloud">
          {fallbacks.popularBrands.map((brand) => (
            <li key={brand.href}>
              <Link href={brand.href}>{brand.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="muted">
        {market.currency} prices, one market ({market.code}). Prices last updated{" "}
        {formatDate(lastUpdated)}.
      </p>
    </div>
  );
}

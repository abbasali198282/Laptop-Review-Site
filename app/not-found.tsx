import Link from "next/link";
import { loadCatalogueRows } from "../lib/db";
import { priceBucketHref, priceBuckets } from "../lib/config";

export const dynamic = "force-dynamic";

/**
 * 404 surface (route 4.1.31 for this slice's routes): an unknown brand, an unknown price band
 * or an unmatched path gets valid alternatives instead of a blank dead end.
 */
export default function NotFound() {
  const rows = loadCatalogueRows();
  const brands = [...new Set(rows.map((row) => `${row.brandSlug}|${row.brandName}`))]
    .map((entry) => {
      const [slug, name] = entry.split("|");
      return { slug, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="not-found">
      <h1>That page does not exist</h1>
      <p>
        The brand or price band in this address is not in the catalogue. These entry points do
        exist:
      </p>
      <p>
        <Link className="button" href="/laptops">
          Browse all laptops
        </Link>
      </p>
      <section aria-labelledby="notfound-brands">
        <h2 id="notfound-brands">Brands</h2>
        <ul className="link-cloud">
          {brands.map((brand) => (
            <li key={brand.slug}>
              <Link href={`/laptops/${brand.slug}`}>{brand.name}</Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="notfound-price">
        <h2 id="notfound-price">Price bands</h2>
        <ul className="link-cloud">
          {priceBuckets.map((bucket) => (
            <li key={bucket.key}>
              <Link href={priceBucketHref(bucket)}>{bucket.label}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

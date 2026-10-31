import Link from "next/link";

/** Overview / Specifications tabs for the product routes (4.1.7 and 4.1.9). */
export function ProductTabs({ slug, current }: { slug: string; current: "overview" | "specs" }) {
  return (
    <nav className="product-tabs" aria-label="Laptop sections">
      <ul>
        <li>
          {current === "overview" ? (
            <span aria-current="page">Overview</span>
          ) : (
            <Link href={`/laptop/${slug}`}>Overview</Link>
          )}
        </li>
        <li>
          {current === "specs" ? (
            <span aria-current="page">Specifications</span>
          ) : (
            <Link href={`/laptop/${slug}/specs`}>Specifications</Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

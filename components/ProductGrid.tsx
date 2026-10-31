import Link from "next/link";
import type { CatalogueRow } from "../lib/types";
import { formatPrice, formatStorage } from "../lib/format";
import { formFactorLabels, gpuFamilyLabels, osLabels } from "../lib/config";

type ProductGridProps = {
  rows: CatalogueRow[];
};

/**
 * Server-rendered result grid (route 4.1.2). Each card links to its canonical product page
 * (`/laptop/{slug}-{code}`), so the list is the real entry point into the identity header and
 * spec sheet (routes 4.1.7, 4.1.9).
 */
export function ProductGrid({ rows }: ProductGridProps) {
  return (
    <ul className="product-grid" aria-label="Laptop results">
      {rows.map((row) => (
        <li key={row.productId}>
          <article className="laptop-card" data-testid="laptop-card" data-product-code={row.modelCode}>
            <p className="laptop-card__brand">{row.brandName}</p>
            <h3>
              <Link className="laptop-card__title-link" href={`/laptop/${row.slug}`}>
                {row.modelName}
              </Link>
            </h3>
            <p className="laptop-card__code">
              Model code <code>{row.modelCode}</code>
            </p>
            <ul className="laptop-card__specs">
              <li>{row.cpuModel}</li>
              <li>{row.gpuModel ?? gpuFamilyLabels[row.gpuFamily] ?? row.gpuFamily}</li>
              <li>{row.ramGb} GB RAM</li>
              <li>{formatStorage(row.storageGb)} {row.storageType.toUpperCase()}</li>
              <li>{row.screenSizeIn}&quot; {row.touch ? "touch" : "display"}</li>
              <li>{osLabels[row.os] ?? row.os}</li>
            </ul>
            <p className="laptop-card__meta">
              {formFactorLabels[row.formFactor] ?? row.formFactor} · {row.year}
            </p>
            <p className="laptop-card__price">
              <span className="visually-hidden">Lowest price: </span>
              {formatPrice(row.priceMinor)}
            </p>
            <p className="laptop-card__more">
              <Link href={`/laptop/${row.slug}`}>
                Full specs and price<span className="visually-hidden"> for {row.modelName}</span>
              </Link>
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}

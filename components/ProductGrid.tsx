import type { CatalogueRow } from "../lib/types";
import { formatPrice, formatStorage } from "../lib/format";
import { formFactorLabels, gpuFamilyLabels, osLabels } from "../lib/config";

type ProductGridProps = {
  rows: CatalogueRow[];
};

/**
 * Server-rendered result grid (route 4.1.2). Cards are not links: `/laptop/{slug}` is a
 * different slice and a link to a route that does not exist yet is forbidden by §10.
 */
export function ProductGrid({ rows }: ProductGridProps) {
  return (
    <ul className="product-grid" aria-label="Laptop results">
      {rows.map((row) => (
        <li key={row.productId}>
          <article className="laptop-card" data-testid="laptop-card" data-product-code={row.modelCode}>
            <p className="laptop-card__brand">{row.brandName}</p>
            <h3>{row.modelName}</h3>
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
          </article>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";
import type { VariantLink } from "../lib/db";
import { formatStorage } from "../lib/format";

/**
 * Variant switch (DB-04): the same model line sold in different CPU/RAM/storage combinations.
 * Each sibling SKU has its own product page and model code, so switching navigates to that
 * variant's spec sheet; the current variant is not a link and is announced with aria-current.
 */
export function VariantSwitch({ variants }: { variants: VariantLink[] }) {
  if (variants.length < 2) return null;

  return (
    <section
      className="variant-switch"
      aria-labelledby="variant-switch-heading"
      data-testid="variant-switch"
    >
      <h2 id="variant-switch-heading">Variants of this model</h2>
      <p className="muted">
        Same model line, different processor, memory or storage. The model code identifies the
        exact SKU.
      </p>
      <ul>
        {variants.map((variant) => {
          const summary = `${variant.cpuModel} · ${variant.ramGb} GB RAM · ${formatStorage(
            variant.storageGb,
          )} ${variant.storageType.toUpperCase()}`;
          return (
            <li
              key={variant.productId}
              className={
                variant.isCurrent
                  ? "variant-switch__item variant-switch__item--current"
                  : "variant-switch__item"
              }
            >
              {variant.isCurrent ? (
                <span aria-current="true">
                  <code>{variant.modelCode}</code> · {summary}{" "}
                  <strong>(this variant)</strong>
                </span>
              ) : (
                <Link href={`/laptop/${variant.slug}/specs`} data-testid="variant-link">
                  <code>{variant.modelCode}</code> · {summary}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

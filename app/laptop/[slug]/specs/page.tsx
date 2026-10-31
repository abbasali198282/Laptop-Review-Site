import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../../components/Breadcrumbs";
import { ProductTabs } from "../../../../components/ProductTabs";
import { SpecHelp } from "../../../../components/SpecHelp";
import { SpecValue } from "../../../../components/SpecValue";
import { VariantSwitch } from "../../../../components/VariantSwitch";
import { correctionHref } from "../../../../lib/corrections";
import { loadProductBySlug, loadSpecValues } from "../../../../lib/db";
import { specGroups } from "../../../../lib/spec-taxonomy";
import { absoluteUrl, breadcrumbJsonLd } from "../../../../lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = loadProductBySlug(slug);
  if (!product) {
    return { title: "Laptop not found", robots: { index: false, follow: true } };
  }
  return {
    title: `${product.brandName} ${product.modelName} specifications (${product.modelCode})`,
    description: `Every recorded specification for the ${product.displayName}, grouped into the vendor spec groups with units, qualifiers and missing-value states.`,
    alternates: { canonical: absoluteUrl(`/laptop/${product.slug}/specs`) },
    robots: { index: true, follow: true },
  };
}

/**
 * Product specs tab (route 4.1.9): every recorded spec grouped into the vendor spec groups,
 * with per-row help, units, variants switch and a feedback form for empty groups (DB-02,
 * DB-04, DB-08, DB-10, DB-14).
 */
export default async function ProductSpecsPage({ params }: PageProps) {
  const { slug } = await params;
  const product = loadProductBySlug(slug);
  if (!product) notFound();

  const specs = loadSpecValues(product.productId);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "All laptops", href: "/laptops" },
    { label: product.brandName, href: `/laptops/${product.brandSlug}` },
    { label: `${product.modelName} (${product.modelCode})`, href: `/laptop/${product.slug}` },
    { label: "Specifications", href: `/laptop/${product.slug}/specs` },
  ];
  const breadcrumb = breadcrumbJsonLd(crumbs);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.displayName,
        sku: product.modelCode,
        mpn: product.modelCode,
        brand: { "@type": "Brand", name: product.brandName },
        category: "Laptop",
        url: absoluteUrl(`/laptop/${product.slug}/specs`),
      },
      { "@type": "BreadcrumbList", itemListElement: breadcrumb.itemListElement },
    ],
  };

  const groups = specGroups.map((group) => ({
    ...group,
    rows: specs.filter((spec) => spec.groupKey === group.key),
  }));

  return (
    <div className="product product--specs">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={crumbs} />
      <ProductTabs slug={product.slug} current="specs" />

      <header className="product-header">
        <p className="product-header__brand">
          {product.brandName} · {product.modelName}
        </p>
        <h1>{product.modelName} specifications</h1>
        <p className="product-header__code">
          Manufacturer model code <code data-testid="model-code">{product.modelCode}</code>
        </p>
        <p className="muted">{product.displayName}</p>
      </header>

      <VariantSwitch variants={product.variants} />

      {specs.length === 0 ? (
        <section className="spec-empty" data-testid="spec-empty">
          <h2>Vendor has not published a spec sheet</h2>
          <p>
            This model has no recorded specifications yet.{" "}
            <Link
              href={correctionHref({ kind: "missing_model", productSlug: product.slug })}
            >
              Tell us what you know about it
            </Link>
            .
          </p>
        </section>
      ) : (
        <div className="spec-groups">
          {groups.map((group) => (
            <section
              key={group.key}
              id={`spec-${group.key}`}
              className="spec-group"
              aria-labelledby={`spec-${group.key}-heading`}
              data-testid={`spec-group-${group.key}`}
            >
              <h2 id={`spec-${group.key}-heading`}>{group.label}</h2>
              {group.rows.length === 0 ? (
                <p className="spec-group__empty" data-testid="spec-group-empty">
                  The vendor has not published any {group.label.toLowerCase()} specification for
                  this model.{" "}
                  <Link
                    href={correctionHref({
                      kind: "missing_spec",
                      productSlug: product.slug,
                      groupKey: group.key,
                    })}
                  >
                    Send us this specification
                  </Link>
                  .
                </p>
              ) : (
                <table className="spec-table">
                  <caption className="visually-hidden">
                    {group.label} specifications for {product.displayName}
                  </caption>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.specKey} data-spec-key={row.specKey} data-source={row.source}>
                        <th scope="row">
                          <SpecHelp specKey={row.specKey} label={row.label} helpText={row.helpText} />
                        </th>
                        <td>
                          <SpecValue row={row} productSlug={product.slug} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { ProductTabs } from "../../../components/ProductTabs";
import { SpecValue } from "../../../components/SpecValue";
import { formFactorLabels, market } from "../../../lib/config";
import { loadProductBySlug, loadSpecValues } from "../../../lib/db";
import { formatDate, formatRupees } from "../../../lib/format";
import { pickQuickSpecs } from "../../../lib/specs";
import { specGroups } from "../../../lib/spec-taxonomy";
import { absoluteUrl, breadcrumbNode, productNode } from "../../../lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = loadProductBySlug(slug);
  if (!product) {
    return { title: "Laptop not found", robots: { index: false, follow: true } };
  }
  return {
    title: `${product.brandName} ${product.modelName} (${product.modelCode})`,
    description: `${product.displayName}: manufacturer model code, quick specs, current lowest price and the full specification sheet.`,
    alternates: { canonical: absoluteUrl(`/laptop/${product.slug}`) },
    robots: { index: true, follow: true },
  };
}

/**
 * Product page (route 4.1.7): identity header with the printed manufacturer model code,
 * release date and lowest-price callout, then the quick specs and the spec-group outline.
 */
export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = loadProductBySlug(slug);
  if (!product) notFound();

  const specs = loadSpecValues(product.productId);
  const quickSpecs = pickQuickSpecs(specs);
  const lowestOffer = product.offers[0] ?? null;
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "All laptops", href: "/laptops" },
    { label: product.brandName, href: `/laptops/${product.brandSlug}` },
    { label: `${product.modelName} (${product.modelCode})`, href: `/laptop/${product.slug}` },
  ];
  const breadcrumb = breadcrumbNode(crumbs);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      productNode({
        slug: product.slug,
        displayName: product.displayName,
        modelCode: product.modelCode,
        brandName: product.brandName,
        priceMinor: lowestOffer?.priceMinor ?? null,
        currency: lowestOffer?.currency ?? market.currency,
      }),
      breadcrumb,
    ],
  };

  const groups = specGroups.map((group) => ({
    ...group,
    count: specs.filter((spec) => spec.groupKey === group.key).length,
  }));

  return (
    <div className="product">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={crumbs} />
      <ProductTabs slug={product.slug} current="overview" />

      <header className="product-header">
        <p className="product-header__brand">
          {product.brandName} · {product.modelName}
        </p>
        <h1>{product.displayName}</h1>
        <p className="product-header__code">
          Manufacturer model code <code data-testid="model-code">{product.modelCode}</code>
        </p>
        <ul className="product-header__facts">
          <li>
            Released{" "}
            <time dateTime={product.releaseDate}>{formatDate(product.releaseDate)}</time>
          </li>
          <li>{formFactorLabels[product.formFactor] ?? product.formFactor}</li>
          <li>{product.year} model year</li>
        </ul>
      </header>

      <div className="product-columns">
        <section
          className="price-callout"
          aria-labelledby="lowest-price-heading"
          data-testid="lowest-price"
        >
          <h2 id="lowest-price-heading">Lowest price</h2>
          {lowestOffer ? (
            <>
              <p className="price-callout__amount">
                <span className="visually-hidden">Lowest observed price: </span>
                {formatRupees(lowestOffer.priceMinor)}
              </p>
              <p className="muted">
                {lowestOffer.retailerName} · observed {formatDate(lowestOffer.observedAt)}
              </p>
            </>
          ) : (
            <>
              <p className="price-callout__amount">No offers yet</p>
              <p className="muted">No retailer offer is recorded for this model.</p>
            </>
          )}
          <p className="muted">
            One observed price per variant in this seed; retailer comparison and price history are
            a separate slice.
          </p>
        </section>

        <section className="quick-specs" aria-labelledby="quick-specs-heading">
          <h2 id="quick-specs-heading">Quick specs</h2>
          <dl data-testid="quick-specs">
            {quickSpecs.map((spec) => (
              <div className="quick-specs__row" key={spec.specKey}>
                <dt>{spec.label}</dt>
                <dd>
                  <SpecValue row={spec} productSlug={product.slug} />
                </dd>
              </div>
            ))}
          </dl>
          <p>
            <Link className="button" href={`/laptop/${product.slug}/specs`}>
              Read the full specification sheet
            </Link>
          </p>
        </section>
      </div>

      <section className="spec-outline" aria-labelledby="spec-outline-heading" data-testid="spec-outline">
        <h2 id="spec-outline-heading">Specifications by group</h2>
        <p>
          {specs.length} recorded specifications, grouped the way the vendor publishes them. Groups
          the vendor has not published are marked so you know what is missing rather than absent.
        </p>
        <ul>
          {groups.map((group) => (
            <li key={group.key}>
              <Link href={`/laptop/${product.slug}/specs#spec-${group.key}`}>{group.label}</Link>{" "}
              <span className="muted">
                {group.count === 0 ? "not published" : `${group.count} recorded`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

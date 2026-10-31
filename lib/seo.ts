import type { Metadata } from "next";
import { priceBucketHref, priceBuckets } from "./config";
import type { CatalogueRow } from "./types";

export const siteName = "Laptop Review Site";

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

/**
 * List metadata (PROMPT.md §9.1 SEO-04): filtered and sorted variants canonicalise to the
 * unfiltered path and are `noindex, follow`, so the crawl surface stays finite.
 */
export function listMetadata(options: {
  title: string;
  description: string;
  canonicalPath: string;
  filtered: boolean;
}): Metadata {
  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: absoluteUrl(options.canonicalPath) },
    robots: options.filtered ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export type Crumb = { label: string; href: string };

/** The `BreadcrumbList` node: the structured-data twin of the visible trail (SEO-05). */
export function breadcrumbNode(items: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}

export function breadcrumbJsonLd(items: Crumb[]) {
  return { "@context": "https://schema.org", ...breadcrumbNode(items) };
}

export type ProductLdInput = {
  slug: string;
  displayName: string;
  modelCode: string;
  brandName: string;
  priceMinor: number | null;
  currency: string;
};

/**
 * The `Product` node (SEO-06) shared by the product pages and the list pages: only fields the
 * page visibly shows — identity, the manufacturer model code and the current lowest price.
 */
export function productNode(input: ProductLdInput, path = `/laptop/${input.slug}`) {
  const url = absoluteUrl(path);
  return {
    "@type": "Product",
    name: input.displayName,
    sku: input.modelCode,
    mpn: input.modelCode,
    brand: { "@type": "Brand", name: input.brandName },
    category: "Laptop",
    url,
    ...(input.priceMinor === null
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: (input.priceMinor / 100).toFixed(2),
            priceCurrency: input.currency,
            availability: "https://schema.org/InStock",
            url,
          },
        }),
  };
}

/** The `ItemList` node of one rendered page of cards; the list order is curated, not sorted. */
export function productItemListJsonLd(rows: CatalogueRow[]) {
  return {
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListUnordered",
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: productNode(row),
    })),
  };
}

/**
 * One JSON-LD block per list/brand/budget page (SEO-05, SEO-06): the breadcrumb trail plus the
 * `Product` cards the page actually renders. An empty result has no list to describe.
 */
export function listJsonLd(options: { crumbs: Crumb[]; rows: CatalogueRow[] }) {
  return {
    "@context": "https://schema.org",
    "@graph":
      options.rows.length > 0
        ? [breadcrumbNode(options.crumbs), productItemListJsonLd(options.rows)]
        : [breadcrumbNode(options.crumbs)],
  };
}

export type SitemapEntry = {
  url: string;
  lastModified: string;
  changeFrequency: "daily" | "weekly";
  priority: number;
};

function latestUpdate(rows: CatalogueRow[]): string {
  return rows.reduce((latest, row) => (row.updatedAt > latest ? row.updatedAt : latest), "");
}

function inPriceBand(row: CatalogueRow, minMinor: number, maxMinor: number): boolean {
  return row.priceMinor !== null && row.priceMinor >= minMinor && row.priceMinor <= maxMinor;
}

/**
 * The crawlable URL set of this slice (SEO-07): every seeded product plus the curated lists a
 * visitor can open — `/laptops`, one page per brand and the configured budget bands. Sorted,
 * filtered and paged variants are `noindex` and stay out (SEO-04).
 */
export function sitemapEntries(rows: CatalogueRow[]): SitemapEntry[] {
  const catalogueUpdated = latestUpdate(rows);
  const entries: SitemapEntry[] = [
    { url: absoluteUrl("/laptops"), lastModified: catalogueUpdated, changeFrequency: "daily", priority: 0.9 },
  ];

  const brands = new Map<string, CatalogueRow[]>();
  for (const row of rows) {
    const brandRows = brands.get(row.brandSlug) ?? [];
    brandRows.push(row);
    brands.set(row.brandSlug, brandRows);
  }
  for (const [brandSlug, brandRows] of [...brands.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    entries.push({
      url: absoluteUrl(`/laptops/${brandSlug}`),
      lastModified: latestUpdate(brandRows),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const bucket of priceBuckets) {
    const bandRows = rows.filter((row) => inPriceBand(row, bucket.minMinor, bucket.maxMinor));
    entries.push({
      url: absoluteUrl(priceBucketHref(bucket)),
      lastModified: bandRows.length > 0 ? latestUpdate(bandRows) : catalogueUpdated,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const row of rows) {
    entries.push({
      url: absoluteUrl(`/laptop/${row.slug}`),
      lastModified: row.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}

import type { Metadata } from "next";

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

export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}

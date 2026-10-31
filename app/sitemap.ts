import type { MetadataRoute } from "next";
import { loadCatalogueRows } from "../lib/db";
import { sitemapEntries } from "../lib/seo";

/**
 * `/sitemap.xml` (route 4.1.32, SEO-07): the seeded products plus the lists a visitor can open
 * (`/laptops`, the brand lists, the configured budget bands). Sorted, filtered and paged
 * variants are `noindex` and absent here (SEO-04).
 */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(loadCatalogueRows());
}

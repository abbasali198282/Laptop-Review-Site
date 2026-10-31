import type { MetadataRoute } from "next";
import { absoluteUrl } from "../lib/seo";

/**
 * Crawl file (route 4.1.32, SEO-07): every public route is crawlable; the correction-form
 * endpoint is not a page, so it stays out of the crawl. The sitemap is named absolutely.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

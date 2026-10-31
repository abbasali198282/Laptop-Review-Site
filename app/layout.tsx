import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteUrl } from "../lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Laptop Review Site",
    template: "%s · Laptop Review Site",
  },
  description:
    "Browse laptop specifications, current prices and model codes for the Indian market.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link className="site-header__brand" href="/">
            Laptop Review Site
          </Link>
          <nav aria-label="Primary">
            <ul>
              <li>
                <Link href="/laptops">All laptops</Link>
              </li>
              <li>
                <Link href="/laptops/price/under/40000">Under ₹40,000</Link>
              </li>
            </ul>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <p>
            Seeded catalogue: specifications from vendor spec sheets, one observed price per
            model (INR). Prices last observed 30 Oct 2026.
          </p>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CataloguePage } from "../../../components/CataloguePage";
import { loadCatalogueRows } from "../../../lib/db";
import { requestIsFiltered, type NextSearchParams } from "../../../lib/params";
import { listMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ brand: string }>;
  searchParams: Promise<NextSearchParams>;
};

function brandNameFor(slug: string): string | null {
  const row = loadCatalogueRows().find((candidate) => candidate.brandSlug === slug);
  return row ? row.brandName : null;
}


export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { brand } = await params;
  const brandName = brandNameFor(brand);
  if (!brandName) {
    return { title: "Brand not found", robots: { index: false, follow: true } };
  }
  return listMetadata({
    title: `${brandName} laptops`,
    description: `Every ${brandName} laptop model in the catalogue with its model code, hardware and current lowest price.`,
    canonicalPath: `/laptops/${brand}`,
    filtered: requestIsFiltered(await searchParams),
  });
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { brand } = await params;
  const brandName = brandNameFor(brand);
  if (!brandName) {
    notFound();
  }
  const search = await searchParams;

  return (
    <CataloguePage
      heading={`${brandName} laptops`}
      intro={`Every ${brandName} model in the catalogue. The brand is fixed by this address; add price, processor, memory and the other facets on top.`}
      basePath={`/laptops/${brand}`}
      brandSlug={brand}
      hideFacets={["brand"]}
      searchParams={search}
      crumbs={[
        { label: "Home", href: "/" },
        { label: "All laptops", href: "/laptops" },
        { label: brandName, href: `/laptops/${brand}` },
      ]}
    />
  );
}

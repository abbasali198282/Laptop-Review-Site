import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CataloguePage } from "../../../../../components/CataloguePage";
import { parseBudgetRange } from "../../../../../lib/config";
import { formatRupees } from "../../../../../lib/format";
import { requestIsFiltered, type NextSearchParams } from "../../../../../lib/params";
import { listMetadata } from "../../../../../lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ range: string }>;
  searchParams: Promise<NextSearchParams>;
};


export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { range } = await params;
  const bounds = parseBudgetRange(range);
  if (!bounds) {
    return { title: "Price band not found", robots: { index: false, follow: true } };
  }
  return listMetadata({
    title: `Laptops ${formatRupees(bounds.min * 100)} – ${formatRupees(bounds.max * 100)}`,
    description: `Every laptop whose current lowest price is between ${formatRupees(
      bounds.min * 100,
    )} and ${formatRupees(bounds.max * 100)}, with model codes and hardware.`,
    canonicalPath: `/laptops/price/between/${bounds.min}-${bounds.max}`,
    filtered: requestIsFiltered(await searchParams),
  });
}

export default async function BetweenPricePage({ params, searchParams }: PageProps) {
  const { range } = await params;
  const bounds = parseBudgetRange(range);
  if (!bounds) {
    notFound();
  }
  const search = await searchParams;
  const minLabel = formatRupees(bounds.min * 100);
  const maxLabel = formatRupees(bounds.max * 100);

  return (
    <CataloguePage
      heading={`Laptops ${minLabel} – ${maxLabel}`}
      intro={`Every model whose current lowest price is between ${minLabel} and ${maxLabel}. This band is fixed by the address; add the other facets on top of it.`}
      basePath={`/laptops/price/between/${bounds.min}-${bounds.max}`}
      priceRange={{ minMinor: bounds.min * 100, maxMinor: bounds.max * 100 }}
      hideFacets={["price"]}
      searchParams={search}
      crumbs={[
        { label: "Home", href: "/" },
        { label: "All laptops", href: "/laptops" },
        {
          label: `${minLabel} – ${maxLabel}`,
          href: `/laptops/price/between/${bounds.min}-${bounds.max}`,
        },
      ]}
    />
  );
}

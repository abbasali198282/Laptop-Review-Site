import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CataloguePage } from "../../../../../components/CataloguePage";
import { parseBudgetAmount } from "../../../../../lib/config";
import { formatRupees } from "../../../../../lib/format";
import { requestIsFiltered, type NextSearchParams } from "../../../../../lib/params";
import { listMetadata } from "../../../../../lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ amount: string }>;
  searchParams: Promise<NextSearchParams>;
};


export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { amount } = await params;
  const max = parseBudgetAmount(amount);
  if (max === null) {
    return { title: "Price band not found", robots: { index: false, follow: true } };
  }
  return listMetadata({
    title: `Laptops under ${formatRupees(max * 100)}`,
    description: `Every laptop whose current lowest price is under ${formatRupees(max * 100)}, with model codes and hardware.`,
    canonicalPath: `/laptops/price/under/${max}`,
    filtered: requestIsFiltered(await searchParams),
  });
}

export default async function UnderPricePage({ params, searchParams }: PageProps) {
  const { amount } = await params;
  const max = parseBudgetAmount(amount);
  if (max === null) {
    notFound();
  }
  const search = await searchParams;
  const label = formatRupees(max * 100);

  return (
    <CataloguePage
      heading={`Laptops under ${label}`}
      intro={`Every model whose current lowest price is under ${label}. This band is fixed by the address; add the other facets on top of it.`}
      basePath={`/laptops/price/under/${max}`}
      priceRange={{ minMinor: 0, maxMinor: max * 100 }}
      hideFacets={["price"]}
      searchParams={search}
      crumbs={[
        { label: "Home", href: "/" },
        { label: "All laptops", href: "/laptops" },
        { label: `Under ${label}`, href: `/laptops/price/under/${max}` },
      ]}
    />
  );
}

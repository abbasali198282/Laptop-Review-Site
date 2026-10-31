import type { Metadata } from "next";
import { CataloguePage } from "../../components/CataloguePage";
import { requestIsFiltered, type NextSearchParams } from "../../lib/params";
import { listMetadata } from "../../lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<NextSearchParams> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  return listMetadata({
    title: "All laptops",
    description:
      "Browse every laptop in the catalogue by brand, price band, processor, RAM, storage, graphics, screen size, operating system, touch and form factor.",
    canonicalPath: "/laptops",
    filtered: requestIsFiltered(params),
  });
}

export default async function LaptopsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <CataloguePage
      heading="All laptops"
      intro="Every laptop in the catalogue. Narrow by brand, price band and hardware — each filter is a link you can copy and reopen."
      basePath="/laptops"
      searchParams={params}
      crumbs={[
        { label: "Home", href: "/" },
        { label: "All laptops", href: "/laptops" },
      ]}
    />
  );
}

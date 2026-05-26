import ProductsListShell from "@/components/productComponent/ProductsListShell";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = params.q;
  const initialQuery = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  return <ProductsListShell initialQuery={initialQuery} />;
}

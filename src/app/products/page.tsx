import { Suspense } from "react";

import ProductsListShell from "@/components/productComponent/ProductsListShell";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    price?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="product-page product-page--collection" aria-busy="true" />
      }
    >
      <ProductsListShell
        initialQuery={firstParam(params.q)}
        initialCategory={firstParam(params.category)}
        initialPriceTier={firstParam(params.price)}
      />
    </Suspense>
  );
}

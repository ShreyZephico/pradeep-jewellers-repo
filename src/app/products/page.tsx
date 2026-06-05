import { Suspense } from "react";

import ProductsListShell from "@/components/productComponent/ProductsListShell";
import { parseCollectionFacetFilters } from "@/lib/shopCollectionFilters";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    price?: string | string[];
    sizes?: string | string[];
    discount?: string | string[];
    weight?: string | string[];
    material?: string | string[];
    metal?: string | string[];
    shop?: string | string[];
    occasion?: string | string[];
    searchTag?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialFacets = parseCollectionFacetFilters({
    discount: firstParam(params.discount),
    weight: firstParam(params.weight),
    material: firstParam(params.material),
    metal: firstParam(params.metal),
    shop: firstParam(params.shop),
    occasion: firstParam(params.occasion),
    searchTag: firstParam(params.searchTag),
  });

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
        initialRingSizes={firstParam(params.sizes)}
        initialFacets={initialFacets}
      />
    </Suspense>
  );
}

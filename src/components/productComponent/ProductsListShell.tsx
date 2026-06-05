"use client";

import { useEffect, useState } from "react";

import ProductsPageClient from "@/components/productComponent/ProductsPageClient";
import { consumeProductsListStale } from "@/lib/productsListRefresh";
import type { CollectionFacetFilters } from "@/lib/shopCollectionFilters";

type ProductsListShellProps = {
  initialQuery: string;
  initialCategory?: string;
  initialPriceTier?: string;
  initialRingSizes?: string;
  initialFacets?: CollectionFacetFilters;
};

export default function ProductsListShell({
  initialQuery,
  initialCategory = "",
  initialPriceTier = "",
  initialRingSizes = "",
  initialFacets,
}: ProductsListShellProps) {
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const bumpIfStale = () => {
      if (consumeProductsListStale()) {
        setRefreshToken((n) => n + 1);
      }
    };

    bumpIfStale();

    const onPageShow = (event: PageTransitionEvent) => {
      // Restored from bfcache after leaving for Shopify checkout.
      if (event.persisted) {
        bumpIfStale();
      }
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <ProductsPageClient
      initialQuery={initialQuery}
      initialCategory={initialCategory}
      initialPriceTier={initialPriceTier}
      initialRingSizes={initialRingSizes}
      initialFacets={initialFacets}
      refreshToken={refreshToken}
    />
  );
}

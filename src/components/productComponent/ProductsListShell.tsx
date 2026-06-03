"use client";

import { useEffect, useState } from "react";

import ProductsPageClient from "@/components/productComponent/ProductsPageClient";
import { consumeProductsListStale } from "@/lib/productsListRefresh";

type ProductsListShellProps = {
  initialQuery: string;
  initialCategory?: string;
  initialPriceTier?: string;
};

export default function ProductsListShell({
  initialQuery,
  initialCategory = "",
  initialPriceTier = "",
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
      refreshToken={refreshToken}
    />
  );
}

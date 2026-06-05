"use client";

import { useCallback, useEffect, useState } from "react";

import { rememberListProducts } from "@/lib/productListSnapshot";
import type { Product } from "@/types/product";

const HOME_CATALOG_LIMIT = 50;

let cachedProducts: Product[] | null = null;
let inflightRequest: Promise<Product[]> | null = null;

function clearHomeCatalogCache() {
  cachedProducts = null;
  inflightRequest = null;
}

async function fetchHomeCatalog(): Promise<Product[]> {
  if (cachedProducts) {
    return cachedProducts;
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = (async () => {
    const params = new URLSearchParams({
      page: "1",
      limit: String(HOME_CATALOG_LIMIT),
      category: "all",
    });

    const response = await fetch(`/api/products?${params.toString()}`, {
      credentials: "omit",
    });

    const json = (await response.json()) as {
      success?: boolean;
      products?: Product[];
      error?: string;
    };

    if (!response.ok || !json.success) {
      throw new Error(json.error ?? "Could not load products.");
    }

    cachedProducts = json.products ?? [];
    rememberListProducts(cachedProducts);
    return cachedProducts;
  })();

  try {
    return await inflightRequest;
  } finally {
    inflightRequest = null;
  }
}

export function useHomeCatalogProducts() {
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [loading, setLoading] = useState(!cachedProducts);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (force) {
      clearHomeCatalogCache();
    }

    setLoading(true);
    setError(null);

    try {
      const next = await fetchHomeCatalog();
      setProducts(next);
    } catch (loadError) {
      setProducts([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load products."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
      return;
    }
    void load(false);
  }, [load]);

  return { products, loading, error, reload: () => load(true) };
}

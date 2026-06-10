"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  PRODUCT_DETAIL_CACHE_EVENT,
  readProductDetailCache,
} from "@/lib/productDetailCache";
import { readListProductSnapshot } from "@/lib/productListSnapshot";
import type { Product } from "@/types/product";

function readSeed(slug: string, initialProduct?: Product | null): Product | null {
  if (initialProduct) return initialProduct;
  if (typeof window === "undefined") return null;
  return readProductDetailCache(slug) ?? readListProductSnapshot(slug) ?? null;
}

let storeVersion = 0;

type SnapshotEntry = {
  storeVersion: number;
  slug: string;
  initialProduct: Product | null | undefined;
  value: Product | null;
};

let snapshotEntry: SnapshotEntry | null = null;

function subscribeProductDetailCache(onStoreChange: () => void): () => void {
  const onCacheChange = () => {
    storeVersion += 1;
    onStoreChange();
  };
  window.addEventListener(PRODUCT_DETAIL_CACHE_EVENT, onCacheChange);
  return () => window.removeEventListener(PRODUCT_DETAIL_CACHE_EVENT, onCacheChange);
}

/** Must return a stable reference until the store version or slug changes. */
function getClientSnapshot(slug: string, initialProduct?: Product | null): Product | null {
  if (
    snapshotEntry &&
    snapshotEntry.storeVersion === storeVersion &&
    snapshotEntry.slug === slug &&
    snapshotEntry.initialProduct === initialProduct
  ) {
    return snapshotEntry.value;
  }

  const value = readSeed(slug, initialProduct);
  snapshotEntry = { storeVersion, slug, initialProduct, value };
  return value;
}

/** Synchronous client seed from list hover, session cache, or SSR props. */
export function useProductDetailSeed(
  slug: string,
  initialProduct?: Product | null
): Product | null {
  const getSnapshot = useCallback(
    () => getClientSnapshot(slug, initialProduct),
    [slug, initialProduct]
  );

  return useSyncExternalStore(
    subscribeProductDetailCache,
    getSnapshot,
    () => initialProduct ?? null
  );
}

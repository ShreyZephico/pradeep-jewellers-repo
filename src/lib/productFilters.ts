import type { Product } from "@/types/product";
import {
  productMatchesCollectionFacets,
  type CollectionFacetFilters,
} from "@/lib/shopCollectionFilters";

export type ProductSort =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

export type PriceBounds = {
  min: number;
  max: number;
};

export type ProductListFilters = {
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  /** Indian ring sizes (5–15) when browsing Rings / All. */
  ringSizes?: string[];
  /** On “All”, only list products that declare matching ring sizes. */
  ringSizeMatchStrict?: boolean;
  facets?: CollectionFacetFilters;
};

const SORT_VALUES: ProductSort[] = [
  "featured",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
];

export function parseProductSort(value: string | null | undefined): ProductSort {
  if (value && SORT_VALUES.includes(value as ProductSort)) {
    return value as ProductSort;
  }
  return "featured";
}

export type PriceTierConfig = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

export function priceTierToRange(
  tierId: string,
  tiers: PriceTierConfig[]
): { min: number | null; max: number | null } {
  const tier = tiers.find((t) => t.id === tierId);
  if (!tier || tier.id === "any") {
    return { min: null, max: null };
  }
  return {
    min: tier.min ?? null,
    max: tier.max ?? null,
  };
}

export function parsePriceParam(value: string | null | undefined): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return undefined;
  }
  return Math.round(n);
}

export function computePriceBounds(products: Product[]): PriceBounds {
  if (products.length === 0) {
    return { min: 0, max: 0 };
  }
  let min = products[0].price;
  let max = products[0].price;
  for (const product of products) {
    if (product.price < min) min = product.price;
    if (product.price > max) max = product.price;
  }
  return { min, max };
}

function sortProducts(products: Product[], sort: ProductSort): Product[] {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "name-asc":
      return list.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    case "name-desc":
      return list.sort((a, b) => b.name.localeCompare(a.name, "en", { sensitivity: "base" }));
    case "featured":
    default:
      return list;
  }
}

export function productMatchesRingSizeFilter(
  product: Product,
  selectedSizes: string[],
  options?: { strict?: boolean }
): boolean {
  if (!selectedSizes.length) {
    return true;
  }

  const available = product.availableRingSizes ?? [];
  if (!available.length) {
    return options?.strict ? false : true;
  }

  return selectedSizes.some((size) => available.includes(size));
}

export function applyProductListFilters(
  products: Product[],
  filters: ProductListFilters
): Product[] {
  const sort = filters.sort ?? "featured";
  let list = products;

  if (filters.minPrice != null) {
    list = list.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    list = list.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.ringSizes?.length) {
    const sizes = filters.ringSizes;
    list = list.filter((p) =>
      productMatchesRingSizeFilter(p, sizes, {
        strict: filters.ringSizeMatchStrict,
      })
    );
  }

  if (filters.facets) {
    list = list.filter((p) => productMatchesCollectionFacets(p, filters.facets!));
  }

  return sortProducts(list, sort);
}

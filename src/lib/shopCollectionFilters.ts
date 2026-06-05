import productContent from "@/lib/productContent";
import type { Product } from "@/types/product";
import { parseSearchTagsQueryParam, productMatchesSearchTags } from "@/utils/searchTags";

export type CollectionFilterOption = {
  id: string;
  label: string;
  keywords?: string[];
  swatch?: string;
  min?: number;
  max?: number | null;
};

export type CollectionFacetFilters = {
  discounts: string[];
  weights: string[];
  materials: string[];
  metals: string[];
  shopFor: string[];
  occasions: string[];
  /** Slugs from Shopify Search Tags metafield (`searchTag` URL param). */
  searchTags: string[];
};

export const collectionFilterConfig = productContent.collectionFilters;
export const COLLECTION_FILTER_VISIBLE_COUNT =
  collectionFilterConfig.visibleOptionCount ?? 4;

const EMPTY_FACETS: CollectionFacetFilters = {
  discounts: [],
  weights: [],
  materials: [],
  metals: [],
  shopFor: [],
  occasions: [],
  searchTags: [],
};

function parseCsvParam(raw: string | null | undefined, allowed: Set<string>): string[] {
  if (!raw?.trim()) {
    return [];
  }
  const seen = new Set<string>();
  const values: string[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (!id || !allowed.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    values.push(id);
  }
  return values;
}

function allowedIds(options: CollectionFilterOption[]): Set<string> {
  return new Set(options.map((option) => option.id));
}

export function parseCollectionFacetFilters(searchParams: {
  discount?: string | null;
  weight?: string | null;
  material?: string | null;
  metal?: string | null;
  shop?: string | null;
  occasion?: string | null;
  searchTag?: string | null;
}): CollectionFacetFilters {
  return {
    discounts: parseCsvParam(
      searchParams.discount,
      allowedIds(collectionFilterConfig.discounts)
    ),
    weights: parseCsvParam(
      searchParams.weight,
      allowedIds(collectionFilterConfig.weightRanges)
    ),
    materials: parseCsvParam(
      searchParams.material,
      allowedIds(collectionFilterConfig.materials)
    ),
    metals: parseCsvParam(
      searchParams.metal,
      allowedIds(collectionFilterConfig.metals)
    ),
    shopFor: parseCsvParam(searchParams.shop, allowedIds(collectionFilterConfig.shopFor)),
    occasions: parseCsvParam(
      searchParams.occasion,
      allowedIds(collectionFilterConfig.occasions)
    ),
    searchTags: parseSearchTagsQueryParam(searchParams.searchTag),
  };
}

export function serializeCollectionFacetFilters(
  facets: CollectionFacetFilters
): Record<string, string> {
  const params: Record<string, string> = {};
  if (facets.discounts.length) {
    params.discount = facets.discounts.join(",");
  }
  if (facets.weights.length) {
    params.weight = facets.weights.join(",");
  }
  if (facets.materials.length) {
    params.material = facets.materials.join(",");
  }
  if (facets.metals.length) {
    params.metal = facets.metals.join(",");
  }
  if (facets.shopFor.length) {
    params.shop = facets.shopFor.join(",");
  }
  if (facets.occasions.length) {
    params.occasion = facets.occasions.join(",");
  }
  if (facets.searchTags.length) {
    params.searchTag = facets.searchTags.join(",");
  }
  return params;
}

export function countActiveCollectionFacets(facets: CollectionFacetFilters): number {
  return (
    facets.discounts.length +
    facets.weights.length +
    facets.materials.length +
    facets.metals.length +
    facets.shopFor.length +
    facets.occasions.length +
    facets.searchTags.length
  );
}

export function collectionFacetsAreEmpty(facets: CollectionFacetFilters): boolean {
  return countActiveCollectionFacets(facets) === 0;
}

export const EMPTY_COLLECTION_FACETS = EMPTY_FACETS;

function productHaystack(product: Product): string {
  return [
    product.name,
    product.description,
    product.shortDescription,
    product.productType,
    ...(product.tags ?? []),
    ...(product.searchTags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function haystackMatchesKeywords(haystack: string, keywords: string[]): boolean {
  return keywords.some((keyword) => {
    const term = keyword.trim().toLowerCase();
    if (!term) {
      return false;
    }
    return haystack.includes(term);
  });
}

function matchesKeywordOptions(
  product: Product,
  selectedIds: string[],
  options: CollectionFilterOption[]
): boolean {
  if (!selectedIds.length) {
    return true;
  }
  const haystack = productHaystack(product);
  return selectedIds.some((id) => {
    const option = options.find((entry) => entry.id === id);
    if (!option?.keywords?.length) {
      return false;
    }
    return haystackMatchesKeywords(haystack, option.keywords);
  });
}

function matchesWeightRange(product: Product, range: CollectionFilterOption): boolean {
  const grams = product.listingWeightGrams;
  if (grams == null || !Number.isFinite(grams)) {
    return false;
  }
  const min = range.min ?? 0;
  const max = range.max;
  if (max == null) {
    return grams >= min;
  }
  return grams >= min && grams < max;
}

function matchesWeightRanges(product: Product, selectedIds: string[]): boolean {
  if (!selectedIds.length) {
    return true;
  }
  return selectedIds.some((id) => {
    const range = collectionFilterConfig.weightRanges.find((entry) => entry.id === id);
    return range ? matchesWeightRange(product, range) : false;
  });
}

function matchesDiscounts(product: Product, selectedIds: string[]): boolean {
  if (!selectedIds.length) {
    return true;
  }
  const haystack = productHaystack(product);
  return selectedIds.some((id) => {
    if (id === "sale") {
      return (
        (product.compareAtPrice != null && product.compareAtPrice > product.price) ||
        haystackMatchesKeywords(haystack, ["sale", "discount", "offer"])
      );
    }
    if (id === "making-50") {
      return (
        haystackMatchesKeywords(haystack, ["making", "making charge", "making-charge"]) ||
        (product.makingChargePercent != null && product.makingChargePercent >= 40)
      );
    }
    const option = collectionFilterConfig.discounts.find((entry) => entry.id === id);
    return option?.keywords
      ? haystackMatchesKeywords(haystack, option.keywords)
      : false;
  });
}

export function productMatchesCollectionFacets(
  product: Product,
  facets: CollectionFacetFilters
): boolean {
  if (!matchesDiscounts(product, facets.discounts)) {
    return false;
  }
  if (!matchesWeightRanges(product, facets.weights)) {
    return false;
  }
  if (
    !matchesKeywordOptions(product, facets.materials, collectionFilterConfig.materials)
  ) {
    return false;
  }
  if (!matchesKeywordOptions(product, facets.metals, collectionFilterConfig.metals)) {
    return false;
  }
  if (!matchesKeywordOptions(product, facets.shopFor, collectionFilterConfig.shopFor)) {
    return false;
  }
  if (!matchesKeywordOptions(product, facets.occasions, collectionFilterConfig.occasions)) {
    return false;
  }
  if (!productMatchesSearchTags(product, facets.searchTags)) {
    return false;
  }
  return true;
}

export function toggleFacetSelection(
  selected: string[],
  id: string
): string[] {
  return selected.includes(id)
    ? selected.filter((value) => value !== id)
    : [...selected, id];
}

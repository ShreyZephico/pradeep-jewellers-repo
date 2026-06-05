import type { Product } from "@/types/product";
import { productSearchTagSlugs } from "@/utils/searchTags";

const CATEGORY_KEYWORDS: Record<string, readonly string[]> = {
  ring: ["ring"],
  earring: ["earring", "stud", "jhumka"],
  bracelet: ["bracelet"],
  bangle: ["bangle"],
  necklace: ["necklace"],
  pendant: ["pendant"],
  "necklace-set": ["necklace set", "necklace-set"],
  "pendant-set": ["pendant set", "pendant-set"],
  mangalsutra: ["mangalsutra"],
  chain: ["chain"],
  anklet: ["anklet", "payal"],
  kada: ["kada"],
  charm: ["charm"],
  "nose-pin": ["nose pin", "nose-pin", "nath"],
  gold: ["gold jewellery", "gold jewelry"],
  diamond: ["diamond"],
  silver: ["silver"],
  gemstone: ["gemstone", "ruby", "emerald", "sapphire", "pearl"],
};

/** Shape categories used for “more rings on ring PDP” style recommendations. */
export const JEWELRY_SHAPE_CATEGORIES = new Set([
  "ring",
  "earring",
  "bracelet",
  "bangle",
  "necklace",
  "pendant",
  "necklace-set",
  "pendant-set",
  "mangalsutra",
  "chain",
  "anklet",
  "kada",
  "charm",
  "nose-pin",
]);

const CATEGORY_MATCHERS = Object.entries(CATEGORY_KEYWORDS)
  .flatMap(([id, keywords]) => keywords.map((keyword) => ({ id, keyword })))
  .sort((a, b) => b.keyword.length - a.keyword.length);

const SAME_CATEGORY_MIN_RATIO = 0.75;

function normalizeHandle(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Exclude current PDP product even when ids differ (slug vs GID). */
export function isSameCatalogProduct(source: Product, candidate: Product): boolean {
  if (source.id === candidate.id) {
    return true;
  }

  const sourceKeys = new Set(
    [source.id, source.handle, source.slug].map(normalizeHandle).filter(Boolean)
  );
  const candidateKeys = [candidate.id, candidate.handle, candidate.slug]
    .map(normalizeHandle)
    .filter(Boolean);

  return candidateKeys.some((key) => sourceKeys.has(key));
}

function matchCategoryInText(text: string): string | null {
  const haystack = text.toLowerCase();
  if (!haystack) {
    return null;
  }

  for (const { id, keyword } of CATEGORY_MATCHERS) {
    if (haystack.includes(keyword)) {
      return id;
    }
  }

  return null;
}

/** Best-effort jewellery shape from title first (avoids tag-only false matches). */
export function inferProductCategoryId(product: Product): string | null {
  const fromName = matchCategoryInText(product.name);
  if (fromName && JEWELRY_SHAPE_CATEGORIES.has(fromName)) {
    return fromName;
  }

  if (product.productType) {
    const fromType = matchCategoryInText(product.productType);
    if (fromType && JEWELRY_SHAPE_CATEGORIES.has(fromType)) {
      return fromType;
    }
  }

  for (const tag of product.searchTags ?? []) {
    const fromTag = matchCategoryInText(tag);
    if (fromTag && JEWELRY_SHAPE_CATEGORIES.has(fromTag)) {
      return fromTag;
    }
  }

  const fromDescription = matchCategoryInText(product.description ?? "");
  if (fromDescription && JEWELRY_SHAPE_CATEGORIES.has(fromDescription)) {
    return fromDescription;
  }

  return null;
}

function scoreRecommendation(
  source: Product,
  candidate: Product,
  sourceCategory: string | null
): number {
  if (isSameCatalogProduct(source, candidate)) {
    return -1;
  }

  let score = 0;
  const candidateCategory = inferProductCategoryId(candidate);
  const sameShapeCategory =
    sourceCategory != null &&
    candidateCategory != null &&
    sourceCategory === candidateCategory;

  if (sameShapeCategory) {
    score += 100;
  }

  const sourceTagSlugs = new Set(productSearchTagSlugs(source));
  for (const slug of productSearchTagSlugs(candidate)) {
    if (sourceTagSlugs.has(slug)) {
      score += sameShapeCategory ? 6 : 2;
    }
  }

  const sourceType = source.productType?.trim().toLowerCase();
  const candidateType = candidate.productType?.trim().toLowerCase();
  if (sourceType && candidateType && sourceType === candidateType) {
    score += 4;
  }

  const priceDelta = Math.abs(source.price - candidate.price);
  if (priceDelta <= source.price * 0.35) {
    score += 2;
  }

  return score;
}

type RankedProduct = {
  product: Product;
  score: number;
  category: string | null;
};

function rankCandidates(source: Product, catalog: Product[]): RankedProduct[] {
  const sourceCategory = inferProductCategoryId(source);

  return catalog
    .filter((item) => !isSameCatalogProduct(source, item))
    .map((item) => ({
      product: item,
      score: scoreRecommendation(source, item, sourceCategory),
      category: inferProductCategoryId(item),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.product.name.localeCompare(b.product.name, "en", {
        sensitivity: "base",
      });
    });
}

/**
 * Mostly same jewellery type (e.g. rings on a ring PDP), plus a few cross-category picks.
 */
export function pickRecommendedProducts(
  source: Product,
  catalog: Product[],
  limit: number
): Product[] {
  const cap = Math.max(1, Math.min(limit, 20));
  const sourceCategory = inferProductCategoryId(source);
  const ranked = rankCandidates(source, catalog);

  if (!sourceCategory) {
    return ranked.slice(0, cap).map((row) => row.product);
  }

  const sameCategory = ranked.filter((row) => row.category === sourceCategory);
  const otherCategory = ranked.filter((row) => row.category !== sourceCategory);
  const minSame = Math.max(1, Math.ceil(cap * SAME_CATEGORY_MIN_RATIO));
  const picked: Product[] = [];
  const seen = new Set<string>();

  const push = (product: Product) => {
    if (seen.has(product.id)) {
      return;
    }
    seen.add(product.id);
    picked.push(product);
  };

  for (const row of sameCategory) {
    if (picked.length >= minSame) {
      break;
    }
    push(row.product);
  }

  for (const row of otherCategory) {
    if (picked.length >= cap) {
      break;
    }
    push(row.product);
  }

  if (picked.length < cap) {
    for (const row of sameCategory) {
      if (picked.length >= cap) {
        break;
      }
      push(row.product);
    }
  }

  if (picked.length < cap) {
    for (const row of ranked) {
      if (picked.length >= cap) {
        break;
      }
      push(row.product);
    }
  }

  return picked.slice(0, cap);
}

import type { Product } from "@/types/product";
import type { CollectionFilterOption } from "@/lib/shopCollectionFilters";

const SEARCH_TAG_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Parse Shopify `custom.search_tags` (list JSON, bullets, or lines). */
export function parseSearchTagsMetafield(
  value: string | null | undefined
): string[] {
  if (!value?.trim()) {
    return [];
  }

  const trimmed = value.trim();
  let parts: string[] = [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        parts = parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      parts = [];
    }
  }

  if (parts.length === 0) {
    parts = trimmed
      .split(/[•|,;\n]+/)
      .map((part) => part.trim().replace(/\s+/g, " "))
      .filter(Boolean);
  }

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const label of parts) {
    const key = label.toLowerCase();
    if (!label || seen.has(key)) {
      continue;
    }
    seen.add(key);
    tags.push(label);
  }

  return tags;
}

export function slugifySearchTag(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSearchTagSlug(id: string): boolean {
  return SEARCH_TAG_SLUG_RE.test(id);
}

export function parseSearchTagsQueryParam(
  raw: string | null | undefined
): string[] {
  if (!raw?.trim()) {
    return [];
  }

  const seen = new Set<string>();
  const values: string[] = [];

  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (!id || !isValidSearchTagSlug(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    values.push(id);
  }

  return values;
}

export function productSearchTagSlugs(product: Product): string[] {
  return (product.searchTags ?? [])
    .map(slugifySearchTag)
    .filter((slug) => Boolean(slug));
}

export function productMatchesSearchTags(
  product: Product,
  selectedIds: string[]
): boolean {
  if (!selectedIds.length) {
    return true;
  }
  const slugs = productSearchTagSlugs(product);
  return selectedIds.some((id) => slugs.includes(id));
}

export function productSearchHaystack(product: Product): string {
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

const SEARCH_STOP_WORDS = new Set([
  "for",
  "the",
  "a",
  "an",
  "and",
  "or",
  "in",
  "on",
  "at",
  "to",
  "of",
  "with",
]);

/** Words that matter for matching (drops “for”, “the”, etc.). */
export function significantSearchWords(rawQuery: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];

  for (const part of rawQuery.trim().toLowerCase().split(/\s+/)) {
    if (part.length < 2 || SEARCH_STOP_WORDS.has(part) || seen.has(part)) {
      continue;
    }
    seen.add(part);
    words.push(part);
  }

  return words;
}

/** Higher score = better match. Used to rank header / collection search. */
export function scoreProductSearchQuery(
  product: Product,
  rawQuery: string
): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return 0;
  }

  const name = product.name.toLowerCase();
  const haystack = productSearchHaystack(product);
  const handle = (product.handle ?? product.slug ?? "").toLowerCase();
  const words = significantSearchWords(query);

  if (name === query) {
    return 1000;
  }
  if (name.startsWith(query)) {
    return 920;
  }
  if (name.includes(query)) {
    return 880;
  }

  const slugQuery = query.replace(/[''']/g, "").replace(/\s+/g, "-");
  if (handle && (handle.includes(slugQuery) || handle.includes(query.replace(/\s+/g, "-")))) {
    return 860;
  }

  if (words.length > 0) {
    const nameHits = words.filter((word) => name.includes(word)).length;
    if (nameHits === words.length) {
      return 820;
    }
    if (nameHits >= Math.ceil(words.length * 0.75)) {
      return 700;
    }

    const hayHits = words.filter((word) => haystack.includes(word)).length;
    if (hayHits === words.length) {
      return 500;
    }
    if (hayHits >= Math.ceil(words.length * 0.6)) {
      return 320;
    }
  }

  if (haystack.includes(query)) {
    return 400;
  }

  return 0;
}

const MIN_SEARCH_MATCH_SCORE = 300;

/** Match header / collection search — requires strong title/tag overlap, not a single word. */
export function productMatchesSearchQuery(
  product: Product,
  rawQuery: string
): boolean {
  return scoreProductSearchQuery(product, rawQuery) >= MIN_SEARCH_MATCH_SCORE;
}

/** Sort products by search relevance (best matches first). */
export function rankProductsBySearchQuery(
  products: Product[],
  rawQuery: string
): Product[] {
  const query = rawQuery.trim();
  if (!query) {
    return products;
  }

  return [...products]
    .map((product) => ({
      product,
      score: scoreProductSearchQuery(product, query),
    }))
    .filter((row) => row.score >= MIN_SEARCH_MATCH_SCORE)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.product.name.localeCompare(b.product.name, "en", {
        sensitivity: "base",
      });
    })
    .map((row) => row.product);
}

export function buildSearchTagFilterOptions(
  products: Product[]
): CollectionFilterOption[] {
  const byId = new Map<string, string>();

  for (const product of products) {
    for (const label of product.searchTags ?? []) {
      const id = slugifySearchTag(label);
      if (!id || byId.has(id)) {
        continue;
      }
      byId.set(id, label);
    }
  }

  return [...byId.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "en", { sensitivity: "base" }))
    .map(([id, label]) => ({ id, label }));
}

export function buildSearchTagSuggestions(
  products: Product[],
  query: string,
  limit = 8
): CollectionFilterOption[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) {
    return [];
  }

  return buildSearchTagFilterOptions(products)
    .filter((option) => option.label.toLowerCase().includes(normalized))
    .slice(0, limit);
}

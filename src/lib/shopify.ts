import { products as fallbackProducts } from "@/data/products";
import {
  applyProductListFilters,
  computePriceBounds,
  type PriceBounds,
  type ProductListFilters,
  type ProductSort,
} from "@/lib/productFilters";
import { getShopifyStorefrontApiVersion } from "@/lib/shopifyApiVersion";
import type { Product, ProductVariant } from "@/types/product";
import { fetchSearchTagsFromShopifyAdmin } from "@/lib/shopifySearchTags";
import {
  buildSearchTagFilterOptions,
  buildSearchTagSuggestions,
  parseSearchTagsMetafield,
  rankProductsBySearchQuery,
  significantSearchWords,
} from "@/utils/searchTags";
import type { CollectionFilterOption } from "@/lib/shopCollectionFilters";
import calculateVariantPrice from "@/utils/calculateVariantPrice";
import getGoldPrice from "@/utils/goldPrice";
import { parseMakingChargeFromMetafields } from "@/utils/makingCharge";
import { fetchMakingChargeFromShopifyAdmin } from "@/lib/shopifyMakingCharge";
import { getSiteOrigin } from "@/lib/siteUrl";

let missingGoldPriceLogged = false;

function logMissingGoldPriceOnce(): void {
  if (missingGoldPriceLogged) return;
  missingGoldPriceLogged = true;
  console.warn(
    "[shopify] No manual 24K gold price in store_metal_prices — using Shopify variant prices. Save today's rates at /metal-prices."
  );
}
import { isKaratLabel, isKaratOption } from "@/utils/karat";
import { resolveVariantWeight } from "@/utils/resolveVariantWeight";
import {
  catalogValuesFitStorefront,
  intersectionScoreFuzzy,
  variantOptionValueSet,
} from "@/utils/variantOptionMatch";
import {
  isSizeLikeOptionName,
  readSizeFromAttributes,
} from "@/utils/productCustomizationLabels";
import { productHasCustomizationOptions } from "@/utils/productCustomization";
import type { CollectionFacetFilters } from "@/lib/shopCollectionFilters";
import {
  categoryShowsRingSizeFilter,
  normalizeRingSizeFilterValue,
} from "@/utils/ringSizeChart";

function normalizeStoreDomain(raw?: string): string {
  if (!raw?.trim()) {
    return "";
  }
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

/** Store + Storefront token from `.env` (NEXT_* preferred, server fallback). */
function getStorefrontCredentials() {
  const domain = normalizeStoreDomain(
    process.env.NEXT_SHOPIFY_STORE ?? process.env.SHOPIFY_STORE_DOMAIN
  );

  const apiVersion = getShopifyStorefrontApiVersion();

  const publicToken = process.env.NEXT_SHOPIFY_STOREFRONT_TOKEN?.trim();
  const serverToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();

  // `shpat_*` is an Admin API token — Storefront GraphQL needs a Storefront access token.
  const token =
    (publicToken && !publicToken.startsWith("shpat_") ? publicToken : undefined) ??
    serverToken ??
    publicToken ??
    "";

  return { domain, token, apiVersion };
}

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  featuredImage: {
    url: string;
    altText: string | null;
  } | null;
  images?: {
    edges: {
      node: {
        url: string;
        altText: string | null;
      };
    }[];
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
    };
  };
  compareAtPriceRange: {
    minVariantPrice: {
      amount: string;
    };
  };
  description: string;
  productType?: string;
  tags?: string[];
  options: {
    name: string;
    values: string[];
  }[];
  variantsCount?: {
    count: number;
  };
  variants: {
    edges: {
      node: {
        id: string;
        image?: {
          url: string;
          altText: string | null;
        } | null;
        price?: {
          amount: string;
        };
        weight?: number | null;
        weightUnit?: string | null;
        selectedOptions: {
          name: string;
          value: string;
        }[];
      };
    }[];
  };
  makingChargeType?: { value: string | null } | null;
  makingChargeValue?: { value: string | null } | null;
  searchTagsMetafield?: { value: string | null } | null;
};

const productNodeFields = `
          id
          handle
          title
          description
          featuredImage {
            url
            altText
          }
          images(first: 12) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
            }
          }
          options {
            name
            values
          }
          variants(first: 100) {
            edges {
              node {
                id
                availableForSale
                image {
                  url
                  altText
                }
                price {
                  amount
                }
                weight
                weightUnit
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          makingChargeType: metafield(namespace: "custom", key: "making_charge_type") {
            value
          }
          makingChargeValue: metafield(namespace: "custom", key: "making_charge") {
            value
          }
          searchTagsMetafield: metafield(namespace: "custom", key: "search_tags") {
            value
          }
`;

/** Smaller payload for grids — variant count + sample variants for “from” price only. */
const productListNodeFields = `
          id
          handle
          title
          description
          productType
          tags
          featuredImage {
            url
            altText
          }
          images(first: 4) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
            }
          }
          options {
            name
            values
          }
          variantsCount {
            count
          }
          variants(first: 12) {
            edges {
              node {
                id
                weight
                weightUnit
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          makingChargeType: metafield(namespace: "custom", key: "making_charge_type") {
            value
          }
          makingChargeValue: metafield(namespace: "custom", key: "making_charge") {
            value
          }
          searchTagsMetafield: metafield(namespace: "custom", key: "search_tags") {
            value
          }
`;

const PRODUCTS_LIST_QUERY = `
  query ProductsList($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
${productListNodeFields}
        }
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
${productNodeFields}
    }
  }
`;

const PRODUCT_BY_ID_QUERY = `
  query ProductById($id: ID!) {
    product(id: $id) {
${productNodeFields}
    }
  }
`;

type ShopifyProductByHandleResponse = {
  product: ShopifyProductNode | null;
};

type ShopifyProductsListResponse = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: {
      node: ShopifyProductNode;
    }[];
  };
};

type ShopifyPolicy = {
  id: string;
  title: string;
  body: string;
  handle?: string | null;
  url?: string | null;
};

export type ShopifyShopPolicies = {
  privacyPolicy: ShopifyPolicy | null;
  termsOfService: ShopifyPolicy | null;
  refundPolicy: ShopifyPolicy | null;
  shippingPolicy?: ShopifyPolicy | null;
};

async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const { domain, token, apiVersion } = getStorefrontCredentials();

  if (!domain || !token) {
    throw new Error(
      "Missing Shopify Storefront credentials. Set NEXT_SHOPIFY_STORE and a Storefront access token (not Admin shpat_) in .env."
    );
  }

  const response = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: variables ? "no-store" : "force-cache",
    next: variables ? undefined : { revalidate: 60 },
    signal: AbortSignal.timeout(25_000),
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors ?? json));
  }

  return json.data as T;
}

const SHOP_POLICIES_QUERY = `
  query ShopPolicies {
    shop {
      privacyPolicy { id title body handle url }
      termsOfService { id title body handle url }
      refundPolicy { id title body handle url }
      shippingPolicy { id title body handle url }
    }
  }
`;

export async function getShopPolicies(): Promise<ShopifyShopPolicies> {
  const data = await shopifyFetch<{ shop: ShopifyShopPolicies }>(SHOP_POLICIES_QUERY);
  return data.shop;
}

async function shopifyAdminFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const { domain, apiVersion } = getStorefrontCredentials();

  if (!domain || !adminToken) {
    throw new Error("Missing Shopify Admin API environment variables.");
  }

  const response = await fetch(
    `https://${domain}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    }
  );

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors ?? json));
  }

  return json.data as T;
}

function shopifyWeightToGrams(
  weight: number | null | undefined,
  unit: string | null | undefined
): number {
  const w = Number(weight);
  if (!Number.isFinite(w) || w <= 0) {
    return 0;
  }
  const u = (unit ?? "GRAMS").toUpperCase();
  if (u === "KILOGRAMS" || u === "KG") {
    return w * 1000;
  }
  if (u === "OUNCES" || u === "OZ") {
    return w * 28.3495;
  }
  if (u === "POUNDS" || u === "LB") {
    return w * 453.592;
  }
  return w;
}

function extractCaratFromSelectedOptions(
  options: { name: string; value: string }[]
): string | null {
  for (const option of options) {
    const value = option.value?.trim();
    if (value && isKaratLabel(value)) {
      return value;
    }
  }
  for (const option of options) {
    const name = option.name.toLowerCase();
    if (
      name.includes("carat") ||
      name.includes("karat") ||
      name.includes("gold purity") ||
      name.includes("purity")
    ) {
      const value = option.value?.trim();
      if (value) {
        return value;
      }
    }
  }
  return null;
}

function deriveListBadge({
  tags,
  compareAtPrice,
  price,
}: {
  tags: string[];
  compareAtPrice: number | null;
  price: number;
}): string | undefined {
  const normalized = tags.map((t) => t.toLowerCase());

  if (compareAtPrice != null && compareAtPrice > price) {
    return "SALE";
  }
  if (normalized.some((t) => t.includes("bestseller") || t.includes("best-seller"))) {
    return "BESTSELLER";
  }
  if (normalized.some((t) => t.includes("new") || t.includes("arrival"))) {
    return "NEW";
  }

  return undefined;
}

async function resolveShopifyMakingChargePercent(
  node: ShopifyProductNode
): Promise<number | undefined> {
  const fromStorefront = parseMakingChargeFromMetafields([
    { key: "making_charge_type", value: node.makingChargeType?.value ?? null },
    { key: "making_charge", value: node.makingChargeValue?.value ?? null },
  ]);
  if (fromStorefront) {
    return fromStorefront.percent;
  }

  const fromAdmin = await fetchMakingChargeFromShopifyAdmin(node.id);
  return fromAdmin?.percent;
}

function extractAvailableRingSizesFromNode(node: ShopifyProductNode): string[] {
  const sizes = new Set<string>();

  for (const option of node.options ?? []) {
    if (!isSizeLikeOptionName(option.name)) {
      continue;
    }
    for (const value of option.values ?? []) {
      const normalized = normalizeRingSizeFilterValue(value);
      if (normalized) {
        sizes.add(normalized);
      }
    }
  }

  for (const { node: variant } of node.variants.edges) {
    for (const selected of variant.selectedOptions ?? []) {
      if (!isSizeLikeOptionName(selected.name)) {
        continue;
      }
      const normalized = normalizeRingSizeFilterValue(selected.value);
      if (normalized) {
        sizes.add(normalized);
      }
    }
  }

  return [...sizes].sort((a, b) => Number(a) - Number(b));
}

async function resolveSearchTagsForNode(node: ShopifyProductNode): Promise<string[]> {
  const fromStorefront = parseSearchTagsMetafield(node.searchTagsMetafield?.value);
  if (fromStorefront.length > 0) {
    return fromStorefront;
  }

  const fromAdmin = await fetchSearchTagsFromShopifyAdmin(node.id);
  return fromAdmin ?? [];
}

/** Listing/card mapping: one gold fetch, min price across sample variants (no full variant list). */
async function mapShopifyProductListItem(
  node: ShopifyProductNode,
  index: number
): Promise<Product> {
  const fallback = fallbackProducts[index % fallbackProducts.length];
  const compareRaw = Number(node.compareAtPriceRange.minVariantPrice.amount);
  const shopifyListPrice = Number(node.priceRange.minVariantPrice.amount);
  const compareAtPrice =
    compareRaw > 0 && compareRaw > shopifyListPrice ? compareRaw : null;

  const primaryImage =
    node.featuredImage?.url ??
    node.images?.edges[0]?.node.url ??
    fallback.image;

  const variantCount =
    node.variantsCount?.count ?? node.variants.edges.length ?? 0;

  let price = 0;
  let listingWeightGrams: number | undefined;
  let variantId = node.variants.edges[0]?.node.id ?? "";
  const makingChargePercent = await resolveShopifyMakingChargePercent(node);
  const goldRate = await getGoldPrice();

  if (goldRate == null) {
    logMissingGoldPriceOnce();
  }

  for (const { node: variant } of node.variants.edges) {
    const shopifyVariantPrice = Number(variant.price?.amount ?? 0);

    if (goldRate == null) {
      if (
        shopifyVariantPrice > 0 &&
        (price === 0 || shopifyVariantPrice < price)
      ) {
        price = Math.round(shopifyVariantPrice);
        variantId = variant.id;
      }
      continue;
    }

    const gramsFromApi = shopifyWeightToGrams(
      variant.weight ?? null,
      variant.weightUnit ?? null
    );
    const weight = resolveVariantWeight(gramsFromApi);
    const carat = extractCaratFromSelectedOptions(variant.selectedOptions);

    if (weight > 0) {
      listingWeightGrams =
        listingWeightGrams == null
          ? weight
          : Math.min(listingWeightGrams, weight);
    }

    const pricing = await calculateVariantPrice({
      weight,
      carat,
      makingChargePercent,
    });
    if (price === 0 || pricing.finalPrice < price) {
      price = pricing.finalPrice;
      variantId = variant.id;
    }
  }

  if (price === 0) {
    price =
      shopifyListPrice > 0 ? Math.round(shopifyListPrice) : fallback.price;
  }

  const tags = node.tags ?? [];
  const searchTags = await resolveSearchTagsForNode(node);
  const badge = deriveListBadge({ tags, compareAtPrice, price });
  const availableRingSizes = extractAvailableRingSizesFromNode(node);

  return {
    id: node.id,
    slug: node.handle,
    handle: node.handle,
    name: node.title,
    description: node.description || fallback.description,
    shortDescription: node.description?.slice(0, 120) || fallback.shortDescription,
    productType: node.productType?.trim() || fallback.productType,
    tags,
    searchTags: searchTags.length ? searchTags : undefined,
    badge,
    price,
    compareAtPrice,
    makingChargePercent,
    image: primaryImage,
    images: [primaryImage],
    variantId,
    variantCount,
    variants: undefined,
    customizable: false,
    availableRingSizes: availableRingSizes.length ? availableRingSizes : undefined,
    listingWeightGrams,
  };
}

async function mapShopifyProduct(
  node: ShopifyProductNode,
  index: number
): Promise<Product> {
  const karatByValues = node.options.find((option) => isKaratOption(option));
  const caratOption =
    node.options.find((option) => option.name.toLowerCase().includes("carat")) ??
    karatByValues;
  const metalOption = node.options.find((option) => {
    if (option === caratOption || isKaratOption(option)) {
      return false;
    }
    const name = option.name.toLowerCase();
    return (
      name.includes("metal") ||
      name.includes("material") ||
      (name.includes("gold") && !name.includes("carat")) ||
      name.includes("color") ||
      name.includes("colour") ||
      name.includes("finish")
    );
  });
  const diamondOption = node.options.find((option) => {
    if (option === caratOption || option === metalOption || isKaratOption(option)) {
      return false;
    }
    const name = option.name.toLowerCase();
    if (
      name.includes("size") ||
      name.includes("length") ||
      name.includes("chain") ||
      name.includes("metal") ||
      name.includes("material")
    ) {
      return false;
    }
    return (
      name.includes("diamond") ||
      name.includes("clarity") ||
      name.includes("quality") ||
      name.includes("stone")
    );
  });
  const sizeOption = node.options.find(
    (option) =>
      option !== caratOption &&
      option !== metalOption &&
      option !== diamondOption &&
      isSizeLikeOptionName(option.name)
  );
  const fallback = fallbackProducts[index % fallbackProducts.length];
  const compareRaw = Number(node.compareAtPriceRange.minVariantPrice.amount);
  const shopifyListPrice = Number(node.priceRange.minVariantPrice.amount);
  const compareAtPrice =
    compareRaw > 0 && compareRaw > shopifyListPrice ? compareRaw : null;

  const imageSet = new Set<string>();
  if (node.featuredImage?.url) {
    imageSet.add(node.featuredImage.url);
  }
  for (const edge of node.images?.edges ?? []) {
    if (edge.node.url) {
      imageSet.add(edge.node.url);
    }
  }
  for (const { node: variant } of node.variants.edges) {
    if (variant.image?.url) {
      imageSet.add(variant.image.url);
    }
  }
  const images = Array.from(imageSet);
  const primaryImage = node.featuredImage?.url ?? images[0] ?? fallback.image;

  const goldRate = await getGoldPrice();
  if (goldRate == null) {
    logMissingGoldPriceOnce();
  }

  const makingChargePercent = await resolveShopifyMakingChargePercent(node);

  const variants = await Promise.all(
    node.variants.edges.map(async ({ node: variant }) => {
      const gramsFromApi = shopifyWeightToGrams(
        variant.weight ?? null,
        variant.weightUnit ?? null
      );
      const weight = resolveVariantWeight(gramsFromApi);
      const carat = extractCaratFromSelectedOptions(variant.selectedOptions);
      const shopifyVariantPrice = Math.round(Number(variant.price?.amount ?? 0));

      if (goldRate == null) {
        return {
          id: variant.id,
          image: variant.image?.url,
          price: shopifyVariantPrice,
          weight,
          selectedOptions: variant.selectedOptions,
        };
      }

      const pricing = await calculateVariantPrice({
        weight,
        carat,
        makingChargePercent,
      });

      return {
        id: variant.id,
        image: variant.image?.url,
        price: pricing.finalPrice,
        weight,
        actualGoldPrice: pricing.actualGoldPrice,
        makingCharge: pricing.makingCharge,
        gst: pricing.gst,
        perGramRate: pricing.perGramRate,
        purity: pricing.purity,
        selectedOptions: variant.selectedOptions,
      };
    })
  );

  const defaultVariant = variants[0];
  const price = defaultVariant?.price ?? 0;
  const metalOptions = metalOption?.values.length
    ? metalOption.values.map((value) => ({ label: value }))
    : undefined;
  const caratOptions = caratOption?.values.length
    ? caratOption.values.map((value) => ({ label: value }))
    : undefined;
  const diamondQualities = diamondOption?.values.length
    ? diamondOption.values.map((value) => ({ label: value }))
    : undefined;
  const sizeOptions = sizeOption?.values.length
    ? sizeOption.values.map((value) => ({ size: value }))
    : undefined;

  const searchTags = await resolveSearchTagsForNode(node);

  const mapped: Product = {
    id: node.id,
    slug: node.handle,
    handle: node.handle,
    name: node.title,
    description: node.description || fallback.description,
    productType: node.productType?.trim() || fallback.productType,
    tags: node.tags ?? [],
    searchTags: searchTags.length ? searchTags : undefined,
    price,
    compareAtPrice,
    makingChargePercent,
    image: primaryImage,
    images: images.length > 0 ? images : [primaryImage],
    variantId: defaultVariant?.id ?? node.variants.edges[0]?.node.id,
    variants,
    customizable: false,
    metalOptionName: metalOption?.name,
    caratOptionName: caratOption?.name,
    diamondOptionName: diamondOption?.name,
    sizeOptionName: sizeOption?.name,
    metalOptions,
    caratOptions,
    diamondQualities,
    sizeOptions,
  };

  return {
    ...mapped,
    customizable: productHasCustomizationOptions(mapped),
  };
}

/**
 * Attaches matching Storefront `ProductVariant` GIDs and Shopify prices onto a
 * catalog product (e.g. Supabase) when the same product exists in Shopify.
 */
export function mergeShopifyVariantGids(
  catalog: Product,
  storefront: Product
): Product {
  const sVars = storefront.variants ?? [];
  if (!catalog.variants?.length || !sVars.length) {
    return catalog;
  }

  const singleOneToOne =
    sVars.length === 1 && catalog.variants.length === 1 ? sVars[0] : null;

  const n = catalog.variants.length;
  const usedSv = new Set<string>();
  const assignment = new Map<number, ProductVariant>();

  for (let i = 0; i < n; i++) {
    const lv = catalog.variants[i];
    if (lv.id.startsWith("gid://shopify/ProductVariant/")) {
      usedSv.add(lv.id);
    }
  }

  if (
    singleOneToOne &&
    n === 1 &&
    !catalog.variants[0].id.startsWith("gid://shopify/ProductVariant/")
  ) {
    assignment.set(0, singleOneToOne);
    usedSv.add(singleOneToOne.id);
  }

  type Edge = { i: number; sv: ProductVariant; score: number; full: boolean };
  const edges: Edge[] = [];
  for (let i = 0; i < n; i++) {
    const lv = catalog.variants[i];
    if (lv.id.startsWith("gid://shopify/ProductVariant/")) {
      continue;
    }
    if (assignment.has(i)) {
      continue;
    }
    const wanted = variantOptionValueSet(lv);
    if (wanted.size === 0) {
      continue;
    }
    for (const sv of sVars) {
      if (usedSv.has(sv.id)) {
        continue;
      }
      const have = variantOptionValueSet(sv);
      const full = catalogValuesFitStorefront(wanted, have);
      const score = intersectionScoreFuzzy(wanted, have);
      edges.push({
        i,
        sv,
        score,
        full: full && score >= wanted.size,
      });
    }
  }

  edges.sort((a, b) => {
    if (a.full !== b.full) {
      return a.full ? -1 : 1;
    }
    return b.score - a.score;
  });

  const assignedI = new Set<number>(assignment.keys());
  for (const e of edges) {
    if (assignedI.has(e.i) || usedSv.has(e.sv.id)) {
      continue;
    }
    if (e.score === 0) {
      continue;
    }
    assignment.set(e.i, e.sv);
    usedSv.add(e.sv.id);
    assignedI.add(e.i);
  }

  for (let i = 0; i < n; i++) {
    if (assignment.has(i)) {
      continue;
    }
    const lv = catalog.variants[i];
    if (lv.id.startsWith("gid://shopify/ProductVariant/")) {
      continue;
    }
    const wanted = variantOptionValueSet(lv);
    if (wanted.size === 0) {
      continue;
    }
    let best: ProductVariant | null = null;
    let bestScore = 0;
    for (const sv of sVars) {
      const have = variantOptionValueSet(sv);
      const score = intersectionScoreFuzzy(wanted, have);
      if (score > bestScore) {
        bestScore = score;
        best = sv;
      }
    }
    if (best && bestScore > 0) {
      assignment.set(i, best);
    }
  }

  const mergedVariants = catalog.variants.map((lv, i) => {
    if (lv.id.startsWith("gid://shopify/ProductVariant/")) {
      return {
        ...lv,
        catalogVariantId: lv.catalogVariantId,
      };
    }
    const pick = assignment.get(i);
    if (!pick?.id.startsWith("gid://shopify/ProductVariant/")) {
      return lv;
    }

    return {
      ...lv,
      id: pick.id,
      catalogVariantId: lv.catalogVariantId,
      /** Keep catalog-calculated price (`calculateVariantPrice`); checkout uses draft override to match. */
      price: lv.price,
      compareAtPrice: lv.compareAtPrice ?? null,
      image: pick.image ?? lv.image,
      selectedOptions: lv.selectedOptions,
      availableForSale: pick.availableForSale ?? lv.availableForSale,
      quantityAvailable: pick.quantityAvailable ?? lv.quantityAvailable,
    };
  });

  const firstGid = mergedVariants.find((v) =>
    v.id.startsWith("gid://shopify/ProductVariant/")
  );
  const primary = firstGid ?? mergedVariants[0];

  return {
    ...catalog,
    makingChargePercent:
      storefront.makingChargePercent ?? catalog.makingChargePercent,
    productType: catalog.productType ?? storefront.productType,
    tags: catalog.tags?.length ? catalog.tags : storefront.tags,
    searchTags: catalog.searchTags?.length
      ? catalog.searchTags
      : storefront.searchTags,
    sizeOptionName: catalog.sizeOptionName ?? storefront.sizeOptionName,
    metalOptionName: catalog.metalOptionName ?? storefront.metalOptionName,
    caratOptionName: catalog.caratOptionName ?? storefront.caratOptionName,
    diamondOptionName: catalog.diamondOptionName ?? storefront.diamondOptionName,
    metalOptions: catalog.metalOptions?.length
      ? catalog.metalOptions
      : storefront.metalOptions,
    caratOptions: catalog.caratOptions?.length
      ? catalog.caratOptions
      : storefront.caratOptions,
    diamondQualities: catalog.diamondQualities?.length
      ? catalog.diamondQualities
      : storefront.diamondQualities,
    sizeOptions: catalog.sizeOptions?.length
      ? catalog.sizeOptions
      : storefront.sizeOptions,
    customizable:
      catalog.customizable ||
      storefront.customizable ||
      productHasCustomizationOptions({
        ...catalog,
        metalOptions: catalog.metalOptions?.length
          ? catalog.metalOptions
          : storefront.metalOptions,
        caratOptions: catalog.caratOptions?.length
          ? catalog.caratOptions
          : storefront.caratOptions,
        diamondQualities: catalog.diamondQualities?.length
          ? catalog.diamondQualities
          : storefront.diamondQualities,
        sizeOptions: catalog.sizeOptions?.length
          ? catalog.sizeOptions
          : storefront.sizeOptions,
      }),
    variants: mergedVariants,
    variantId: primary?.id ?? catalog.variantId,
    price: primary?.price ?? catalog.price,
    compareAtPrice: primary?.compareAtPrice ?? catalog.compareAtPrice,
  };
}

type CartCreateResponse = {
  cartCreate: {
    cart: {
      checkoutUrl: string;
    } | null;
    userErrors: {
      field: string[] | null;
      message: string;
    }[];
  };
};

const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export type CheckoutAttribute = {
  key: string;
  value: string;
};

export type CreateCheckoutOptions = {
  variantId: string;
  /** When set, Shopify checkout opens with the customer already signed in. */
  customerAccessToken?: string;
  attributes?: CheckoutAttribute[];
  quantity?: number;
};

function cleanAttributes(attributes: CheckoutAttribute[]) {
  return attributes.filter(
    (attribute) => attribute.key.trim() && attribute.value.trim()
  );
}

function getAttributeValue(attributes: CheckoutAttribute[], key: string) {
  return attributes.find((attribute) => attribute.key === key)?.value.trim();
}

function slugifyTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildOrderTags(attributes: CheckoutAttribute[]) {
  const tagKeys = ["Metal", "Carat", "Diamond Quality"];

  const tags = tagKeys
    .map((key) => {
      const value = getAttributeValue(attributes, key);

      return value ? `${slugifyTag(key)}-${slugifyTag(value)}` : "";
    })
    .filter(Boolean);

  const sizeValue = readSizeFromAttributes(attributes);
  if (sizeValue) {
    tags.push(`size-${slugifyTag(sizeValue)}`);
  }

  return tags;
}

function buildOrderNote(attributes: CheckoutAttribute[]) {
  const metal = getAttributeValue(attributes, "Metal");
  const carat = getAttributeValue(attributes, "Carat");
  const diamondQuality = getAttributeValue(attributes, "Diamond Quality");
  const sizeValue = readSizeFromAttributes(attributes);
  const estimatedPrice = getAttributeValue(attributes, "Estimated Custom Price");

  return [
    "Custom jewellery order created from Zephico website.",
    metal ? `Metal: ${metal}` : "",
    carat ? `Carat: ${carat}` : "",
    diamondQuality ? `Diamond Quality: ${diamondQuality}` : "",
    sizeValue ? `Size: ${sizeValue}` : "",
    estimatedPrice ? `Estimated Custom Price: ${estimatedPrice}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export async function createCheckout({
  variantId,
  customerAccessToken,
  attributes = [],
  quantity = 1,
}: CreateCheckoutOptions): Promise<string> {
  const id = variantId?.trim() ?? "";
  if (!id.startsWith("gid://shopify/ProductVariant/")) {
    throw new Error(
      "Invalid storefront variant id. Expected a Shopify ProductVariant GID."
    );
  }

  const cleanedAttributes = cleanAttributes(attributes);
  const lineAttributes = cleanedAttributes.map((attribute) => ({
    key: attribute.key,
    value: attribute.value,
  }));

  const input: Record<string, unknown> = {
    lines: [
      {
        merchandiseId: id,
        quantity: Math.max(1, quantity),
        ...(lineAttributes.length > 0 ? { attributes: lineAttributes } : {}),
      },
    ],
  };

  if (customerAccessToken?.trim()) {
    input.buyerIdentity = {
      customerAccessToken: customerAccessToken.trim(),
    };
  }

  const data = await shopifyFetch<CartCreateResponse>(CART_CREATE_MUTATION, {
    input,
  });
  const error = data.cartCreate.userErrors[0];

  if (error) {
    throw new Error(error.message);
  }

  if (!data.cartCreate.cart?.checkoutUrl) {
    throw new Error("Shopify did not return a checkout URL.");
  }

  return data.cartCreate.cart.checkoutUrl;
}

/** Storefront Cart API: variant GID checkout; optional logged-in customer from cookies. */
export async function createStorefrontCartCheckout(
  options: CreateCheckoutOptions
): Promise<string> {
  return createCheckout(options);
}

type DraftOrderCreateResponse = {
  draftOrderCreate: {
    draftOrder: {
      id: string;
      invoiceUrl: string;
    } | null;
    userErrors: {
      field: string[] | null;
      message: string;
    }[];
  };
};

type DraftOrderStatusResponse = {
  draftOrder: {
    id: string;
    status: string;
    order: { id: string } | null;
  } | null;
};

const DRAFT_ORDER_CREATE_MUTATION = `
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const DRAFT_ORDER_STATUS_QUERY = `
  query DraftOrderStatus($id: ID!) {
    draftOrder(id: $id) {
      id
      status
      order {
        id
      }
    }
  }
`;

export type DraftCheckoutResult = {
  invoiceUrl: string;
  draftOrderId: string;
};

function getStorefrontSiteOrigin(): string {
  return getSiteOrigin();
}

type CreateDraftCheckoutInput = {
  productName: string;
  variantId: string;
  price: number;
  attributes: CheckoutAttribute[];
  /** Pre-associates the draft invoice with the logged-in customer email. */
  customerEmail?: string;
};

export type DraftCheckoutLineItem = {
  productName: string;
  variantId: string;
  price: number;
  quantity: number;
  attributes: CheckoutAttribute[];
};

export async function createDraftCheckout({
  productName,
  variantId,
  price,
  attributes,
  customerEmail,
}: CreateDraftCheckoutInput): Promise<string> {
  const result = await createDraftCheckoutFromLines({
    customerEmail,
    lines: [
      {
        productName,
        variantId,
        price,
        quantity: 1,
        attributes,
      },
    ],
  });
  return result.invoiceUrl;
}

/** Draft invoice for cart lines at gold-calculated INR prices (requires Admin API). */
export async function createDraftCheckoutFromLines({
  lines,
  customerEmail,
}: {
  lines: DraftCheckoutLineItem[];
  customerEmail?: string;
}): Promise<DraftCheckoutResult> {
  if (!lines.length) {
    throw new Error("Cart is empty.");
  }
  if (!adminToken) {
    throw new Error(
      "Custom price checkout requires SHOPIFY_ADMIN_ACCESS_TOKEN."
    );
  }

  const tagSet = new Set<string>([
    "custom-jewellery",
    "zephico",
    "cart-checkout",
  ]);
  const returnUrl = `${getStorefrontSiteOrigin()}/checkout/return`;
  const noteParts = [
    "Custom jewellery order from Pradeep Jewellers website.",
    `Return to shop after payment: ${returnUrl}`,
  ];

  const lineItems = lines.map((line) => {
    const cleanedAttributes = cleanAttributes(line.attributes);
    for (const tag of buildOrderTags(cleanedAttributes)) {
      tagSet.add(tag);
    }
    const lineNote = buildOrderNote(cleanedAttributes);
    if (lineNote) noteParts.push(lineNote);

    return {
      variantId: line.variantId,
      title: line.productName,
      quantity: Math.max(1, line.quantity),
      priceOverride: {
        amount: String(Math.max(0, Math.round(line.price))),
        currencyCode: "INR",
      },
      customAttributes: cleanedAttributes,
    };
  });

  const email = customerEmail?.trim();
  const data = await shopifyAdminFetch<DraftOrderCreateResponse>(
    DRAFT_ORDER_CREATE_MUTATION,
    {
      input: {
        visibleToCustomer: true,
        ...(email ? { email } : {}),
        note: noteParts.join("\n"),
        tags: Array.from(tagSet),
        lineItems,
      },
    }
  );

  const error = data.draftOrderCreate.userErrors[0];
  if (error) throw new Error(error.message);
  const draftOrder = data.draftOrderCreate.draftOrder;
  if (!draftOrder?.invoiceUrl || !draftOrder.id) {
    throw new Error("Shopify did not return a draft order payment URL.");
  }
  return {
    invoiceUrl: draftOrder.invoiceUrl,
    draftOrderId: draftOrder.id,
  };
}

/** True when the draft invoice was paid and converted to an order. */
export async function isDraftOrderPaid(draftOrderId: string): Promise<boolean> {
  if (!adminToken) return false;

  const id = draftOrderId.trim();
  if (!id.startsWith("gid://shopify/DraftOrder/")) {
    return false;
  }

  const data = await shopifyAdminFetch<DraftOrderStatusResponse>(
    DRAFT_ORDER_STATUS_QUERY,
    { id }
  );

  const draft = data.draftOrder;
  if (!draft) return false;

  if (draft.order?.id) return true;
  return draft.status === "COMPLETED";
}

function buildShopifyProductsSearchQuery(q: string, category: string): string | undefined {
  const parts: string[] = [];

  if (q) {
    const words = significantSearchWords(q);
    if (words.length > 0) {
      const titleAll = words.map((word) => `title:*${word}*`).join(" AND ");
      parts.push(`(${titleAll})`);
    } else {
      parts.push(`title:*${q}*`);
    }
  }

  if (category && category !== "all") {
    switch (category) {
      case "gold":
        parts.push("title:*gold* OR tag:gold OR product_type:*gold*");
        break;
      case "diamond":
        parts.push("title:*diamond* OR tag:diamond OR description:*diamond*");
        break;
      case "silver":
        parts.push("title:*silver* OR tag:silver OR product_type:*silver*");
        break;
      case "gemstone":
        parts.push(
          "title:*gem* OR title:*ruby* OR title:*emerald* OR title:*sapphire* OR title:*pearl* OR tag:gemstone"
        );
        break;
      case "rings":
        parts.push("title:*ring*");
        break;
      case "necklaces":
        parts.push("title:*necklace* OR title:*chain*");
        break;
      case "earrings":
        parts.push("title:*earring*");
        break;
      case "bracelets":
      case "bracelet":
        parts.push(
          "title:*bracelet* OR product_type:*bracelet* OR tag:bracelet"
        );
        break;
      case "ring":
        parts.push("title:*ring* OR product_type:*ring* OR tag:ring");
        break;
      case "earring":
        parts.push(
          "title:*earring* OR title:*stud* OR product_type:*earring* OR tag:earring"
        );
        break;
      case "bangle":
        parts.push("title:*bangle* OR product_type:*bangle* OR tag:bangle");
        break;
      case "necklace":
        parts.push(
          "title:*necklace* OR product_type:*necklace* OR tag:necklace"
        );
        break;
      case "necklace-set":
        parts.push("title:*necklace*set* OR title:*necklace set*");
        break;
      case "pendant":
        parts.push("title:*pendant* OR product_type:*pendant* OR tag:pendant");
        break;
      case "pendant-set":
        parts.push("title:*pendant*set* OR title:*pendant set*");
        break;
      case "chain":
        parts.push("title:*chain* OR product_type:*chain* OR tag:chain");
        break;
      case "anklet":
        parts.push("title:*anklet* OR product_type:*anklet* OR tag:anklet");
        break;
      case "kada":
        parts.push("title:*kada* OR tag:kada");
        break;
      case "charm":
        parts.push("title:*charm* OR product_type:*charm* OR tag:charm");
        break;
      case "mangalsutra":
        parts.push("title:*mangalsutra* OR tag:mangalsutra");
        break;
      case "nose-pin":
        parts.push(
          "title:*nose* OR title:*nath* OR product_type:*nose* OR tag:nose-pin"
        );
        break;
      default:
        break;
    }
  }

  return parts.length > 0 ? parts.join(" AND ") : undefined;
}

type NodesCacheEntry = {
  key: string;
  nodes: ShopifyProductNode[];
  at: number;
};

let shopifyNodesCache: NodesCacheEntry | null = null;
const NODES_CACHE_MS = 30_000;

export function clearShopifyNodesCache(): void {
  shopifyNodesCache = null;
}

/** Raw Shopify product nodes (list query — lighter GraphQL). */
export async function fetchShopifyProductNodes(options?: {
  q?: string;
  category?: string;
  maxProducts?: number;
}): Promise<ShopifyProductNode[]> {
  const shopifyQuery = buildShopifyProductsSearchQuery(
    options?.q?.trim() ?? "",
    options?.category ?? "all"
  );
  const cacheKey = `${shopifyQuery ?? ""}|${options?.category ?? "all"}`;
  const now = Date.now();
  if (
    shopifyNodesCache &&
    shopifyNodesCache.key === cacheKey &&
    now - shopifyNodesCache.at < NODES_CACHE_MS
  ) {
    return shopifyNodesCache.nodes;
  }

  const maxProducts = options?.maxProducts ?? 250;
  const nodes: ShopifyProductNode[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext && nodes.length < maxProducts) {
    const first = Math.min(50, maxProducts - nodes.length);
    const data: ShopifyProductsListResponse = await shopifyFetch<ShopifyProductsListResponse>(
      PRODUCTS_LIST_QUERY,
      {
        first,
        after,
        query: shopifyQuery ?? null,
      }
    );

    for (const edge of data.products.edges) {
      nodes.push(edge.node);
    }

    hasNext = data.products.pageInfo.hasNextPage;
    after = data.products.pageInfo.endCursor;
    if (!data.products.edges.length) {
      break;
    }
  }

  shopifyNodesCache = { key: cacheKey, nodes, at: now };
  return nodes;
}

/** Fetch all products matching filters from Storefront API (cursor pagination). */
export async function fetchAllShopifyProducts(options?: {
  q?: string;
  category?: string;
  maxProducts?: number;
}): Promise<Product[]> {
  const nodes = await fetchShopifyProductNodes(options);
  return Promise.all(nodes.map((node, index) => mapShopifyProductListItem(node, index)));
}

export type ProductsPageResult = {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  priceBounds: PriceBounds;
  searchTagOptions: CollectionFilterOption[];
  searchTagSuggestions: CollectionFilterOption[];
};

/** Paginated product list for `/api/products` — data from Shopify Storefront only. */
export async function getProductsPage(options: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  ringSizes?: string[];
  facets?: CollectionFacetFilters;
}): Promise<ProductsPageResult> {
  const page = Math.max(1, options.page);
  const limit = Math.max(1, options.limit);
  const listFilters: ProductListFilters = {
    minPrice: options.minPrice,
    maxPrice: options.maxPrice,
    sort: options.sort,
    ringSizes:
      categoryShowsRingSizeFilter(options.category ?? "all") &&
      options.ringSizes?.length
        ? options.ringSizes
        : undefined,
    ringSizeMatchStrict: options.category === "all",
    facets: options.facets,
  };

  const clientQ = options.q?.trim() ?? "";

  const paginate = (
    allProducts: Product[],
    extras?: {
      searchTagOptions?: CollectionFilterOption[];
      searchTagSuggestions?: CollectionFilterOption[];
    }
  ): ProductsPageResult => {
    const priceBounds = computePriceBounds(allProducts);
    const filtered = applyProductListFilters(allProducts, listFilters);
    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const from = (page - 1) * limit;
    return {
      products: filtered.slice(from, from + limit),
      total,
      page,
      limit,
      totalPages,
      priceBounds,
      searchTagOptions: extras?.searchTagOptions ?? [],
      searchTagSuggestions: extras?.searchTagSuggestions ?? [],
    };
  };

  const { domain, token } = getStorefrontCredentials();
  if (!domain || !token) {
    console.warn(
      "Shopify Storefront credentials missing — using static catalog fallback."
    );
    return paginate(fallbackProducts);
  }

  try {
    let nodes: ShopifyProductNode[];

    if (clientQ) {
      const [titleSearchNodes, catalogNodes] = await Promise.all([
        fetchShopifyProductNodes({
          q: clientQ,
          category: options.category,
          maxProducts: 80,
        }),
        fetchShopifyProductNodes({
          category: options.category,
          maxProducts: 200,
        }),
      ]);

      const byId = new Map<string, ShopifyProductNode>();
      for (const node of titleSearchNodes) {
        byId.set(node.id, node);
      }
      for (const node of catalogNodes) {
        byId.set(node.id, node);
      }
      nodes = [...byId.values()];
    } else {
      nodes = await fetchShopifyProductNodes({
        q: options.q,
        category: options.category,
      });
    }

    let allProducts = await Promise.all(
      nodes.map((node, index) => mapShopifyProductListItem(node, index))
    );

    const searchTagOptions = buildSearchTagFilterOptions(allProducts);

    if (clientQ) {
      allProducts = rankProductsBySearchQuery(allProducts, clientQ);
    }

    const searchTagSuggestions = clientQ
      ? buildSearchTagSuggestions(allProducts, clientQ, 8)
      : [];

    return paginate(allProducts, { searchTagOptions, searchTagSuggestions });
  } catch (error) {
    console.error("Shopify Storefront products fetch failed:", error);
    throw error;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const shopifyProducts = await fetchAllShopifyProducts({ maxProducts: 48 });
    return shopifyProducts.length > 0 ? shopifyProducts : fallbackProducts;
  } catch (error) {
    console.warn("Using fallback products because Shopify fetch failed:", error);
    return fallbackProducts;
  }
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const { domain, token } = getStorefrontCredentials();
  if (!domain || !token) {
    return null;
  }

  try {
    const data = await shopifyFetch<ShopifyProductByHandleResponse>(
      PRODUCT_BY_HANDLE_QUERY,
      { handle }
    );

    if (!data.product) {
      return null;
    }

    return await mapShopifyProduct(data.product, 0);
  } catch (error) {
    console.error("getProductByHandle failed:", handle, error);
    throw error;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const { domain, token } = getStorefrontCredentials();
  if (!domain || !token) {
    return null;
  }

  const gid = id.startsWith("gid://shopify/Product/")
    ? id
    : `gid://shopify/Product/${id}`;

  try {
    const data = await shopifyFetch<ShopifyProductByHandleResponse>(PRODUCT_BY_ID_QUERY, {
      id: gid,
    });

    if (!data.product) {
      return null;
    }

    return await mapShopifyProduct(data.product, 0);
  } catch (error) {
    console.error("getProductById failed:", id, error);
    throw error;
  }
}

/** When a catalog row has `handle`, overlay Storefront variant GIDs + prices for Buy now / cart. */
export async function mergeCatalogProductWithStorefront(
  catalog: Product
): Promise<Product> {
  const handle =
    catalog.handle?.trim() || catalog.slug?.trim() || "";
  if (!handle) {
    return catalog;
  }
  const storefront = await getProductByHandle(handle);
  if (!storefront?.variants?.length) {
    return catalog;
  }
  return mergeShopifyVariantGids(catalog, storefront);
}


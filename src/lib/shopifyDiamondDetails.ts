import { getShopifyStorefrontApiVersion } from "@/lib/shopifyApiVersion";
import type { ProductDiamondDetail } from "@/types/product";
import { parseDiamondDetailsMetafield } from "@/utils/diamondDetails";

function normalizeStoreDomain(raw?: string): string {
  if (!raw?.trim()) return "";
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

function getAdminCredentials() {
  const domain = normalizeStoreDomain(
    process.env.NEXT_SHOPIFY_STORE ?? process.env.SHOPIFY_STORE_DOMAIN
  );
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  const apiVersion = getShopifyStorefrontApiVersion();
  return { domain, token, apiVersion };
}

const adminDiamondCache = new Map<string, ProductDiamondDetail[]>();
const adminCacheAt = new Map<string, number>();
const ADMIN_CACHE_TTL_MS = 60_000;

const DIAMOND_DETAIL_KEYS = new Set([
  "diamond_details",
  "diamond-details",
  "diamonddetails",
]);

type AdminMetafieldsResponse = {
  product: {
    metafields: {
      edges: { node: { namespace: string; key: string; value: string } }[];
    };
  } | null;
};

const PRODUCT_METAFIELDS_QUERY = `
  query ProductDiamondDetailsMetafields($id: ID!) {
    product(id: $id) {
      metafields(first: 40) {
        edges {
          node {
            namespace
            key
            value
          }
        }
      }
    }
  }
`;

/** Admin API fallback when Storefront does not expose diamond_details. */
export async function fetchDiamondDetailsFromShopifyAdmin(
  productGid: string
): Promise<ProductDiamondDetail[] | null> {
  const { domain, token, apiVersion } = getAdminCredentials();
  if (!domain || !token || !productGid.startsWith("gid://shopify/Product/")) {
    return null;
  }

  const now = Date.now();
  const cachedAt = adminCacheAt.get(productGid);
  if (cachedAt != null && now - cachedAt < ADMIN_CACHE_TTL_MS) {
    return adminDiamondCache.get(productGid) ?? null;
  }

  try {
    const response = await fetch(
      `https://${domain}/admin/api/${apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
          query: PRODUCT_METAFIELDS_QUERY,
          variables: { id: productGid },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      }
    );

    const json = await response.json();
    if (!response.ok || json.errors) {
      adminDiamondCache.set(productGid, []);
      adminCacheAt.set(productGid, now);
      return [];
    }

    const edges =
      (json.data as AdminMetafieldsResponse)?.product?.metafields?.edges ?? [];

    for (const edge of edges) {
      const node = edge.node;
      const key = node.key.trim().toLowerCase();
      if (node.namespace !== "custom" || !DIAMOND_DETAIL_KEYS.has(key)) {
        continue;
      }
      const details = parseDiamondDetailsMetafield(node.value);
      adminDiamondCache.set(productGid, details);
      adminCacheAt.set(productGid, now);
      return details;
    }

    adminDiamondCache.set(productGid, []);
    adminCacheAt.set(productGid, now);
    return [];
  } catch {
    return null;
  }
}

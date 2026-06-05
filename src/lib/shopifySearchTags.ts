import { getShopifyStorefrontApiVersion } from "@/lib/shopifyApiVersion";
import { parseSearchTagsMetafield } from "@/utils/searchTags";

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

const adminSearchTagsCache = new Map<string, string[]>();
const adminCacheAt = new Map<string, number>();
const ADMIN_CACHE_TTL_MS = 60_000;

type AdminMetafieldsResponse = {
  product: {
    metafields: {
      edges: { node: { namespace: string; key: string; value: string } }[];
    };
  } | null;
};

const PRODUCT_METAFIELDS_QUERY = `
  query ProductSearchTagsMetafields($id: ID!) {
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

const SEARCH_TAG_KEYS = new Set(["search_tags"]);

/** Admin API fallback when Storefront does not expose search_tags. */
export async function fetchSearchTagsFromShopifyAdmin(
  productGid: string
): Promise<string[] | null> {
  const { domain, token, apiVersion } = getAdminCredentials();
  if (!domain || !token || !productGid.startsWith("gid://shopify/Product/")) {
    return null;
  }

  const now = Date.now();
  const cachedAt = adminCacheAt.get(productGid);
  if (cachedAt != null && now - cachedAt < ADMIN_CACHE_TTL_MS) {
    return adminSearchTagsCache.get(productGid) ?? null;
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
      adminSearchTagsCache.set(productGid, []);
      adminCacheAt.set(productGid, now);
      return [];
    }

    const edges =
      (json.data as AdminMetafieldsResponse)?.product?.metafields?.edges ?? [];

    for (const edge of edges) {
      const node = edge.node;
      if (node.namespace !== "custom" || !SEARCH_TAG_KEYS.has(node.key)) {
        continue;
      }
      const tags = parseSearchTagsMetafield(node.value);
      adminSearchTagsCache.set(productGid, tags);
      adminCacheAt.set(productGid, now);
      return tags;
    }

    adminSearchTagsCache.set(productGid, []);
    adminCacheAt.set(productGid, now);
    return [];
  } catch {
    return null;
  }
}

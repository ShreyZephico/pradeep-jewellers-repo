import { getShopifyStorefrontApiVersion } from "@/lib/shopifyApiVersion";
import {
  parseMakingChargeFromMetafields,
  type ResolvedMakingCharge,
} from "@/utils/makingCharge";

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

const adminMakingCache = new Map<string, ResolvedMakingCharge | null>();
const ADMIN_CACHE_TTL_MS = 60_000;
const adminCacheAt = new Map<string, number>();

type AdminMetafieldsResponse = {
  product: {
    metafields: {
      edges: { node: { namespace: string; key: string; value: string } }[];
    };
  } | null;
};

const PRODUCT_MAKING_METAFIELDS_QUERY = `
  query ProductMakingMetafields($id: ID!) {
    product(id: $id) {
      metafields(first: 30) {
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

/** Admin API fallback when Storefront metafields are not exposed. */
export async function fetchMakingChargeFromShopifyAdmin(
  productGid: string
): Promise<ResolvedMakingCharge | null> {
  const { domain, token, apiVersion } = getAdminCredentials();
  if (!domain || !token || !productGid.startsWith("gid://shopify/Product/")) {
    return null;
  }

  const now = Date.now();
  const cachedAt = adminCacheAt.get(productGid);
  if (cachedAt != null && now - cachedAt < ADMIN_CACHE_TTL_MS) {
    return adminMakingCache.get(productGid) ?? null;
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
          query: PRODUCT_MAKING_METAFIELDS_QUERY,
          variables: { id: productGid },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      }
    );

    const json = await response.json();
    if (!response.ok || json.errors) {
      adminMakingCache.set(productGid, null);
      adminCacheAt.set(productGid, now);
      return null;
    }

    const edges = (json.data as AdminMetafieldsResponse)?.product?.metafields?.edges ?? [];
    const resolved = parseMakingChargeFromMetafields(
      edges.map((edge) => edge.node)
    );

    adminMakingCache.set(productGid, resolved);
    adminCacheAt.set(productGid, now);
    return resolved;
  } catch {
    adminMakingCache.set(productGid, null);
    adminCacheAt.set(productGid, now);
    return null;
  }
}

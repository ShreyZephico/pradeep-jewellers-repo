import { getShopifyStorefrontApiVersion } from "@/lib/shopifyApiVersion";

function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export function normalizeShopifyStoreDomain(raw?: string): string {
  if (!raw?.trim()) return "";
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

/** Shopify store host — accepts all common .env naming variants. */
export function getShopifyStoreDomain(): string | null {
  const raw = readEnv(
    "SHOPIFY_STORE_DOMAIN",
    "NEXT_SHOPIFY_STORE",
    "NEXT_PUBLIC_SHOPIFY_STORE",
    "SHOPIFY_STORE"
  );
  const domain = normalizeShopifyStoreDomain(raw);
  return domain || null;
}

/**
 * Storefront API token (not Admin `shpat_*`).
 * Accepts NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN and legacy names.
 */
export function getShopifyStorefrontToken(): string | null {
  const candidates = [
    readEnv("NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN"),
    readEnv("NEXT_SHOPIFY_STOREFRONT_TOKEN"),
    readEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN"),
    readEnv("SHOPIFY_STOREFRONT_TOKEN"),
  ].filter(Boolean);

  const nonAdmin = candidates.find((token) => !token.startsWith("shpat_"));
  if (nonAdmin) return nonAdmin;

  const fallback = candidates[0];
  if (!fallback || fallback.startsWith("shpat_")) return null;
  return fallback;
}

export function getShopifyAdminToken(): string | null {
  const token = readEnv("SHOPIFY_ADMIN_ACCESS_TOKEN");
  return token || null;
}

export function getShopifyApiKey(): string | null {
  const key = readEnv("SHOPIFY_API_KEY", "SHOPIFY_CLIENT_ID");
  return key || null;
}

export function getShopifyApiSecret(): string | null {
  const secret = readEnv("SHOPIFY_API_SECRET", "SHOPIFY_CLIENT_SECRET");
  return secret || null;
}

export function getShopifyOAuthScopes(): string {
  return (
    readEnv("SHOPIFY_SCOPES") || "write_customers,read_customers"
  );
}

export function getStorefrontCredentials(): {
  domain: string;
  token: string;
  apiVersion: string;
} {
  return {
    domain: getShopifyStoreDomain() ?? "",
    token: getShopifyStorefrontToken() ?? "",
    apiVersion: getShopifyStorefrontApiVersion(),
  };
}

export const SHOPIFY_STOREFRONT_CREDENTIALS_HELP =
  "Set SHOPIFY_STORE_DOMAIN (or NEXT_PUBLIC_SHOPIFY_STORE) and a Storefront access token via SHOPIFY_STOREFRONT_ACCESS_TOKEN, NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN, or NEXT_SHOPIFY_STOREFRONT_TOKEN — not Admin shpat_*.";

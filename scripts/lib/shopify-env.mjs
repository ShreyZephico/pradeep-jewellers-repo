function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export function normalizeShopifyStoreDomain(raw) {
  if (!raw?.trim()) return "";
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

export function getShopifyStoreDomain() {
  const raw = readEnv(
    "SHOPIFY_STORE_DOMAIN",
    "NEXT_SHOPIFY_STORE",
    "NEXT_PUBLIC_SHOPIFY_STORE",
    "SHOPIFY_STORE"
  );
  return normalizeShopifyStoreDomain(raw) || null;
}

export function getShopifyStorefrontToken() {
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

export function getShopifyAdminToken() {
  return readEnv("SHOPIFY_ADMIN_ACCESS_TOKEN") || null;
}

export function getShopifyStorefrontApiVersion() {
  return readEnv("SHOPIFY_STOREFRONT_API_VERSION") || "2026-04";
}

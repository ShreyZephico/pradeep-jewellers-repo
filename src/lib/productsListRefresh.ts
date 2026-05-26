const STORAGE_KEY = "pj-products-list-refresh";

/** Call before sending the shopper to Shopify checkout (full page leave). */
export function markProductsListStale(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, "1");
}

/** Returns true once per stale mark; safe to call on products list mount / restore. */
export function consumeProductsListStale(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }
  const stale = sessionStorage.getItem(STORAGE_KEY) === "1";
  if (stale) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return stale;
}

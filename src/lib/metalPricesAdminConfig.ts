/**
 * Admin /metal-prices settings — change history window in one place.
 * Example: set to 8 to show the last 8 calendar days (IST) of saved prices.
 */
export const METAL_PRICES_HISTORY_DAYS = 7;

/** Must match POST /api/metal-prices insert rows and history columns. */
export const STORE_METAL_PRICE_SLOTS = [
  { key: "gold24", metal: "gold", purityLabel: "24K", unit: "gram" },
  { key: "gold22", metal: "gold", purityLabel: "22K", unit: "gram" },
  { key: "gold14", metal: "gold", purityLabel: "14K", unit: "gram" },
  { key: "gold9", metal: "gold", purityLabel: "9K", unit: "gram" },
  { key: "gold18", metal: "gold", purityLabel: "18K", unit: "gram" },
  { key: "silver1kg", metal: "silver", purityLabel: "99.99%", unit: "kg" },
] as const;

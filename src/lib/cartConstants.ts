/** Line attribute storing gold-calculated INR price for draft checkout. */
export const PJ_CUSTOM_PRICE_ATTR = "_pj_custom_price_inr";

/** Line attribute storing catalog image URL for cart UI (Shopify cart may omit images). */
export const PJ_IMAGE_URL_ATTR = "_pj_image_url";

/** Hidden line attributes for gold price breakdown on cart page. */
export const PJ_BREAKDOWN_ATTR = {
  weight: "_pj_weight_g",
  karat: "_pj_karat",
  perGramRate: "_pj_per_gram_rate",
  actualGold: "_pj_actual_gold",
  makingCharge: "_pj_making_charge",
  subtotal: "_pj_price_subtotal",
  gst: "_pj_gst",
  optionAdj: "_pj_option_adj",
} as const;

export const CART_ID_COOKIE = "pj_cart_id";

/** Draft order GID while customer is on Shopify invoice checkout. */
export const PENDING_DRAFT_ORDER_COOKIE = "pj_checkout_draft";

export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

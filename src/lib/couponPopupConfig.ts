/** Delay before the coupon popup can appear (ms). */
export const COUPON_POPUP_DELAY_MS = 25_000;

/** Scroll depth (0–1) that can trigger the popup. */
export const COUPON_POPUP_SCROLL_RATIO = 0.5;

/** Defer trigger setup until after first paint / idle (ms fallback). */
export const COUPON_POPUP_IDLE_FALLBACK_MS = 1_500;

export const COUPON_STORAGE = {
  dismissedSession: "pj_coupon_popup_dismissed",
  claimedLocal: "pj_coupon_popup_claimed",
} as const;

/** Routes where the marketing popup should not appear. */
export const COUPON_POPUP_EXCLUDED_PREFIXES = [
  "/login",
  "/signup",
  "/metal-prices",
  "/api/",
] as const;

export function isCouponPopupExcludedPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return COUPON_POPUP_EXCLUDED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

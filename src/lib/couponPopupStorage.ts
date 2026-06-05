import { COUPON_STORAGE } from "@/lib/couponPopupConfig";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function isCouponPopupBlocked(): boolean {
  if (!canUseSessionStorage()) return false;
  try {
    if (sessionStorage.getItem(COUPON_STORAGE.dismissedSession) === "1") {
      return true;
    }
    if (canUseLocalStorage() && localStorage.getItem(COUPON_STORAGE.claimedLocal) === "1") {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function markCouponPopupDismissed(): void {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.setItem(COUPON_STORAGE.dismissedSession, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function markCouponPopupClaimed(): void {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(COUPON_STORAGE.claimedLocal, "1");
  } catch {
    /* ignore */
  }
  markCouponPopupDismissed();
}

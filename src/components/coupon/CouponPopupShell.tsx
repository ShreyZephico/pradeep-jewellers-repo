"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import CouponPopup from "@/components/coupon/CouponPopup";
import {
  COUPON_POPUP_DELAY_MS,
  COUPON_POPUP_IDLE_FALLBACK_MS,
  COUPON_POPUP_SCROLL_RATIO,
  isCouponPopupExcludedPath,
} from "@/lib/couponPopupConfig";
import { isCouponPopupBlocked } from "@/lib/couponPopupStorage";

function scheduleIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: COUPON_POPUP_IDLE_FALLBACK_MS });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, COUPON_POPUP_IDLE_FALLBACK_MS);
  return () => window.clearTimeout(id);
}

/** Lightweight trigger shell — defers listeners until idle; popup mounts only when needed. */
export default function CouponPopupShell() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sourcePage, setSourcePage] = useState("/");

  const showPopup = useCallback(() => {
    if (isCouponPopupBlocked()) return;
    setSourcePage(`${window.location.pathname}${window.location.search}`);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open) return;
    if (isCouponPopupExcludedPath(pathname) || isCouponPopupBlocked()) {
      return;
    }

    let cancelled = false;
    let timerId: number | undefined;
    let scrollPending = false;

    const cleanup = () => {
      if (timerId != null) window.clearTimeout(timerId);
      window.removeEventListener("scroll", onScroll);
    };

    const tryOpen = () => {
      if (cancelled || open || isCouponPopupBlocked()) return;
      showPopup();
      cleanup();
    };

    const onScroll = () => {
      if (scrollPending) return;
      scrollPending = true;
      requestAnimationFrame(() => {
        scrollPending = false;
        if (cancelled) return;

        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - window.innerHeight;
        if (scrollable <= 0) return;

        const ratio = window.scrollY / scrollable;
        if (ratio >= COUPON_POPUP_SCROLL_RATIO) {
          tryOpen();
        }
      });
    };

    const startTriggers = () => {
      if (cancelled) return;
      timerId = window.setTimeout(tryOpen, COUPON_POPUP_DELAY_MS);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    };

    const cancelIdle = scheduleIdle(startTriggers);

    return () => {
      cancelled = true;
      cleanup();
      cancelIdle();
    };
  }, [pathname, open, showPopup]);

  if (!open) return null;

  return (
    <CouponPopup
      sourcePage={sourcePage}
      onClose={() => setOpen(false)}
    />
  );
}

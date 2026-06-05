"use client";

import dynamic from "next/dynamic";

const CouponPopupShell = dynamic(
  () => import("@/components/coupon/CouponPopupShell"),
  { ssr: false }
);

/** Lazy coupon popup — zero cost on initial HTML; loads after hydration. */
export default function CouponPopupLazy() {
  return <CouponPopupShell />;
}

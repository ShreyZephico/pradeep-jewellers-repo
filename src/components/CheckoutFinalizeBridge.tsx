"use client";

import { useEffect, useRef } from "react";

import { useCart } from "@/contexts/CartContext";

/** After Shopify checkout, clear cart only once Admin reports the draft order paid. */
export default function CheckoutFinalizeBridge() {
  const { refreshCart } = useCart();
  const runningRef = useRef(false);

  useEffect(() => {
    const run = () => {
      if (document.visibilityState !== "visible" || runningRef.current) {
        return;
      }
      runningRef.current = true;
      void fetch("/api/cart/finalize", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { status?: string };
          if (data.status === "cleared") {
            await refreshCart();
          }
        })
        .catch(() => undefined)
        .finally(() => {
          runningRef.current = false;
        });
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        run();
      }
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", run);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", run);
    };
  }, [refreshCart]);

  return null;
}

"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "@/contexts/CartContext";

export default function CheckoutReturnClient() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [message, setMessage] = useState("Checking your payment status…");

  useEffect(() => {
    let cancelled = false;

    const finalize = async () => {
      try {
        const response = await fetch("/api/cart/finalize", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json()) as { status?: string };

        if (cancelled) return;

        if (data.status === "cleared") {
          await refreshCart();
          router.replace("/cart?checkout=paid");
          return;
        }

        if (data.status === "pending") {
          setMessage(
            "Payment not confirmed yet. Your cart is still saved — complete payment on Shopify or return here after paying."
          );
          await refreshCart();
          return;
        }

        router.replace("/cart");
      } catch {
        if (!cancelled) {
          setMessage("Could not verify payment. Your cart should still be available.");
          await refreshCart();
        }
      }
    };

    void finalize();

    return () => {
      cancelled = true;
    };
  }, [refreshCart, router]);

  return (
    <main className="cart-page cart-page--loading" style={{ minHeight: "40vh" }}>
      <Loader2 className="cart-page-spinner" size={36} aria-hidden />
      <p>{message}</p>
    </main>
  );
}

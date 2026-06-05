"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AUTH_CHANGED_EVENT } from "@/contexts/CustomerAuthContext";
import { HOME_REFETCH_EVENT } from "@/lib/homeRefetch";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import type { ClientCart } from "@/types/cart";

const emptyCart: ClientCart = {
  id: null,
  totalQuantity: 0,
  subtotalInr: 0,
  lines: [],
};

type CartContextValue = {
  cart: ClientCart;
  loading: boolean;
  refreshCart: () => Promise<void>;
  goToCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [cart, setCart] = useState<ClientCart>(emptyCart);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cart", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await parseJsonResponse<{ cart?: ClientCart }>(response);
      if (!response.ok || !data) {
        setCart(emptyCart);
        return;
      }
      setCart(data.cart ?? emptyCart);
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, []);

  const goToCart = useCallback(() => {
    router.push("/cart");
  }, [router]);

  useEffect(() => {
    void refreshCart();

    const onHomeRefetch = () => {
      void refreshCart();
    };

    const onAuthChange = () => {
      void refreshCart();
    };

    window.addEventListener(HOME_REFETCH_EVENT, onHomeRefetch);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChange);
    return () => {
      window.removeEventListener(HOME_REFETCH_EVENT, onHomeRefetch);
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChange);
    };
  }, [refreshCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      refreshCart,
      goToCart,
    }),
    [cart, loading, refreshCart, goToCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

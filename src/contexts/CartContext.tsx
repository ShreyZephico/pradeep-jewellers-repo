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
  setAuthenticated: (value: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [cart, setCart] = useState<ClientCart>(emptyCart);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cart", {
        credentials: "include",
        cache: "no-store",
      });
      if (response.status === 401) {
        setCart(emptyCart);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        setCart(emptyCart);
        return;
      }
      setCart((data.cart as ClientCart) ?? emptyCart);
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
    fetch("/api/auth/check", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setIsAuthenticated(Boolean(data.isAuthenticated)))
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      refreshCart,
      goToCart,
      setAuthenticated: (authenticated: boolean) => {
        setIsAuthenticated(authenticated);
        if (!authenticated) setCart(emptyCart);
      },
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

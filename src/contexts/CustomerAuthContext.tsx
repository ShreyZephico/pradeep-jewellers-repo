"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { saveReturnPath } from "@/lib/authRedirect";
import { HOME_REFETCH_EVENT } from "@/lib/homeRefetch";

export const AUTH_CHANGED_EVENT = "customer-auth-changed";

export function notifyAuthChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

type CustomerAuthContextValue = {
  isLoggedIn: boolean;
  userName: string;
  email: string | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  goToLogin: () => void;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/check", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();

      if (!data.isAuthenticated) {
        setIsLoggedIn(false);
        setUserName("");
        setEmail(null);
        return;
      }

      const userEmail =
        data.email ||
        (typeof window !== "undefined"
          ? localStorage.getItem("customerEmail")
          : null);

      const name =
        (typeof data.name === "string" && data.name.trim()) ||
        (userEmail ? userEmail.split("@")[0] : "User");

      if (userEmail) {
        localStorage.setItem("customerEmail", userEmail);
      }

      setEmail(userEmail);
      setUserName(name);
      setIsLoggedIn(true);
    } catch {
      setIsLoggedIn(false);
      setUserName("");
      setEmail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    localStorage.removeItem("customerEmail");
    localStorage.removeItem("customerAccessToken");
    localStorage.removeItem("loginMethod");

    setIsLoggedIn(false);
    setUserName("");
    setEmail(null);
    notifyAuthChanged();
  }, []);

  const goToLogin = useCallback(() => {
    saveReturnPath();
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    refreshAuth();

    const onAuthChange = () => {
      void refreshAuth();
    };

    const onHomeRefetch = () => {
      void refreshAuth();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChange);
    window.addEventListener("focus", onAuthChange);
    window.addEventListener(HOME_REFETCH_EVENT, onHomeRefetch);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChange);
      window.removeEventListener("focus", onAuthChange);
      window.removeEventListener(HOME_REFETCH_EVENT, onHomeRefetch);
    };
  }, [refreshAuth]);

  const value = useMemo(
    () => ({
      isLoggedIn,
      userName,
      email,
      loading,
      refreshAuth,
      logout,
      goToLogin,
    }),
    [isLoggedIn, userName, email, loading, refreshAuth, logout, goToLogin]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return context;
}
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { HOME_REFETCH_EVENT } from "@/lib/homeRefetch";
import type { GoldRateApiResponse } from "@/types/goldRate";

type GoldRatesContextValue = {
  payload: GoldRateApiResponse | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const GoldRatesContext = createContext<GoldRatesContextValue | null>(null);

export function GoldRatesProvider({
  children,
  refreshMs = 5 * 60 * 1000,
}: {
  children: React.ReactNode;
  refreshMs?: number;
}) {
  const [payload, setPayload] = useState<GoldRateApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  const load = useCallback(async (forceFresh = false) => {
    if (forceFresh) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (forceFresh) {
        params.set("fresh", "1");
      }

      const res = await fetch(
        params.size > 0 ? `/api/gold-rate?${params.toString()}` : "/api/gold-rate"
      );
      const json = (await res.json()) as GoldRateApiResponse;

      if (!json.success || !json.data) {
        setError(json.error ?? "Unable to load rates");
        return;
      }

      setPayload(json);
      setError(null);
    } catch {
      setError("Unable to load rates");
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    load(false);

    if (refreshMs <= 0) return;

    const id = setInterval(() => {
      load(true);
    }, refreshMs);

    const onVisible = () => {
      if (document.visibilityState === "visible" && !isFirstLoad.current) {
        load(true);
      }
    };

    const onHomeRefetch = () => {
      load(true);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        load(true);
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(HOME_REFETCH_EVENT, onHomeRefetch);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(HOME_REFETCH_EVENT, onHomeRefetch);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [load, refreshMs]);

  const value = useMemo(
    () => ({
      payload,
      loading,
      error,
      reload: () => load(true),
    }),
    [payload, loading, error, load]
  );

  return (
    <GoldRatesContext.Provider value={value}>
      {children}
    </GoldRatesContext.Provider>
  );
}

export function useGoldRates(): GoldRatesContextValue {
  const ctx = useContext(GoldRatesContext);
  if (!ctx) {
    throw new Error("useGoldRates must be used within GoldRatesProvider");
  }
  return ctx;
}

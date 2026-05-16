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
    try {
      const params = new URLSearchParams();
      if (forceFresh) {
        params.set("fresh", "1");
      }
      params.set("_", String(Date.now()));

      const res = await fetch(`/api/gold-rate?${params.toString()}`, {
        cache: "no-store",
      });
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
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
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

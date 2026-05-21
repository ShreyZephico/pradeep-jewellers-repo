"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types/product";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import { resolveKaratFromSelection } from "@/utils/karat";

export type UseProductBasePriceResult = {
  estimatedPrice: number;
  listPrice: number;
  weightGrams: number;
  karatLabel: string | null;
  breakdown: VariantPriceBreakdown | null;
  loading: boolean;
};

/** Default-variant live price for the product detail summary (before customization). */
export function useProductBasePrice(product: Product): UseProductBasePriceResult {
  const defaultVariant = product.variants?.[0];
  const baseWeight =
    defaultVariant?.weight ??
    product.variants?.find((v) => v.weight && v.weight > 0)?.weight ??
    5;

  const initialMetal = product.metalOptions?.[0]?.label ?? "";
  const initialCarat =
    product.caratOptions?.[0]?.label ??
    product.metalOptions?.find((o) => o.label.match(/\d+\s*K/i))?.label ??
    "";
  const karatLabel = resolveKaratFromSelection(initialMetal, initialCarat);

  const variantPrice = defaultVariant?.price ?? product.price;
  const listPrice = product.compareAtPrice ?? 0;

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<VariantPriceBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLivePrice(variantPrice);

    const recalculate = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/price/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weight: baseWeight,
            carat: karatLabel ?? null,
          }),
        });
        const data = await response.json();
        if (!cancelled && data.success && typeof data.finalPrice === "number") {
          setLivePrice(data.finalPrice);
          setBreakdown({
            purity: data.purity,
            karat: data.karat,
            base24KGoldPrice: data.base24KGoldPrice,
            adjustedGoldPrice: data.adjustedGoldPrice,
            perGramRate: data.perGramRate,
            actualGoldPrice: data.actualGoldPrice,
            makingCharge: data.makingCharge,
            subtotal: data.subtotal,
            gst: data.gst,
            finalPrice: data.finalPrice,
          });
        } else if (!cancelled) {
          setLivePrice(variantPrice);
          setBreakdown(null);
        }
      } catch {
        if (!cancelled) {
          setLivePrice(variantPrice);
          setBreakdown(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void recalculate();
    return () => {
      cancelled = true;
    };
  }, [baseWeight, karatLabel, variantPrice, product.id]);

  return {
    estimatedPrice: livePrice ?? variantPrice,
    listPrice,
    weightGrams: baseWeight,
    karatLabel,
    breakdown,
    loading,
  };
}

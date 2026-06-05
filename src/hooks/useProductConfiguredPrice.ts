"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import { parseKaratNumber } from "@/utils/karat";

function parseKaratFromLabel(label: string | null): number {
  if (!label) return 22;
  return parseKaratNumber(label);
}
import { parsePriceCalculateResponse } from "@/lib/priceCalculateResponse";
import {
  resolveCustomizationOptions,
  type CustomizationSelections,
} from "@/utils/productCustomization";
import {
  buildPriceBreakdownOptionLines,
  sumOptionLineAmounts,
  type PriceBreakdownOptionLine,
} from "@/utils/priceBreakdownOptions";

export type UseProductConfiguredPriceResult = {
  estimatedPrice: number;
  totalPrice: number;
  listPrice: number;
  weightGrams: number;
  karatLabel: string | null;
  breakdown: VariantPriceBreakdown | null;
  loading: boolean;
  optionAdjustments: number;
  optionLines: PriceBreakdownOptionLine[];
  metalLabel: string;
  diamondLabel: string;
};

export function useProductConfiguredPrice(
  product: Product,
  selections: CustomizationSelections
): UseProductConfiguredPriceResult {
  const resolved = useMemo(
    () => resolveCustomizationOptions(product, selections),
    [product, selections]
  );

  const optionLines = useMemo(
    () =>
      buildPriceBreakdownOptionLines({
        metal: resolved.metalOption,
        carat: resolved.caratOption,
        quality: resolved.qualityOption,
        size: resolved.sizeOption,
        product,
      }),
    [resolved]
  );

  const optionAdjustments = sumOptionLineAmounts(optionLines);
  const variantPrice = resolved.variant?.price ?? product.price;
  const listPrice = product.compareAtPrice ?? 0;

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<VariantPriceBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const variant = resolved.variant;

    const useVariantBreakdown =
      variant &&
      variant.price > 0 &&
      resolved.baseWeight > 0 &&
      variant.actualGoldPrice != null &&
      variant.makingCharge != null &&
      variant.gst != null;

    if (useVariantBreakdown) {
      setLivePrice(variant.price);
      setBreakdown({
        purity: variant.purity ?? 0,
        karat: parseKaratFromLabel(resolved.karatLabel),
        base24KGoldPrice: 0,
        adjustedGoldPrice: 0,
        perGramRate: variant.perGramRate ?? 0,
        actualGoldPrice: variant.actualGoldPrice ?? 0,
        makingCharge: variant.makingCharge ?? 0,
        subtotal: (variant.actualGoldPrice ?? 0) + (variant.makingCharge ?? 0),
        gst: variant.gst ?? 0,
        finalPrice: variant.price,
      });
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLivePrice(variantPrice);

    const recalculate = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/price/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weight: resolved.baseWeight,
            carat: resolved.karatLabel ?? null,
            makingChargePercent: product.makingChargePercent ?? null,
          }),
        });
        const pricing = await parsePriceCalculateResponse(response);
        if (!cancelled && pricing) {
          setLivePrice(pricing.finalPrice);
          setBreakdown(pricing.breakdown);
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
  }, [
    resolved.baseWeight,
    resolved.karatLabel,
    variantPrice,
    product.id,
    product.makingChargePercent,
    selections.metal,
    selections.carat,
    selections.quality,
    selections.size,
  ]);

  const estimatedPrice = livePrice ?? variantPrice;
  const totalPrice = estimatedPrice + optionAdjustments;

  return {
    estimatedPrice,
    totalPrice,
    listPrice,
    weightGrams: resolved.baseWeight,
    karatLabel: resolved.karatLabel,
    breakdown,
    loading,
    optionAdjustments,
    optionLines,
    metalLabel: resolved.metalOption?.label ?? selections.metal,
    diamondLabel: resolved.qualityOption?.label ?? selections.quality,
  };
}

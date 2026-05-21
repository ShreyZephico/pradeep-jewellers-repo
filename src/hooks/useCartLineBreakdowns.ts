"use client";

import { useEffect, useState } from "react";

import {
  getCaratFromLineAttributes,
  parseBreakdownFromLine,
  type CartLineBreakdownData,
} from "@/lib/cartBreakdown";
import type { ClientCartLine } from "@/types/cart";
import type { Product } from "@/types/product";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import { resolveVariantWeight } from "@/utils/resolveVariantWeight";

type BreakdownMap = Map<string, CartLineBreakdownData>;

async function fetchProductByHandle(handle: string): Promise<Product | null> {
  const response = await fetch(`/api/products/${encodeURIComponent(handle)}`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.success && data.product ? (data.product as Product) : null;
}

function weightForLine(product: Product, line: ClientCartLine): number {
  const variant = product.variants?.find(
    (v) => v.id === line.merchandiseId || v.catalogVariantId === line.merchandiseId
  );
  const grams = variant?.weight ?? product.variants?.find((v) => v.weight)?.weight;
  return resolveVariantWeight(grams ?? 5);
}

async function calculateBreakdown(
  weight: number,
  carat: string | null
): Promise<VariantPriceBreakdown | null> {
  const response = await fetch("/api/price/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weight, carat }),
  });
  const data = await response.json();
  if (!data.success || typeof data.finalPrice !== "number") return null;

  return {
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
  };
}

async function resolveLineBreakdown(
  line: ClientCartLine,
  productCache: Map<string, Product | null>
): Promise<CartLineBreakdownData | null> {
  const stored = parseBreakdownFromLine(line);
  if (stored) return stored;

  const handle = line.productHandle?.trim();
  if (!handle) return null;

  if (!productCache.has(handle)) {
    productCache.set(handle, await fetchProductByHandle(handle));
  }
  const product = productCache.get(handle);
  if (!product) return null;

  const weightGrams = weightForLine(product, line);
  const caratLabel = getCaratFromLineAttributes(line.attributes);
  const breakdown = await calculateBreakdown(weightGrams, caratLabel);
  if (!breakdown) return null;

  const unitPrice =
    line.customPriceInr > 0 ? line.customPriceInr : breakdown.finalPrice;

  return {
    weightGrams,
    karatLabel: caratLabel,
    breakdown,
    optionAdjustments: Math.max(0, unitPrice - breakdown.finalPrice),
    unitPrice,
  };
}

export function useCartLineBreakdowns(lines: ClientCartLine[]) {
  const [breakdowns, setBreakdowns] = useState<BreakdownMap>(new Map());
  const [loading, setLoading] = useState(false);

  const lineKey = lines.map((l) => `${l.id}:${l.quantity}:${l.customPriceInr}`).join("|");

  useEffect(() => {
    if (lines.length === 0) {
      setBreakdowns(new Map());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const run = async () => {
      const productCache = new Map<string, Product | null>();
      const next = new Map<string, CartLineBreakdownData>();

      await Promise.all(
        lines.map(async (line) => {
          const data = await resolveLineBreakdown(line, productCache);
          if (data) next.set(line.id, data);
        })
      );

      if (!cancelled) {
        setBreakdowns(next);
        setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [lineKey]); // eslint-disable-line react-hooks/exhaustive-deps -- keyed by cart lines

  return { breakdowns, loading };
}

"use client";

import { useEffect, useState } from "react";

import {
  getCaratFromLineAttributes,
  parseBreakdownFromLine,
  type CartLineBreakdownData,
} from "@/lib/cartBreakdown";
import type { ClientCartLine } from "@/types/cart";
import type { Product } from "@/types/product";
import { parsePriceCalculateResponse } from "@/lib/priceCalculateResponse";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import { computeJewelleryPriceFromOptionLines } from "@/utils/calculateVariantPrice";
import {
  buildPriceBreakdownOptionLinesFromCartLine,
  sumOptionLineAmounts,
  type PriceBreakdownOptionLine,
} from "@/utils/priceBreakdownOptions";
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
  carat: string | null,
  makingChargePercent?: number
): Promise<VariantPriceBreakdown | null> {
  const response = await fetch("/api/price/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weight, carat, makingChargePercent: makingChargePercent ?? null }),
  });
  const pricing = await parsePriceCalculateResponse(response);
  return pricing?.breakdown ?? null;
}

async function resolveLineBreakdown(
  line: ClientCartLine,
  productCache: Map<string, Product | null>
): Promise<CartLineBreakdownData | null> {
  const handle = line.productHandle?.trim();
  let product: Product | null = null;

  if (handle) {
    if (!productCache.has(handle)) {
      productCache.set(handle, await fetchProductByHandle(handle));
    }
    product = productCache.get(handle) ?? null;
  }

  const optionLines: PriceBreakdownOptionLine[] = product
    ? buildPriceBreakdownOptionLinesFromCartLine(line, product)
    : [];

  const stored = parseBreakdownFromLine(line);
  if (stored) {
    return {
      ...stored,
      optionLines,
    };
  }

  if (!handle || !product) return null;

  const weightGrams = weightForLine(product, line);
  const caratLabel = getCaratFromLineAttributes(line.attributes);
  const breakdown = await calculateBreakdown(
    weightGrams,
    caratLabel,
    product.makingChargePercent
  );
  if (!breakdown) return null;

  const optionAdjustments = sumOptionLineAmounts(optionLines);
  const unitPrice =
    line.customPriceInr > 0
      ? line.customPriceInr
      : computeJewelleryPriceFromOptionLines(breakdown, optionLines).grandTotal;

  return {
    weightGrams,
    karatLabel: caratLabel,
    breakdown,
    optionLines,
    optionAdjustments,
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

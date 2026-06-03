import { parseJsonResponse } from "@/lib/parseJsonResponse";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";

type PriceCalculateJson = {
  success?: boolean;
  error?: string;
} & Partial<VariantPriceBreakdown>;

function isVariantPriceBreakdown(
  data: PriceCalculateJson
): data is { success: true } & VariantPriceBreakdown {
  return (
    data.success === true &&
    typeof data.purity === "number" &&
    typeof data.karat === "number" &&
    typeof data.base24KGoldPrice === "number" &&
    typeof data.adjustedGoldPrice === "number" &&
    typeof data.perGramRate === "number" &&
    typeof data.actualGoldPrice === "number" &&
    typeof data.makingCharge === "number" &&
    typeof data.subtotal === "number" &&
    typeof data.gst === "number" &&
    typeof data.finalPrice === "number"
  );
}

/** Parses `/api/price/calculate` JSON into a typed breakdown, or null when invalid. */
export async function parsePriceCalculateResponse(
  response: Response
): Promise<{ finalPrice: number; breakdown: VariantPriceBreakdown } | null> {
  const data = await parseJsonResponse<PriceCalculateJson>(response);
  if (!data || !isVariantPriceBreakdown(data)) {
    return null;
  }

  return {
    finalPrice: data.finalPrice,
    breakdown: {
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
    },
  };
}

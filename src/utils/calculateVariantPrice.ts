import getGoldPrice from "./goldPrice";
import { parseKaratNumber } from "./karat";

export type VariantPriceBreakdown = {
  purity: number;
  karat: number;
  base24KGoldPrice: number;
  adjustedGoldPrice: number;
  perGramRate: number;
  actualGoldPrice: number;
  makingCharge: number;
  subtotal: number;
  gst: number;
  finalPrice: number;
};

export type VariantPriceBreakdown = {
  purity: number;
  karat: number;
  base24KGoldPrice: number;
  adjustedGoldPrice: number;
  perGramRate: number;
  actualGoldPrice: number;
  makingCharge: number;
  subtotal: number;
  gst: number;
  finalPrice: number;
};

type CalculateVariantPriceProps = {
  weight: number;
  carat?: string | null;
};

async function calculateVariantPrice({
  weight,
  carat,
}: CalculateVariantPriceProps) {

  const base24KGoldPrice = await getGoldPrice();

  const karat = parseKaratNumber(carat);

  const purityPercentage =
    Math.round(
      (karat / 24) * 100
    );

  const adjustedGoldPrice =
    (base24KGoldPrice * purityPercentage) / 100;

  const perGramRate =
    Math.ceil(adjustedGoldPrice);

  const actualGoldPrice =
    weight * perGramRate;

  const makingCharge =
    actualGoldPrice * 0.07;

  const subtotal =
    actualGoldPrice + makingCharge;

  const gst =
    subtotal * 0.03;

  const finalPrice =
    subtotal + gst;

  const result: VariantPriceBreakdown = {
    purity: purityPercentage,
    karat,
    base24KGoldPrice,
    adjustedGoldPrice: Math.round(adjustedGoldPrice),
    perGramRate,
    actualGoldPrice: Math.round(actualGoldPrice),
    makingCharge: Math.round(makingCharge),
    subtotal: Math.round(subtotal),
    gst: Math.round(gst),
    finalPrice: Math.round(finalPrice),
  };

  return result;
}

export default calculateVariantPrice;
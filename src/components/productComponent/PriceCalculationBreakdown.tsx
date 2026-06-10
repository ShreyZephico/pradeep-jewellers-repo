"use client";

import { formatProductPrice } from "@/utils/formatPrice";
import {
  computeJewelleryPriceFromOptionLines,
  type VariantPriceBreakdown,
} from "@/utils/calculateVariantPrice";
import type { PriceBreakdownOptionLine } from "@/utils/priceBreakdownOptions";
import productContent from "@/lib/productContent";
import {
  buildGoldBreakupLabel,
  extractDiamondQualityLabel,
  splitBreakupOptionLines,
} from "@/utils/priceBreakupDisplay";

type PriceCalculationBreakdownProps = {
  breakdown: VariantPriceBreakdown | null;
  weightGrams: number;
  karatLabel: string | null;
  metalLabel?: string | null;
  diamondLabel?: string | null;
  loading?: boolean;
  optionAdjustments?: number;
  optionLines?: PriceBreakdownOptionLine[];
  displayTotal: number;
  /** When true, omits outer section chrome (for content modals). */
  embedded?: boolean;
};

const copy = productContent.priceBreakdown;

function formatWeightGrams(weight: number): string {
  const w = Math.round(weight * 1000) / 1000;
  return `${w} ${copy.weightUnit}`;
}

export default function PriceCalculationBreakdown({
  breakdown,
  weightGrams,
  karatLabel,
  metalLabel = null,
  diamondLabel = null,
  loading,
  optionLines = [],
  displayTotal,
  embedded = false,
}: PriceCalculationBreakdownProps) {
  const rootClass = embedded
    ? "product-breakdown product-breakdown--embedded product-breakup"
    : "product-breakdown product-breakup";

  if (loading && !breakdown) {
    return (
      <section className={rootClass}>
        <p className="product-breakup-heading product-breakup-heading--muted">
          {copy.loadingTitle}
        </p>
        <p className="product-breakdown-loading">{copy.loading}</p>
      </section>
    );
  }

  if (!breakdown) {
    return null;
  }

  const { diamond, otherExtras } = splitBreakupOptionLines(optionLines);
  const totals = computeJewelleryPriceFromOptionLines(breakdown, optionLines);
  const diamondAmount = totals.diamondAmount;
  const goldTotal = totals.goldTotal;
  const goldLineLabel = buildGoldBreakupLabel(
    karatLabel,
    metalLabel,
    breakdown.karat
  );
  const diamondLineLabel =
    diamondLabel?.trim() ||
    (diamond ? extractDiamondQualityLabel(diamond.label) : "");

  return (
    <section className={rootClass} aria-label={copy.title}>
      {!embedded ? (
        <>
          <p className="product-breakup-heading">{copy.title}</p>
          {copy.subtitle ? (
            <p className="product-breakdown-subtitle">{copy.subtitle}</p>
          ) : null}
        </>
      ) : null}

      <div className="product-breakup-table">
        <div className="product-breakup-block product-breakup-block--gold">
          <div className="product-breakup-row product-breakup-row--head">
            <span className="product-breakup-label">{goldLineLabel}</span>
            <span className="product-breakup-weight">{formatWeightGrams(weightGrams)}</span>
          </div>
          <div className="product-breakup-row product-breakup-row--meta">
            <span className="product-breakup-rate">
              {formatProductPrice(breakdown.perGramRate)}
              {copy.perGramSuffix}
            </span>
            <span className="product-breakup-amount">{formatProductPrice(goldTotal)}</span>
          </div>
        </div>

        {diamondAmount > 0 && diamondLineLabel ? (
          <div className="product-breakup-row">
            <span className="product-breakup-label">{diamondLineLabel}</span>
            <span className="product-breakup-amount">{formatProductPrice(diamondAmount)}</span>
          </div>
        ) : null}

        <div className="product-breakup-row">
          <span className="product-breakup-label">{copy.makingCharge}</span>
          <span className="product-breakup-amount">
            {formatProductPrice(totals.makingCharge)}
          </span>
        </div>

        {otherExtras > 0 ? (
          <div className="product-breakup-row">
            <span className="product-breakup-label">{copy.otherAdjustments}</span>
            <span className="product-breakup-amount">{formatProductPrice(otherExtras)}</span>
          </div>
        ) : null}

        <div className="product-breakup-row">
          <span className="product-breakup-label">{copy.gst}</span>
          <span className="product-breakup-amount">{formatProductPrice(totals.gst)}</span>
        </div>

        <div className="product-breakup-row product-breakup-row--grand">
          <span className="product-breakup-label">{copy.grandTotal}</span>
          <span className="product-breakup-price product-breakup-price--grand">
            {formatProductPrice(totals.grandTotal || displayTotal)}
          </span>
        </div>
      </div>
    </section>
  );
}

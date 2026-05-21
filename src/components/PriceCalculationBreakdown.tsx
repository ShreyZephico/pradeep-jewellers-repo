"use client";

import { formatProductPrice } from "@/utils/formatPrice";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import productContent, { formatProductCopy } from "@/lib/productContent";

type PriceCalculationBreakdownProps = {
  breakdown: VariantPriceBreakdown | null;
  weightGrams: number;
  karatLabel: string | null;
  loading?: boolean;
  optionAdjustments?: number;
  displayTotal: number;
  /** When true, omits outer section chrome (for content modals). */
  embedded?: boolean;
};

const copy = productContent.priceBreakdown;

function BreakdownRow({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <div className={`product-breakdown-row${emphasize ? " product-breakdown-row--emphasize" : ""}`}>
      <div>
        <span
          className={`product-breakdown-row-label${
            emphasize ? " product-breakdown-row-label--emphasize" : ""
          }`}
        >
          {label}
        </span>
        {hint ? <span className="product-breakdown-row-hint">{hint}</span> : null}
      </div>
      <span
        className={`product-breakdown-row-value${
          emphasize ? " product-breakdown-row-value--emphasize" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function PriceCalculationBreakdown({
  breakdown,
  weightGrams,
  karatLabel,
  loading,
  optionAdjustments = 0,
  displayTotal,
  embedded = false,
}: PriceCalculationBreakdownProps) {
  const rootClass = embedded ? "product-breakdown product-breakdown--embedded" : "product-breakdown";

  if (loading && !breakdown) {
    return (
      <section className={rootClass}>
        <p className="product-breakdown-title product-breakdown-title--muted">
          {copy.loadingTitle}
        </p>
        <p className="product-breakdown-loading">{copy.loading}</p>
      </section>
    );
  }

  if (!breakdown) {
    return null;
  }

  const purityLabel = karatLabel?.trim() || `${breakdown.karat}K`;

  return (
    <section className={rootClass}>
      {!embedded ? (
        <>
          <p className="product-breakdown-title product-breakdown-title--accent">{copy.title}</p>
          <p className="product-breakdown-subtitle">{copy.subtitle}</p>
        </>
      ) : null}

      <div className="product-breakdown-table">


        <BreakdownRow
          label={copy.weight}
          value={`${weightGrams} ${copy.weightUnit}`}
        />
                <BreakdownRow
          label={copy.ratePerGram}
          value={`${formatProductPrice(breakdown.perGramRate)}${copy.perGramSuffix}`}
        />
        <BreakdownRow
          label={copy.makingCharge}
          value={formatProductPrice(breakdown.makingCharge)}
        />
        <BreakdownRow label={copy.subtotal} value={formatProductPrice(breakdown.subtotal)} />
        <BreakdownRow label={copy.gst} value={formatProductPrice(breakdown.gst)} />
        <BreakdownRow
          label={copy.calculatedTotal}
          value={formatProductPrice(breakdown.finalPrice)}
          emphasize
        />
        {optionAdjustments !== 0 ? (
          <>
            <BreakdownRow
              label={copy.optionAdjustments}
              value={formatProductPrice(optionAdjustments)}
            />
            <BreakdownRow
              label={copy.yourPrice}
              value={formatProductPrice(displayTotal)}
              emphasize
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

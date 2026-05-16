"use client";

import { formatProductPrice } from "@/utils/formatPrice";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";

type PriceCalculationBreakdownProps = {
  breakdown: VariantPriceBreakdown | null;
  weightGrams: number;
  karatLabel: string | null;
  loading?: boolean;
  optionAdjustments?: number;
  displayTotal: number;
};

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
    <div
      className={`flex items-start justify-between gap-4 py-2 ${emphasize ? "border-t border-[#eadcc8] pt-3 font-bold" : ""}`}
    >
      <div>
        <span className={`text-sm ${emphasize ? "text-[#2f1c12]" : "text-[#765f4a]"}`}>
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-xs text-[#9d8a76]">{hint}</span>
        ) : null}
      </div>
      <span
        className={`shrink-0 text-sm tabular-nums ${emphasize ? "font-black text-[#9F2B68]" : "font-semibold text-[#2f1c12]"}`}
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
}: PriceCalculationBreakdownProps) {
  if (loading && !breakdown) {
    return (
      <section className="border-b border-[#f4e7d7] bg-[#fffaf2] px-5 py-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#765f4a]">
          Price breakdown
        </p>
        <p className="mt-2 text-sm text-[#9d8a76]">Calculating…</p>
      </section>
    );
  }

  if (!breakdown) {
    return null;
  }

  const purityLabel = karatLabel?.trim() || `${breakdown.karat}K`;

  return (
    <section className="border-b border-[#f4e7d7] bg-[#fffaf2] px-5 py-4 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-[#9F2B68]">
        How your price is calculated
      </p>
      <p className="mt-1 text-xs text-[#765f4a]">
        Live 24K rate from database · updates when you change karat or variant
      </p>

      <div className="mt-4 space-y-0 divide-y divide-[#f4e7d7]/80 rounded-2xl border border-[#eadcc8] bg-white px-4 py-1">
        <BreakdownRow
          label="24K gold rate (database)"
          value={`${formatProductPrice(breakdown.base24KGoldPrice)}/g`}
          hint="Latest row in dev.metal_prices"
        />
        <BreakdownRow
          label={`Gold purity (${purityLabel})`}
          value={`${breakdown.purity}%`}
          hint={`${breakdown.karat} ÷ 24 × 100`}
        />
        <BreakdownRow
          label="Adjusted rate per gram"
          value={`${formatProductPrice(breakdown.perGramRate)}/g`}
          hint={`ceil(${formatProductPrice(breakdown.adjustedGoldPrice)}/g)`}
        />
        <BreakdownRow
          label="Weight"
          value={`${weightGrams} g`}
          hint="From variant or default"
        />
        <BreakdownRow
          label="Gold value"
          value={formatProductPrice(breakdown.actualGoldPrice)}
          hint={`${weightGrams} g × ${formatProductPrice(breakdown.perGramRate)}/g`}
        />
        <BreakdownRow
          label="Making charge"
          value={formatProductPrice(breakdown.makingCharge)}
          hint="7% of gold value"
        />
        <BreakdownRow
          label="Subtotal"
          value={formatProductPrice(breakdown.subtotal)}
          hint="Gold + making"
        />
        <BreakdownRow
          label="GST"
          value={formatProductPrice(breakdown.gst)}
          hint="3% of subtotal"
        />
        <BreakdownRow
          label="Calculated total"
          value={formatProductPrice(breakdown.finalPrice)}
          emphasize
        />
        {optionAdjustments !== 0 ? (
          <>
            <BreakdownRow
              label="Option adjustments"
              value={formatProductPrice(optionAdjustments)}
            />
            <BreakdownRow
              label="Your price"
              value={formatProductPrice(displayTotal)}
              emphasize
            />
          </>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-[#9d8a76]">
        Formula: (24K rate × purity%) → per gram → × weight → + 7% making → + 3% GST.
        Computed on the server via calculateVariantPrice.
      </p>
    </section>
  );
}

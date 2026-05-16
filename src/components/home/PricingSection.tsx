"use client";

import { useMemo, useState } from "react";

import data from "@/data/contactDatas.json";

function formatInr(amount: number): string {
  const rounded = Math.round(amount);
  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded)}`;
}

function formatWeightGrams(w: number): string {
  if (Number.isInteger(w)) return `${w}`;
  return w.toFixed(1).replace(/\.0$/, "");
}

function applyTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? "")
  );
}

function FeatureIcon({ name }: { name: string }) {
  const common = "h-7 w-7 text-[#A67C37]";
  switch (name) {
    case "diamond":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2l2.5 4h5L12 22 4.5 6h5L12 2Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M6 6h12M9.5 6 12 2l2.5 4"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "hammer":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 20l5-5M14 6l4 4-7 7-4-4 7-7Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M17 3l4 4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v3M12 18v3M3 12h3M18 12h3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    default:
      return <div className={common} />;
  }
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h8" strokeLinecap="round" />
    </svg>
  );
}

export default function PricingSection() {
  const s = data.pricingSection;
  const calc = s.calculator;

  const [weight, setWeight] = useState(calc.defaultWeight);
  const [purityId, setPurityId] = useState(calc.defaultPurityId);
  const [makingPct, setMakingPct] = useState(calc.defaultMakingPercent);

  const purity = useMemo(
    () =>
      calc.purityOptions.find((p) => p.id === purityId) ?? calc.purityOptions[0],
    [calc.purityOptions, purityId]
  );

  const goldValue = Math.round(weight * purity.pricePerGram);
  const makingValue = Math.round((goldValue * makingPct) / 100);
  const gstRate = calc.gstPercent / 100;
  const gst = Math.round((goldValue + makingValue) * gstRate);
  const total = goldValue + makingValue + gst;
  const marketAvg = Math.round(total * calc.marketMultiplier);

  const wDisplay = formatWeightGrams(weight);
  const goldLine = applyTemplate(calc.goldLineTemplate, {
    purity: purity.label,
    weight: wDisplay,
  });
  const makingLine = applyTemplate(calc.makingLineTemplate, { making: makingPct });
  const gstLine = applyTemplate(calc.gstLineTemplate, { gst: calc.gstPercent });

  return (
    <section className="bg-[#F9F7F2] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          {/* Left */}
          <div>
            <div className="mb-5 flex items-center gap-4">
              <span className="h-px w-10 shrink-0 bg-[#A67C37]" aria-hidden />
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#2D2926]/75">
                {s.badge}
              </p>
            </div>

            <h2 className="font-serif text-4xl font-light leading-tight tracking-tight text-[#2D2926] md:text-[2.65rem] lg:text-5xl">
              {s.titlePrefix}
              <span className="text-[#A67C37]">{s.titleHighlight}</span>
              {s.titleSuffix}
            </h2>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#2D2926]/65 md:text-base">
              {s.description}
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {s.features.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col border border-neutral-200/90 bg-white p-5 shadow-sm"
                >
                  <FeatureIcon name={f.icon} />
                  <h3 className="mt-4 text-sm font-semibold text-[#2D2926]">
                    {f.title}
                  </h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-[#2D2926]/55">
                    {f.description}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-[#A67C37]">
                    {f.percentage}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 border border-neutral-200/80 border-l-[3px] border-l-[#A67C37] bg-white/90 px-6 py-6 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2D2926]/50">
                {s.marketCompare.label}
              </p>
              <p className="mt-2 font-serif text-lg text-[#2D2926] md:text-xl">
                {s.marketCompare.headline}
              </p>
              <p className="mt-2 text-sm font-medium text-[#A67C37]">
                {s.marketCompare.subtext}
              </p>
            </div>
          </div>

          {/* Calculator */}
          <div className="overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-[0_24px_60px_rgba(45,41,38,0.08)]">
            <div className="flex items-center gap-3 bg-[#2D2926] px-5 py-4 md:px-6">
              <DocumentIcon className="shrink-0 text-white/90" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                {calc.headerTitle}
              </p>
            </div>

            <div className="space-y-7 p-6 md:p-8">
              <div>
                <div className="mb-3 flex items-center justify-between text-sm text-[#2D2926]">
                  <span className="font-medium">{calc.weightLabel}</span>
                  <span className="font-medium tabular-nums text-[#2D2926]">
                    {wDisplay} {calc.weightUnit}
                  </span>
                </div>
                <input
                  type="range"
                  min={calc.weightMin}
                  max={calc.weightMax}
                  step={calc.weightStep}
                  value={weight}
                  suppressHydrationWarning
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-[#A67C37]"
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-[#2D2926]">
                  {calc.purityLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {calc.purityOptions.map((opt) => {
                    const on = opt.id === purityId;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setPurityId(opt.id)}
                        className={`min-h-[44px] min-w-[4.5rem] rounded-md border px-5 text-sm font-semibold transition ${
                          on
                            ? "border-[#A67C37] bg-[#A67C37] text-white"
                            : "border-neutral-200 bg-white text-[#2D2926] hover:border-[#A67C37]/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-[#2D2926]">
                  {calc.makingLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {calc.makingPercents.map((pct) => {
                    const on = pct === makingPct;
                    return (
                      <button
                        key={pct}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setMakingPct(pct)}
                        className={`min-h-[44px] min-w-[4.5rem] rounded-md border px-5 text-sm font-semibold transition ${
                          on
                            ? "border-[#A67C37] bg-[#A67C37] text-white"
                            : "border-neutral-200 bg-white text-[#2D2926] hover:border-[#A67C37]/50"
                        }`}
                      >
                        {pct}%
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 border-t border-dotted border-neutral-300/90 pt-6 text-sm">
                <div className="flex justify-between gap-4 text-[#2D2926]/80">
                  <span>{goldLine}</span>
                  <span className="shrink-0 tabular-nums font-medium text-[#2D2926]">
                    {formatInr(goldValue)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-[#2D2926]/80">
                  <span>{makingLine}</span>
                  <span className="shrink-0 tabular-nums font-medium text-[#2D2926]">
                    {formatInr(makingValue)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-[#2D2926]/80">
                  <span>{gstLine}</span>
                  <span className="shrink-0 tabular-nums font-medium text-[#2D2926]">
                    {formatInr(gst)}
                  </span>
                </div>
              </div>

              <div className="border-t border-dotted border-neutral-300/90 pt-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm font-semibold text-[#2D2926]">
                    {calc.yourPriceLabel}
                  </span>
                  <span className="font-serif text-3xl font-medium tabular-nums text-[#A67C37] md:text-[2rem]">
                    {formatInr(total)}
                  </span>
                </div>
                <div className="mt-4 flex justify-between gap-4 text-sm text-[#2D2926]/50">
                  <span>{calc.marketAverageLabel}</span>
                  <span className="tabular-nums line-through">
                    {formatInr(marketAvg)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

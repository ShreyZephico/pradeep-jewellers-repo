"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import data from "@/data/contactDatas.json";

import "./css/pricing.css";

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
  const iconClass = "pricing-section__feature-icon";
  switch (name) {
    case "diamond":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
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
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
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
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
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
      return <span className={iconClass} aria-hidden />;
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
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

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

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reveal = () => setVisible(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal();
    }

    return () => observer.disconnect();
  }, []);

  const sectionClass = `pricing-section${
    visible ? " pricing-section--visible" : ""
  }`;

  return (
    <section
      ref={sectionRef}
      className={sectionClass}
      aria-labelledby="pricing-section-heading"
    >
      <div className="pricing-section__inner">
        <div className="pricing-section__layout">
          <div className="pricing-section__intro">
            <div className="pricing-section__badge-row">
              <span className="pricing-section__badge-line" aria-hidden />
              <p className="pricing-section__badge">{s.badge}</p>
            </div>

            <h2
              id="pricing-section-heading"
              className="pricing-section__title"
            >
              {s.titlePrefix}
              <span className="pricing-section__title-accent">
                {s.titleHighlight}
              </span>
              {s.titleSuffix}
            </h2>

            <p className="pricing-section__description">{s.description}</p>

            <div className="pricing-section__features">
              {s.features.map((f, index) => (
                <article
                  key={f.title}
                  className="pricing-section__feature-card"
                  style={{ "--card-index": index } as CSSProperties}
                >
                  <FeatureIcon name={f.icon} />
                  <h3 className="pricing-section__feature-title">{f.title}</h3>
                  <p className="pricing-section__feature-desc">
                    {f.description}
                  </p>
                  <p className="pricing-section__feature-pct">{f.percentage}</p>
                </article>
              ))}
            </div>

            <aside className="pricing-section__compare">
              <p className="pricing-section__compare-label">
                {s.marketCompare.label}
              </p>
              <p className="pricing-section__compare-headline">
                {s.marketCompare.headline}
              </p>
              <p className="pricing-section__compare-subtext">
                {s.marketCompare.subtext}
              </p>
            </aside>
          </div>

          <div className="pricing-section__calc">
            <div className="pricing-section__calc-header">
              <DocumentIcon className="pricing-section__calc-header-icon" />
              <p className="pricing-section__calc-header-title">
                {calc.headerTitle}
              </p>
            </div>

            <div className="pricing-section__calc-body">
              <div>
                <div className="pricing-section__field-label-row">
                  <span className="pricing-section__field-label">
                    {calc.weightLabel}
                  </span>
                  <span className="pricing-section__field-value">
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
                  className="pricing-section__range"
                  aria-valuemin={calc.weightMin}
                  aria-valuemax={calc.weightMax}
                  aria-valuenow={weight}
                  aria-label={calc.weightLabel}
                />
              </div>

              <div>
                <p className="pricing-section__field-heading">
                  {calc.purityLabel}
                </p>
                <div className="pricing-section__chips">
                  {calc.purityOptions.map((opt) => {
                    const on = opt.id === purityId;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setPurityId(opt.id)}
                        className={`pricing-section__chip${
                          on ? " pricing-section__chip--active" : ""
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="pricing-section__field-heading">
                  {calc.makingLabel}
                </p>
                <div className="pricing-section__chips">
                  {calc.makingPercents.map((pct) => {
                    const on = pct === makingPct;
                    return (
                      <button
                        key={pct}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setMakingPct(pct)}
                        className={`pricing-section__chip${
                          on ? " pricing-section__chip--active" : ""
                        }`}
                      >
                        {pct}%
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pricing-section__breakdown">
                <div className="pricing-section__breakdown-row">
                  <span>{goldLine}</span>
                  <span className="pricing-section__breakdown-value">
                    {formatInr(goldValue)}
                  </span>
                </div>
                <div className="pricing-section__breakdown-row">
                  <span>{makingLine}</span>
                  <span className="pricing-section__breakdown-value">
                    {formatInr(makingValue)}
                  </span>
                </div>
                <div className="pricing-section__breakdown-row">
                  <span>{gstLine}</span>
                  <span className="pricing-section__breakdown-value">
                    {formatInr(gst)}
                  </span>
                </div>
              </div>

              <div className="pricing-section__total-block">
                <div className="pricing-section__total-row">
                  <span className="pricing-section__total-label">
                    {calc.yourPriceLabel}
                  </span>
                  <span className="pricing-section__total-value">
                    {formatInr(total)}
                  </span>
                </div>
                <div className="pricing-section__market-row">
                  <span>{calc.marketAverageLabel}</span>
                  <span className="pricing-section__market-value">
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

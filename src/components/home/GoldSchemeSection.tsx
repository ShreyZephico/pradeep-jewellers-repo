"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import data from "@/data/contactDatas.json";
import { useCountdown } from "@/hooks/useCountdown";
import {
  padCountdownUnit,
  resolveClearanceCountdown,
} from "@/lib/goldSchemeCountdown";

import "./css/gold-scheme.css";

function formatInr(amount: number): string {
  return `\u20B9${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount))}`;
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path d="M12 22c4.5 0 7-3 7-6.5C19 11 15 8 14 4c-1 2-2 3.5-2 5.5 0 2-1.5 3.5-3 3.5-1 0-2-.5-2.5-1.5C5 14 5 15.5 5 15.5 5 19 8 22 12 22Z" />
      <path d="M12 22c-2.5 0-4-1.8-4-4.2 0-1.2.8-2.3 2-2.8.6 2.2 2 3.5 2 3.5Z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function MonthCheckIcon() {
  return (
    <svg
      className="gold-scheme-section__month-check"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function GoldSchemeSection() {
  const section = data.goldSchemeSection;
  const scheme = section.schemeCard;
  const clearance = section.clearancePanel;
  const countdownConfig = useMemo(
    () => resolveClearanceCountdown(clearance),
    [clearance]
  );
  const countdown = useCountdown(countdownConfig);

  const [contribution, setContribution] = useState(scheme.defaultContribution);

  const youPay = contribution * scheme.paidMonthsCount;
  const weAdd = contribution;
  const totalValue = contribution * (scheme.paidMonthsCount + 1);

  const stats = [
    { value: formatInr(youPay), label: scheme.youPayCaption, highlight: false },
    { value: formatInr(weAdd), label: scheme.weAddCaption, highlight: true },
    { value: formatInr(totalValue), label: scheme.totalCaption, highlight: false },
  ];

  const countdownUnits = [
    { value: countdown.days, label: countdownConfig.daysLabel },
    { value: countdown.hours, label: countdownConfig.hoursLabel },
    { value: countdown.minutes, label: countdownConfig.minutesLabel },
    { value: countdown.seconds, label: countdownConfig.secondsLabel },
  ];

  const showExpired =
    countdown.isReady &&
    (countdown.isExpired || !countdownConfig.isConfigured || countdown.isInvalid);

  return (
    <section
      className="gold-scheme-section"
      aria-labelledby="gold-scheme-section-heading"
    >
      <div className="gold-scheme-section__inner">
        <div className="gold-scheme-section__layout">
          <div className="gold-scheme-section__scheme-wrap">
            <div className="gold-scheme-section__scheme">
              <div className="gold-scheme-section__scheme-body">
                <div className="gold-scheme-section__scheme-badge-row">
                  <span
                    className="gold-scheme-section__scheme-badge-line"
                    aria-hidden
                  />
                  <p className="gold-scheme-section__scheme-badge">
                    {scheme.badge}
                  </p>
                  <span
                    className="gold-scheme-section__scheme-badge-line"
                    aria-hidden
                  />
                </div>

                <h2
                  id="gold-scheme-section-heading"
                  className="gold-scheme-section__scheme-title"
                >
                  {scheme.title}
                </h2>
                <p className="gold-scheme-section__scheme-desc">
                  {scheme.description}
                </p>

                <div className="gold-scheme-section__months">
                  {Array.from({ length: scheme.paidMonthsCount }, (_, i) => (
                    <div
                      key={i}
                      className="gold-scheme-section__month-cell"
                      style={{ "--cell-index": i } as CSSProperties}
                    >
                      {scheme.monthPrefix}
                      {i + 1}
                    </div>
                  ))}
                  <div className="gold-scheme-section__month-cell gold-scheme-section__month-cell--bonus">
                    <MonthCheckIcon />
                  </div>
                </div>

                <div className="gold-scheme-section__slider-wrap">
                  <div className="gold-scheme-section__slider-header">
                    <span>{scheme.sliderLabel}</span>
                    <span className="gold-scheme-section__slider-value">
                      {formatInr(contribution)}
                    </span>
                  </div>
                  <input
                    type="range"
                    suppressHydrationWarning
                    min={scheme.contributionMin}
                    max={scheme.contributionMax}
                    step={scheme.contributionStep}
                    value={contribution}
                    onChange={(e) => setContribution(Number(e.target.value))}
                    className="gold-scheme-section__range"
                    aria-valuemin={scheme.contributionMin}
                    aria-valuemax={scheme.contributionMax}
                    aria-valuenow={contribution}
                    aria-label={scheme.sliderLabel}
                  />
                </div>

                <div className="gold-scheme-section__stats">
                  {stats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`gold-scheme-section__stat${
                        stat.highlight
                          ? " gold-scheme-section__stat--highlight"
                          : ""
                      }`}
                      style={{ "--card-index": index } as CSSProperties}
                    >
                      <p className="gold-scheme-section__stat-value">
                        {stat.value}
                      </p>
                      <p className="gold-scheme-section__stat-label">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <a
                  href={scheme.whatsappCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-scheme-section__whatsapp"
                >
                  <WhatsAppIcon className="gold-scheme-section__whatsapp-icon" />
                  {scheme.whatsappCta.text}
                </a>
              </div>
            </div>
          </div>

          <aside className="gold-scheme-section__clearance">
            <div className="gold-scheme-section__clearance-header">
              <FlameIcon className="gold-scheme-section__flame" />
              <p className="gold-scheme-section__clearance-title">
                {clearance.headerText}
              </p>
            </div>

            {showExpired ? (
              <p className="gold-scheme-section__countdown-expired">
                {countdownConfig.expiredMessage}
              </p>
            ) : (
              <div
                className="gold-scheme-section__countdown"
                aria-live="polite"
                aria-atomic="true"
              >
                {countdownUnits.map((u, index) => (
                  <div
                    key={u.label}
                    className="gold-scheme-section__countdown-unit"
                    style={{ "--unit-index": index } as CSSProperties}
                  >
                    <span
                      className="gold-scheme-section__countdown-value"
                      suppressHydrationWarning
                    >
                      {countdown.isReady ? padCountdownUnit(u.value) : "--"}
                    </span>
                    <span className="gold-scheme-section__countdown-label">
                      {u.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="gold-scheme-section__products">
              {clearance.products.map((p, index) => (
                <article
                  key={p.name}
                  className="gold-scheme-section__product"
                  style={{ "--card-index": index } as CSSProperties}
                >
                  <div
                    className={`gold-scheme-section__product-media gold-scheme-section__product-media--${
                      p.tileBg === "dark" ? "dark" : "light"
                    }`}
                  >
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="gold-scheme-section__product-image"
                      sizes="(max-width: 768px) 50vw, 180px"
                    />
                  </div>
                  <p className="gold-scheme-section__product-name">{p.name}</p>
                  <p className="gold-scheme-section__product-price">
                    {p.priceDisplay}
                  </p>
                </article>
              ))}
            </div>

            <div className="gold-scheme-section__view-all-wrap">
              <Link
                href={clearance.viewAll.href}
                className="gold-scheme-section__view-all"
              >
                {clearance.viewAll.text}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

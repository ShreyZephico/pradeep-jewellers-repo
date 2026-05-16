"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import data from "@/data/contactDatas.json";

function formatInr(amount: number): string {
  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount))}`;
}

function getRemainingMs(endIso: string): number {
  const end = new Date(endIso).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, end - Date.now());
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
      <path
        d="M12 22c4.5 0 7-3 7-6.5C19 11 15 8 14 4c-1 2-2 3.5-2 5.5 0 2-1.5 3.5-3 3.5-1 0-2-.5-2.5-1.5C5 14 5 15.5 5 15.5 5 19 8 22 12 22Z"
        fill="#EA580C"
        fillOpacity="0.9"
      />
      <path
        d="M12 22c-2.5 0-4-1.8-4-4.2 0-1.2.8-2.3 2-2.8.6 2.2 2 3.5 2 3.5Z"
        fill="#FBBF24"
        fillOpacity="0.35"
      />
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

export default function GoldSchemeSection() {
  const section = data.goldSchemeSection;
  const scheme = section.schemeCard;
  const clearance = section.clearancePanel;

  const [contribution, setContribution] = useState(scheme.defaultContribution);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const tick = () => setRemainingMs(getRemainingMs(clearance.endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clearance.endsAt]);

  const time = useMemo(() => {
    const sec = Math.floor(remainingMs / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return { days, hours, minutes, seconds };
  }, [remainingMs]);

  const youPay = contribution * scheme.paidMonthsCount;
  const weAdd = contribution;
  const totalValue = contribution * (scheme.paidMonthsCount + 1);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="bg-[#FDFBF7] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-10">
          {/* Gold scheme — ~7/12 */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-xl bg-[#1A1A1A] shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
              <div className="px-6 pb-8 pt-10 md:px-10 md:pb-10 md:pt-12">
                <div className="mb-8 flex items-center justify-center gap-4">
                  <span
                    className="h-px w-8 shrink-0 bg-[#C5A059] md:w-12"
                    aria-hidden
                  />
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.32em] text-[#C5A059] md:text-[11px]">
                    {scheme.badge}
                  </p>
                  <span
                    className="h-px w-8 shrink-0 bg-[#C5A059] md:w-12"
                    aria-hidden
                  />
                </div>

                <h2 className="text-center font-serif text-4xl font-light tracking-tight text-white md:text-5xl">
                  {scheme.title}
                </h2>
                <p className="mx-auto mt-5 max-w-md text-center text-sm leading-relaxed text-white/75 md:text-[15px]">
                  {scheme.description}
                </p>

                <div className="mx-auto mt-10 grid max-w-xl grid-cols-6 gap-2 md:gap-2.5">
                  {Array.from({ length: scheme.paidMonthsCount }, (_, i) => (
                    <div
                      key={i}
                      className="flex aspect-square items-center justify-center border border-white/12 bg-[#2A2A2A] text-[11px] font-medium tracking-wide text-white/85 md:text-xs"
                    >
                      {scheme.monthPrefix}
                      {i + 1}
                    </div>
                  ))}
                  <div className="flex aspect-square items-center justify-center bg-[#B8860B] text-white shadow-inner">
                    <svg
                      width="22"
                      height="22"
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
                  </div>
                </div>

                <div className="mx-auto mt-10 max-w-xl">
                  <div className="mb-3 flex items-center justify-between text-sm text-white/80">
                    <span>{scheme.sliderLabel}</span>
                    <span className="font-serif text-lg font-medium text-[#C5A059] md:text-xl">
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
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#C5A059]"
                  />
                </div>

                <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="border border-white/12 bg-[#242424] px-4 py-5 text-center">
                    <p className="font-serif text-xl text-white md:text-2xl">
                      {formatInr(youPay)}
                    </p>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
                      {scheme.youPayCaption}
                    </p>
                  </div>
                  <div className="border border-[#C5A059] bg-[#1F1F1F] px-4 py-5 text-center shadow-[inset_0_0_0_1px_rgba(197,160,89,0.35)]">
                    <p className="font-serif text-xl text-[#C5A059] md:text-2xl">
                      {formatInr(weAdd)}
                    </p>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#C5A059]">
                      {scheme.weAddCaption}
                    </p>
                  </div>
                  <div className="border border-white/12 bg-[#242424] px-4 py-5 text-center">
                    <p className="font-serif text-xl text-white md:text-2xl">
                      {formatInr(totalValue)}
                    </p>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
                      {scheme.totalCaption}
                    </p>
                  </div>
                </div>

                <a
                  href={scheme.whatsappCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-3 rounded-md bg-[#25D366] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#1ebe57]"
                >
                  <WhatsAppIcon className="shrink-0 text-white" />
                  {scheme.whatsappCta.text}
                </a>
              </div>
            </div>
          </div>

          {/* Stock clearance — ~5/12 */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-neutral-200/90 bg-white px-5 py-8 shadow-sm md:px-7 md:py-10">
              <div className="mb-8 flex flex-wrap items-center justify-center gap-2 text-center">
                <FlameIcon className="shrink-0" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C2410C]">
                  {clearance.headerText}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 md:gap-3">
                {[
                  { value: time.days, label: clearance.daysLabel },
                  { value: time.hours, label: clearance.hoursLabel },
                  { value: time.minutes, label: clearance.minutesLabel },
                  { value: time.seconds, label: clearance.secondsLabel },
                ].map((u) => (
                  <div
                    key={u.label}
                    className="flex flex-col items-center justify-center border border-neutral-200/60 bg-[#F5F0E8] px-1 py-4 md:py-5"
                  >
                    <span className="font-serif text-2xl tabular-nums text-[#1A1A1A] md:text-3xl">
                      {pad(u.value)}
                    </span>
                    <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1A1A1A]/50 md:text-[10px]">
                      {u.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid grid-cols-3 gap-3 md:gap-4">
                {clearance.products.map((p) => {
                  const dark = p.tileBg === "dark";
                  return (
                    <div key={p.name} className="text-center">
                      <div
                        className={`relative mb-3 aspect-square overflow-hidden ${
                          dark ? "bg-black" : "bg-[#F0EBE3]"
                        }`}
                      >
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 33vw, 180px"
                        />
                      </div>
                      <p className="text-[11px] font-medium leading-snug text-[#1A1A1A] md:text-xs">
                        {p.name}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-[#A67C37] md:text-xs">
                        {p.priceDisplay}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-center">
                <Link
                  href={clearance.viewAll.href}
                  className="inline-flex items-center justify-center border border-[#B8860B] bg-transparent px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B4F1E] transition hover:bg-[#B8860B]/10"
                >
                  {clearance.viewAll.text}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

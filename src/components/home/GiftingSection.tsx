"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import data from "@/data/contactDatas.json";

function GiftRibbonOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.42]"
      aria-hidden
    >
      <div className="absolute h-[145%] w-[3px] shrink-0 bg-[#B08D44]" />
      <div className="absolute h-[3px] w-[145%] shrink-0 bg-[#B08D44]" />
    </div>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 8v13" />
      <path d="M3 10h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
      <path d="M3 10V9a2 2 0 0 1 2-2h4c1.5 0 3 1 3 3s1.5-3 3-3h4a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export default function GiftingSection() {
  const s = data.giftingSection;
  const slides = s.featuredSlides;
  const [activeBudget, setActiveBudget] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);

  const slide = slides[slideIndex] ?? slides[0];
  const slideCount = slides.length;

  const nextSlide = () =>
    setSlideIndex((i) => (slideCount ? (i + 1) % slideCount : 0));
  const prevSlide = () =>
    setSlideIndex((i) =>
      slideCount ? (i - 1 + slideCount) % slideCount : 0
    );

  return (
    <section className="bg-[#FDFBF7] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-14">
          {/* Left column */}
          <div className="flex flex-col lg:col-span-7">
            <div className="mb-10 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <div className="mb-4 flex items-center gap-4">
                  <span
                    className="h-px w-10 shrink-0 bg-[#B08D44]"
                    aria-hidden
                  />
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#2A2018]/80">
                    {s.badge}
                  </p>
                </div>
                <h2 className="font-serif text-4xl font-light leading-tight tracking-tight text-[#1A1410] md:text-5xl">
                  {s.title}
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#1A1410]/55 md:text-base">
                  {s.subheading}
                </p>
              </div>
              <Link
                href={s.personalStylistLink.href}
                className="shrink-0 self-start text-[11px] font-medium uppercase tracking-[0.22em] text-[#1A1410] transition hover:text-[#B08D44] sm:pt-2"
              >
                {s.personalStylistLink.label}{" "}
                <span className="inline-block translate-y-px" aria-hidden>
                  ↗
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {s.budgetCards.map((card, index) => {
                const isActive = index === activeBudget;
                return (
                  <div
                    key={card.id}
                    role="button"
                    tabIndex={0}
                    suppressHydrationWarning
                    aria-pressed={isActive}
                    onClick={() => setActiveBudget(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveBudget(index);
                      }
                    }}
                    className={`group flex cursor-pointer flex-col border bg-white/60 p-4 text-left transition hover:border-[#B08D44]/60 ${
                      isActive
                        ? "border-[#B08D44] shadow-[0_0_0_1px_#B08D44]"
                        : "border-neutral-200/90"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="font-mono text-xs text-[#1A1410]/35">
                        {card.id}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200/80 text-[#1A1410]/45">
                        <GiftIcon className="text-[#1A1410]/50" />
                      </span>
                    </div>
                    <div className="relative mb-4 aspect-square overflow-hidden bg-[#F0EBE3]">
                      <Image
                        src={card.image}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      />
                      <GiftRibbonOverlay />
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#1A1410]/45">
                      {card.label}
                    </p>
                    <p className="mt-1 font-serif text-2xl text-[#1A1410] md:text-[1.65rem]">
                      {card.priceDisplay}
                    </p>
                    <p className="mt-2 text-xs leading-snug text-[#1A1410]/50">
                      {card.description}
                    </p>
                    <Link
                      href={card.exploreHref}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1A1410] transition group-hover:text-[#B08D44]"
                    >
                      EXPLORE{" "}
                      <span className="text-xs" aria-hidden>
                        ↗
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 lg:mt-14">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[#B08D44]">
                {s.occasionLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {s.occasions.map((occ) => (
                  <Link
                    key={occ.label}
                    href={occ.href}
                    className="rounded-full border border-neutral-300/90 bg-white/50 px-4 py-2 text-xs font-medium text-[#1A1410] transition hover:border-[#B08D44] hover:text-[#B08D44]"
                  >
                    {occ.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Featured column */}
          <div className="relative min-h-[420px] lg:col-span-5 lg:min-h-0">
            <div className="relative h-full min-h-[420px] overflow-hidden lg:absolute lg:inset-0 lg:min-h-[560px]">
              <Image
                key={slide.image}
                src={slide.image}
                alt=""
                fill
                className="object-cover object-top transition duration-700"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25"
                aria-hidden
              />

              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 lg:p-10">
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#B08D44]">
                  {slide.eyebrowGold}
                </p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/90">
                  {slide.eyebrowWhite}
                </p>
                <h3 className="mt-2 font-serif text-4xl font-light leading-[1.05] text-white md:text-5xl lg:text-[2.75rem]">
                  {slide.headline}
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85">
                  {slide.description}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href={slide.primaryCta.href}
                    className="inline-flex min-h-[44px] items-center justify-center bg-[#B08D44] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#9a7a3a]"
                  >
                    {slide.primaryCta.text}
                  </Link>
                  <Link
                    href={slide.secondaryCta.href}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-white/85 bg-transparent px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                      aria-hidden
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {slide.secondaryCta.text}
                  </Link>
                </div>
              </div>

              {slideCount > 1 ? (
                <div className="absolute bottom-6 right-6 flex gap-2 md:bottom-8 md:right-8">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={prevSlide}
                    aria-label="Previous feature"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
                  >
                    <span aria-hidden className="text-lg leading-none">
                      ←
                    </span>
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={nextSlide}
                    aria-label="Next feature"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
                  >
                    <span aria-hidden className="text-lg leading-none">
                      →
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

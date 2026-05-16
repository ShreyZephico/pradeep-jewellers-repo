"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import data from "@/data/contactDatas.json";

type CuratedTab = (typeof data.curatedSection.tabs)[number];
type CuratedProduct = (typeof data.curatedSection.products)[number];

export default function CuratedSection() {
  const section = data.curatedSection;
  const tabs = section.tabs as CuratedTab[];
  const products = section.products as CuratedProduct[];

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "new-arrivals");

  const visibleProducts = useMemo(
    () => products.filter((p) => p.category === activeTabId),
    [products, activeTabId]
  );

  return (
    <section className="bg-[#FAF9F6] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-8 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-center gap-4">
              <div className="h-px w-10 shrink-0 bg-[#2A2018]/70" />
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#2A2018]/80">
                {section.badge}
              </p>
            </div>
            <h2 className="font-serif text-4xl font-light tracking-tight text-[#1A1410] md:text-5xl lg:text-[2.75rem]">
              {section.title}
            </h2>
          </div>

          <nav
            className="flex flex-wrap gap-x-8 gap-y-3"
            aria-label="Curated product filters"
          >
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setActiveTabId(tab.id)}
                  className={`relative pb-3 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors ${
                    isActive
                      ? "text-[#1A1410]"
                      : "text-[#1A1410]/45 hover:text-[#1A1410]/70"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#1A1410] transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="group cursor-pointer"
            >
              <div className="relative mb-4 aspect-square overflow-hidden bg-[#EDE9E2]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />

                {product.tag ? (
                  <span className="absolute left-3 top-3 z-10 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1A1410]">
                    {product.tag}
                  </span>
                ) : null}

                <button
                  type="button"
                  suppressHydrationWarning
                  aria-label={`Add ${product.name} to wishlist`}
                  className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1A1410] shadow-sm transition hover:bg-[#faf9f6]"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.35"
                    aria-hidden
                  >
                    <path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10Z" />
                  </svg>
                </button>
              </div>

              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-[#1A1410]/55">
                {product.type}
              </p>
              <h3 className="font-serif text-lg leading-snug text-[#1A1410] md:text-xl">
                {product.name}
              </h3>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="font-serif text-base font-semibold text-[#1A1410] md:text-lg">
                  {product.priceDisplay}
                </p>
                <p className="text-[11px] font-normal text-[#1A1410]/45">
                  Making {product.makingCharges}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 flex justify-center md:mt-16">
          <Link
            href={section.buttonLink}
            className="inline-flex min-w-[min(100%,20rem)] items-center justify-center gap-2 border border-[#C4A574]/90 bg-transparent px-10 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-[#2A2018] transition hover:border-[#2A2018] hover:bg-[#2A2018] hover:text-[#FAF9F6]"
          >
            {section.buttonText}
            <span className="text-sm leading-none" aria-hidden>
              ↗
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

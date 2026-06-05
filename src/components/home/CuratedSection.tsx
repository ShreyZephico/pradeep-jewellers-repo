"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import data from "@/data/contactDatas.json";
import { useHomeCatalogProducts } from "@/hooks/useHomeCatalogProducts";
import {
  filterProductsForCuratedTab,
  formatMakingChargeLabel,
  productCardBadge,
  productTypeLabel,
} from "@/lib/curatedProducts";
import { productLinkWarmHandlers } from "@/lib/productDetailNavigation";
import { getProductHref } from "@/utils/productUrl";

import "./css/curated.css";

type CuratedTab = (typeof data.curatedSection.tabs)[number];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="curated-section__skeleton"
      style={{ "--skeleton-index": index } as CSSProperties}
      aria-hidden
    >
      <div className="curated-section__skeleton-media" />
      <div className="curated-section__skeleton-line curated-section__skeleton-line--short" />
      <div className="curated-section__skeleton-line curated-section__skeleton-line--title" />
      <div className="curated-section__skeleton-line curated-section__skeleton-line--meta" />
    </div>
  );
}

export default function CuratedSection() {
  const section = data.curatedSection;
  const tabs = section.tabs as CuratedTab[];
  const limitPerTab = section.productLimitPerTab ?? 6;

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "new-arrivals");
  const { products, loading, error } = useHomeCatalogProducts();

  const visibleProducts = useMemo(
    () => filterProductsForCuratedTab(products, activeTabId, limitPerTab),
    [products, activeTabId, limitPerTab]
  );

  return (
    <section className="curated-section" aria-labelledby="curated-section-heading">
      <div className="curated-section__inner">
        <header className="curated-section__header">
          <div className="curated-section__header-main">
            <div className="curated-section__badge-row">
              <span className="curated-section__badge-line" aria-hidden />
              <p className="curated-section__badge">{section.badge}</p>
            </div>
            <h2 id="curated-section-heading" className="curated-section__title">
              {section.title}
            </h2>
          </div>

          <nav className="curated-section__tabs" aria-label="Curated product filters">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setActiveTabId(tab.id)}
                  className={`curated-section__tab${isActive ? " curated-section__tab--active" : ""}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {tab.label}
                  <span className="curated-section__tab-indicator" aria-hidden />
                </button>
              );
            })}
          </nav>
        </header>

        {error ? (
          <p className="curated-section__message" role="alert">
            {error}
          </p>
        ) : null}

        <div key={activeTabId} className="curated-section__grid" role="list">
          {loading
            ? Array.from({ length: limitPerTab }).map((_, i) => (
                <ProductCardSkeleton key={`sk-${i}`} index={i} />
              ))
            : visibleProducts.map((product, index) => {
                const badge = productCardBadge(product);
                const makingLabel = formatMakingChargeLabel(product);

                const warm = productLinkWarmHandlers(product);

                return (
                  <Link
                    key={product.id}
                    href={getProductHref(product)}
                    className="curated-section__card"
                    role="listitem"
                    style={{ "--card-index": index } as CSSProperties}
                    {...warm}
                  >
                    <div className="curated-section__card-media">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        className="curated-section__card-image"
                      />

                      {badge ? (
                        <span className="curated-section__card-tag">{badge}</span>
                      ) : null}
                    </div>

                    <p className="curated-section__card-type">
                      {productTypeLabel(product)}
                    </p>
                    <h3 className="curated-section__card-title">{product.name}</h3>
                    <div className="curated-section__card-meta">
                      <p className="curated-section__card-price">
                        {formatPrice(product.price)}
                      </p>
                      {makingLabel ? (
                        <p className="curated-section__card-making">
                          Making {makingLabel}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
        </div>

        {!loading && !error && visibleProducts.length === 0 ? (
          <p className="curated-section__message">{section.emptyMessage}</p>
        ) : null}

        <div className="curated-section__cta-wrap">
          <Link href={section.buttonLink} className="curated-section__cta">
            {section.buttonText}
            <span className="curated-section__cta-arrow" aria-hidden>
              ↗
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

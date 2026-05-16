"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types/product";
import { getProductHref } from "@/utils/productUrl";
import styles from "./css/BestSellerSection.module.css";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function BestSellerSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "4",
          category: "all",
        });
        const response = await fetch(`/api/products?${params.toString()}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load products");
        }

        if (!cancelled) {
          setFeaturedProducts((data.products as Product[]) ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : "Could not load products");
          setFeaturedProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} id="featured-products" className={styles.section}>
      {/* Background */}
      <div className={styles.bgElements}>
        <div className={styles.goldDust} />
        <div className={styles.diamondSparkles} />
        <div className={styles.luxuryPattern} />
        <div className={styles.marbleTexture} />
        <div className={styles.goldLinePattern} />
        <div className={styles.floatingDiamonds} />
      </div>

      <div className={styles.container}>
        <div className={`${styles.header} ${isVisible ? styles.visible : ""}`}>
          <div className={styles.headerContent}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowLine}></span>
              Featured Products
              <span className={styles.eyebrowLine}></span>
            </p>

            <h2 className={styles.title}>
              Best-Selling Favourites
              <span className={styles.goldText}> From The Studio</span>
            </h2>

            <p className={styles.description}>
              Discover our most loved pieces, crafted with precision and passion.
              Each design tells a story of timeless elegance.
            </p>

            <div className={styles.headerAccent} />
          </div>
        </div>

        {fetchError ? (
          <p className="mx-auto max-w-xl px-4 py-8 text-center text-sm text-[#765f4a]">
            {fetchError}
          </p>
        ) : null}

        <div className={`${styles.grid} ${isVisible ? styles.visible : ""}`}>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`sk-${index}`}
                  className={styles.card}
                  aria-hidden
                  style={{
                    animationDelay: `${(index * 0.1).toFixed(1)}s`,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    className={styles.imageWrap}
                    style={{ background: "linear-gradient(90deg, #f4e7d7 0%, #efe0cf 50%, #f4e7d7 100%)" }}
                  />
                  <div className={styles.body}>
                    <div
                      className="mt-1 h-4 rounded bg-[#eadcc8]/80"
                      style={{ width: "75%" }}
                    />
                    <div className="mt-3 h-3 w-full rounded bg-[#eadcc8]/60" />
                    <div
                      className="mt-2 h-3 rounded bg-[#eadcc8]/40"
                      style={{ width: "83%" }}
                    />
                  </div>
                </div>
              ))
            : featuredProducts.map((product, index) => {
                const delay = (index * 0.1).toFixed(1);
                const list = product.compareAtPrice ?? 0;

                return (
                  <Link
                    key={product.id}
                    href={getProductHref(product)}
                    className={styles.card}
                    style={{ animationDelay: `${delay}s` }}
                  >
                    <div className={styles.imageWrap}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />

                      <div className={styles.imageOverlay} />

                      {product.badge ? (
                        <span className={styles.badge}>{product.badge}</span>
                      ) : null}

                      <div className={styles.quickView}>
                        <span suppressHydrationWarning className={styles.quickViewBtn}>
                          View product
                        </span>
                      </div>
                    </div>

                    <div className={styles.body}>
                      <p className={styles.productType}>
                        <span className={styles.typeDot}></span>
                        Fine Jewellery
                      </p>

                      <h3 className={styles.productName}>{product.name}</h3>

                      <p className={styles.copy}>{product.description}</p>

                      <div className={styles.priceRow}>
                        <strong className={styles.currentPrice}>
                          {formatPrice(product.price)}
                        </strong>

                        {list > product.price ? (
                          <span className={styles.originalPrice}>
                            {formatPrice(list)}
                          </span>
                        ) : null}
                      </div>

                      <span className={styles.action}>
                        View details
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                );
              })}
        </div>

        {!loading && featuredProducts.length === 0 && !fetchError ? (
          <p className="mx-auto max-w-xl px-4 py-8 text-center text-sm text-[#765f4a]">
            No products to show yet. Check back soon.
          </p>
        ) : null}
      </div>
    </section>
  );
}

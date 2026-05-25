"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { CSSProperties } from "react";

import data from "@/data/contactDatas.json";
import { useHomeDataRefetch } from "@/hooks/useHomeDataRefetch";
import type { Product } from "@/types/product";
import { getProductHref } from "@/utils/productUrl";

import "./css/featured-products.css";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="featured-section__skeleton"
      style={{ "--skeleton-index": index } as CSSProperties}
      aria-hidden
    >
      <div className="featured-section__skeleton-media" />
      <div className="featured-section__skeleton-line featured-section__skeleton-line--short" />
      <div className="featured-section__skeleton-line featured-section__skeleton-line--title" />
      <div className="featured-section__skeleton-line featured-section__skeleton-line--desc" />
    </div>
  );
}

export default function FeaturedProductsSection() {
  const s = data.featuredProductsSection;
  const limit = s.productLimit ?? 4;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(limit),
        category: "all",
      });
      const res = await fetch(`/api/products?${params.toString()}`, {
        credentials: "omit",
        cache: "no-store",
      });
      const json = (await res.json()) as {
        success?: boolean;
        products?: Product[];
        error?: string;
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? s.errorMessage);
      }

      setProducts(json.products ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : s.errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [limit, s.errorMessage]);

  useHomeDataRefetch(loadProducts);

  return (
    <section
      id="featured-products"
      className="featured-section"
      aria-labelledby="featured-products-heading"
    >
      <div className="featured-section__inner">
        <header className="featured-section__header">
          <div className="featured-section__header-main">
            <div className="featured-section__badge-row">
              <span className="featured-section__badge-line" aria-hidden />
              <p className="featured-section__badge">{s.badge}</p>
            </div>
            <h2
              id="featured-products-heading"
              className="featured-section__title"
            >
              {s.title}
            </h2>
            <p className="featured-section__description">{s.description}</p>
          </div>

          <Link href={s.buttonLink} className="featured-section__cta">
            {s.buttonText}
            <span className="featured-section__cta-arrow" aria-hidden>
              ↗
            </span>
          </Link>
        </header>

        {error ? (
          <p className="featured-section__message" role="alert">
            {error}
          </p>
        ) : null}

        <div
          className={`featured-section__grid${
            loading
              ? " featured-section__grid--skeleton"
              : " featured-section__grid--ready"
          }`}
        >
          {loading
            ? Array.from({ length: limit }).map((_, i) => (
                <ProductCardSkeleton key={`sk-${i}`} index={i} />
              ))
            : products.map((product, index) => {
                const list = product.compareAtPrice ?? 0;
                const typeLabel =
                  product.productType?.trim() || "Fine Jewellery";

                return (
                  <Link
                    key={product.id}
                    href={getProductHref(product)}
                    className="featured-section__card"
                    style={{ "--card-index": index } as CSSProperties}
                  >
                    <div className="featured-section__card-media">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="featured-section__card-image"
                      />
                      {product.badge ? (
                        <span className="featured-section__card-badge">
                          {product.badge}
                        </span>
                      ) : null}
                      <span className="featured-section__card-overlay">
                        <span className="featured-section__card-overlay-label">
                          View product
                        </span>
                      </span>
                    </div>

                    <p className="featured-section__card-type">{typeLabel}</p>
                    <h3 className="featured-section__card-title">
                      {product.name}
                    </h3>
                    {product.shortDescription || product.description ? (
                      <p className="featured-section__card-description">
                        {product.shortDescription ?? product.description}
                      </p>
                    ) : null}
                    <div className="featured-section__card-price-row">
                      <p className="featured-section__card-price">
                        {formatPrice(product.price)}
                      </p>
                      {list > product.price ? (
                        <p className="featured-section__card-compare-price">
                          {formatPrice(list)}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
        </div>

        {!loading && !error && products.length === 0 ? (
          <p className="featured-section__message">{s.emptyMessage}</p>
        ) : null}
      </div>
    </section>
  );
}

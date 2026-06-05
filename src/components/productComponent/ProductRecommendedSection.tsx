"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";

import RecommendedProductCard from "@/components/productComponent/RecommendedProductCard";
import RecommendedProductCardSkeleton from "@/components/productComponent/RecommendedProductCardSkeleton";
import {
  inferProductCategoryId,
  isSameCatalogProduct,
} from "@/lib/productRecommendations";
import productContent, { formatProductCopy } from "@/lib/productContent";
import type { Product } from "@/types/product";

const copy = productContent.detail.recommended;
const DESKTOP_LIMIT = copy.limit ?? 10;
const MOBILE_LIMIT = copy.limitMobile ?? 20;
const MOBILE_ROW_SIZE = 10;
const MOBILE_MEDIA = "(max-width: 899px)";

function readRecommendedLimit(): number {
  if (typeof window === "undefined") {
    return DESKTOP_LIMIT;
  }
  return window.matchMedia(MOBILE_MEDIA).matches ? MOBILE_LIMIT : DESKTOP_LIMIT;
}

function useRecommendedFetchLimit(): number {
  const [limit, setLimit] = useState(readRecommendedLimit);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MEDIA);
    const apply = () => setLimit(media.matches ? MOBILE_LIMIT : DESKTOP_LIMIT);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return limit;
}

type ProductRecommendedSectionProps = {
  slug: string;
  product: Product;
};

type RenderCardOptions = {
  items: Product[];
  loading: boolean;
  skeletonCount: number;
  keyPrefix: string;
  imageErrors: Record<string, boolean>;
  onImageError: (id: string) => void;
};

function RecommendedCardList({
  items,
  loading,
  skeletonCount,
  keyPrefix,
  imageErrors,
  onImageError,
}: RenderCardOptions) {
  if (loading) {
    return (
      <>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <li key={`${keyPrefix}-sk-${index}`} className="product-recommended__item">
            <RecommendedProductCardSkeleton index={index} />
          </li>
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((item, index) => (
        <li
          key={item.id}
          className="product-recommended__item"
          style={{ animationDelay: `${index * 0.04}s` }}
        >
          <RecommendedProductCard
            product={item}
            imageSrc={
              imageErrors[item.id]
                ? "/placeholder.jpg"
                : item.image || item.images?.[0] || "/placeholder.jpg"
            }
            onImageError={() => onImageError(item.id)}
          />
        </li>
      ))}
    </>
  );
}

export default function ProductRecommendedSection({
  slug,
  product,
}: ProductRecommendedSectionProps) {
  const fetchLimit = useRecommendedFetchLimit();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { ref: sectionRef, inView } = useInView({
    rootMargin: "200px 0px",
    triggerOnce: true,
  });

  const loadRecommended = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        slug,
        limit: String(fetchLimit),
      });
      const response = await fetch(`/api/products/recommended?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || copy.error);
      }

      const incoming = (data.products as Product[] | undefined) ?? [];
      setProducts(incoming.filter((item) => !isSameCatalogProduct(product, item)));
      setImageErrors({});
    } catch (e) {
      setProducts([]);
      setError(e instanceof Error ? e.message : copy.error);
    } finally {
      setLoading(false);
    }
  }, [slug, product, fetchLimit]);

  useEffect(() => {
    if (!inView) return;
    void loadRecommended();
  }, [inView, loadRecommended]);

  if (!loading && !error && products.length === 0) {
    return null;
  }

  const sourceCategory = inferProductCategoryId(product);
  const categoryLabel =
    sourceCategory && copy.categoryLabels
      ? (copy.categoryLabels as Record<string, string>)[sourceCategory]
      : null;
  const subtitle =
    categoryLabel && copy.subtitleTemplate
      ? formatProductCopy(copy.subtitleTemplate, {
          category: categoryLabel,
          categoryLower: categoryLabel.toLowerCase(),
        })
      : copy.subtitle;

  const isMobileLayout = fetchLimit > DESKTOP_LIMIT;
  const mobileRow1 = products.slice(0, MOBILE_ROW_SIZE);
  const mobileRow2 = products.slice(MOBILE_ROW_SIZE, MOBILE_LIMIT);
  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const cardListProps = {
    loading,
    imageErrors,
    onImageError: handleImageError,
  };

  return (
    <section
      ref={sectionRef}
      className="product-recommended"
      aria-labelledby="product-recommended-heading"
    >
      <div className="product-recommended__header">
        <h2 id="product-recommended-heading" className="product-recommended__title">
          {copy.title}
        </h2>
        {subtitle ? <p className="product-recommended__subtitle">{subtitle}</p> : null}
      </div>

      {error ? (
        <p className="product-recommended__message" role="alert">
          {error}{" "}
          <button
            type="button"
            className="product-recommended__retry"
            onClick={() => void loadRecommended()}
          >
            {copy.retry}
          </button>
        </p>
      ) : null}

      {isMobileLayout ? (
        <div
          className={`product-recommended__rows${
            loading ? " product-recommended__rows--loading" : ""
          }`}
          aria-busy={loading}
        >
          <div
            className="product-recommended__row-scroll"
            aria-label={`${copy.title} — row 1`}
          >
            <ul className="product-recommended__track product-recommended__track--row">
              <RecommendedCardList
                {...cardListProps}
                items={mobileRow1}
                skeletonCount={MOBILE_ROW_SIZE}
                keyPrefix="row1"
              />
            </ul>
          </div>
          <div
            className="product-recommended__row-scroll"
            aria-label={`${copy.title} — row 2`}
          >
            <ul className="product-recommended__track product-recommended__track--row">
              <RecommendedCardList
                {...cardListProps}
                items={mobileRow2}
                skeletonCount={MOBILE_ROW_SIZE}
                keyPrefix="row2"
              />
            </ul>
          </div>
        </div>
      ) : (
        <div
          className={`product-recommended__scroller product-recommended__scroller--desktop${
            loading ? " product-recommended__scroller--loading" : ""
          }`}
          aria-busy={loading}
        >
          <ul
            className="product-recommended__track product-recommended__track--desktop"
            style={{ "--rec-columns": 5 } as CSSProperties}
          >
            <RecommendedCardList
              {...cardListProps}
              items={products}
              skeletonCount={DESKTOP_LIMIT}
              keyPrefix="desktop"
            />
          </ul>
        </div>
      )}

      {!loading && products.length > 0 && copy.shopLink ? (
        <div className="product-recommended__footer">
          <Link href="/products" className="product-recommended__shop-link">
            {copy.shopLink}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

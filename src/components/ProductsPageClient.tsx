'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/types/product';
import ProductListCard from '@/components/ProductListCard';
import productContent, { formatProductCopy } from '@/lib/productContent';

const PAGE_SIZE = 10;
const copy = productContent.list;
const breadcrumb = productContent.breadcrumb;
const categories = productContent.categories;

/** Compact page list with ellipsis for the pager (UI only). */
function getPaginationSegments(
  current: number,
  last: number
): Array<number | 'ellipsis'> {
  if (last <= 1) return [];
  if (last <= 9) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const segments: Array<number | 'ellipsis'> = [];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(last - 1, current + 1);

  segments.push(1);
  if (windowStart > 2) {
    segments.push('ellipsis');
  }
  for (let p = windowStart; p <= windowEnd; p++) {
    segments.push(p);
  }
  if (windowEnd < last - 1) {
    segments.push('ellipsis');
  }
  segments.push(last);
  return segments;
}

export default function ProductsPageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const prevDebouncedRef = useRef(debouncedQ);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(page);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(searchTerm.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (prevDebouncedRef.current !== debouncedQ) {
      prevDebouncedRef.current = debouncedQ;
      setPage(1);
    }
  }, [debouncedQ]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        category: selectedCategory,
      });
      if (debouncedQ) {
        params.set('q', debouncedQ);
      }
      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load products');
      }

      setProducts(data.products ?? []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
      setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error. Please try again.');
      setProducts([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, debouncedQ]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (prevPageRef.current === page) {
      return;
    }
    prevPageRef.current = page;
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const handleImageError = (productId: string) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  const getProductImage = (product: Product) => {
    if (imageErrors[product.id]) {
      return '/placeholder.jpg';
    }
    return product.image || '/placeholder.jpg';
  };

  const selectCategory = (id: string) => {
    setSelectedCategory(id);
    setPage(1);
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);
  const displayTotalPages =
    total > 0 ? Math.max(totalPages, Math.ceil(total / PAGE_SIZE)) : 0;
  const paginationSegments = getPaginationSegments(page, displayTotalPages);
  const canPrev = page > 1 && !loading;
  const canNext = displayTotalPages > 0 && page < displayTotalPages && !loading;

  if (error && products.length === 0 && !loading) {
    return (
      <div className="product-page product-state-center">
        <div className="product-state-card">
          <div className="product-list-empty-icon" aria-hidden>
            ⚠
          </div>
          <h2>{copy.errorTitle}</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setError('');
              void loadProducts();
            }}
            className="product-btn-primary"
          >
            {copy.errorRetry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      <div className="product-list-bg" aria-hidden />

      <div className="product-breadcrumb-bar">
        <nav className="product-container product-breadcrumb" aria-label="Breadcrumb">
          <Link href="/landing#home">{breadcrumb.home}</Link>
          <span className="product-breadcrumb-sep" aria-hidden>
            {breadcrumb.separator}
          </span>
          <span className="product-breadcrumb-current">{breadcrumb.shop}</span>
        </nav>
      </div>

      <section className="product-list-hero">
        <div className="product-list-hero-glow-a" aria-hidden />
        <div className="product-list-hero-glow-b" aria-hidden />
        <div className="product-container product-list-hero-inner">
          <p className="product-list-hero-eyebrow">{copy.heroEyebrow}</p>
          <h1 className="product-item-title product-list-hero-title">{copy.heroTitle}</h1>
          <p className="product-list-hero-desc">{copy.heroDescription}</p>
          <div className="product-list-badges">
            <span className="product-list-badge">
              {formatProductCopy(copy.badges.designs, { count: total })}
            </span>
            <span className="product-list-badge">{copy.badges.secureCheckout}</span>
            <span className="product-list-badge product-list-badge--dark">
              {copy.badges.personal}
            </span>
          </div>
        </div>
      </section>

      <div className="product-container product-list-content">
        <div className="product-list-toolbar">
          <div className="product-list-toolbar-row">
            <div className="product-list-search-wrap">
              <label htmlFor="product-search" className="sr-only">
                {copy.searchLabel}
              </label>
              <input
                id="product-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="product-list-search"
              />
              <svg
                className="product-list-search-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="product-list-categories">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className={`product-list-category-btn${
                    selectedCategory === cat.id ? " product-list-category-btn--active" : ""
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="product-list-meta">
            <p>
              {total === 0 ? (
                <>{copy.noPiecesInView}</>
              ) : (
                <>
                  {copy.showingPrefix}{" "}
                  <strong>
                    {rangeStart}–{rangeEnd}
                  </strong>{" "}
                  {copy.showingOf} <strong>{total}</strong> {copy.showingPieces}
                  {displayTotalPages > 1 ? (
                    <>
                      {" "}
                      · {copy.pageLabel} <strong>{page}</strong> {copy.pageOf}{" "}
                      <strong>{displayTotalPages}</strong>
                    </>
                  ) : null}
                </>
              )}
            </p>
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setPage(1);
                }}
                className="product-list-clear-search"
              >
                {copy.clearSearch}
              </button>
            ) : null}
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="product-state-center">
            <div className="product-spinner" aria-hidden />
            <p>{copy.loading}</p>
          </div>
        ) : null}

        {!loading && total === 0 ? (
          <div className="product-list-empty">
            <div className="product-list-empty-icon" aria-hidden>
              {copy.placeholderSymbol}
            </div>
            <h3 className="product-list-empty-title">{copy.emptyTitle}</h3>
            <p className="product-list-empty-desc">{copy.emptyDescription}</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setPage(1);
              }}
              className="product-btn-primary"
            >
              {copy.viewAll}
            </button>
          </div>
        ) : null}

        {!loading && products.length > 0 ? (
          <>
            <div ref={gridTopRef} className="product-list-grid-anchor">
            <ul className="product-list-grid">
              {products.map((product, index) => (
                <li key={product.id}>
                  <ProductListCard
                    product={product}
                    imageSrc={getProductImage(product)}
                    onImageError={() => handleImageError(product.id)}
                    animationIndex={index}
                  />
                </li>
              ))}
            </ul>

            {displayTotalPages > 1 ? (
              <nav className="product-list-pagination" aria-label={copy.paginationLabel}>
                <div className="product-list-pagination-inner">
                  <div className="product-list-page-nav">
                    <button
                      type="button"
                      disabled={!canPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="product-list-page-btn"
                    >
                      {copy.prev}
                    </button>
                    <button
                      type="button"
                      disabled={!canNext}
                      onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))}
                      className="product-list-page-btn"
                    >
                      {copy.next}
                    </button>
                  </div>

                  <div className="product-list-page-numbers" role="group" aria-label={copy.pageNumbersLabel}>
                    {paginationSegments.map((item, i) =>
                      item === "ellipsis" ? (
                        <span key={`ellipsis-${i}`} className="product-list-page-ellipsis" aria-hidden>
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          disabled={loading}
                          onClick={() => setPage(item)}
                          aria-current={item === page ? "page" : undefined}
                          className={`product-list-page-num${
                            item === page ? " product-list-page-num--active" : ""
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>

                  <p className="product-list-page-summary">
                    <strong>
                      {rangeStart}–{rangeEnd}
                    </strong>{" "}
                    {copy.showingOf} {total}
                    <span aria-hidden> · </span>
                    {copy.pageLabel} {page} / {displayTotalPages}
                  </p>
                </div>
              </nav>
            ) : null}
            </div>
          </>
        ) : null}

        {loading && products.length > 0 ? (
          <div className="product-list-toast" aria-live="polite">
            {copy.loadingMore}
          </div>
        ) : null}
      </div>
    </div>
  );
}

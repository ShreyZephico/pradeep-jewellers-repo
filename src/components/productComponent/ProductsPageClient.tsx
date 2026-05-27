'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

import type { Product } from '@/types/product';
import CollectionProductCard from "@/components/productComponent/CollectionProductCard";
import ProductsFilterSidebar from "@/components/productComponent/ProductsFilterSidebar";
import productContent from '@/lib/productContent';
import type { ProductSort } from '@/lib/productFilters';
import { priceTierToRange } from '@/lib/productFilters';

const PAGE_SIZE = 12;
const FETCH_TIMEOUT_MS = 25_000;
const copy = productContent.list;
const priceTiers = productContent.priceTiers;

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'featured', label: copy.sortFeatured },
  { value: 'price-asc', label: copy.sortPriceAsc },
  { value: 'price-desc', label: copy.sortPriceDesc },
  { value: 'name-asc', label: copy.sortNameAsc },
  { value: 'name-desc', label: copy.sortNameDesc },
];

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

type ProductsPageClientProps = {
  initialQuery?: string;
  /** Bumped after checkout (bfcache return) to refetch without remounting the tree. */
  refreshToken?: number;
};

export default function ProductsPageClient({
  initialQuery = '',
  refreshToken = 0,
}: ProductsPageClientProps) {
  const urlQuery = initialQuery.trim();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [debouncedQ, setDebouncedQ] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceTier, setSelectedPriceTier] = useState('any');
  const [sort, setSort] = useState<ProductSort>('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const priceRange = useMemo(
    () => priceTierToRange(selectedPriceTier, priceTiers),
    [selectedPriceTier]
  );

  const [retryCount, setRetryCount] = useState(0);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(page);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedPriceTier !== 'any' ||
    sort !== 'featured' ||
    Boolean(searchTerm.trim());

  // Keep list search in sync with ?q= from the server (header search, back/forward).
  useEffect(() => {
    setSearchTerm((prev) => (prev === urlQuery ? prev : urlQuery));
    setDebouncedQ((prev) => (prev === urlQuery ? prev : urlQuery));
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [urlQuery]);

  // Debounce only when the user types in the collection search box.
  useEffect(() => {
    if (searchTerm.trim() === urlQuery) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedQ(searchTerm.trim());
      setPage(1);
      setSelectedPriceTier('any');
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchTerm, urlQuery]);

  useEffect(() => {
    setSelectedPriceTier('any');
  }, [selectedCategory]);

  // One fetch pipeline — avoids competing loadProducts() calls that abort each other.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const run = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          category: selectedCategory,
          sort,
        });
        if (debouncedQ) {
          params.set('q', debouncedQ);
        }
        if (priceRange.min != null) {
          params.set('minPrice', String(priceRange.min));
        }
        if (priceRange.max != null) {
          params.set('maxPrice', String(priceRange.max));
        }

        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = await response.json();

        if (!active) {
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load products');
        }

        setProducts(data.products ?? []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
        setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 0);
      } catch (e) {
        if (!active) {
          return;
        }
        if (e instanceof Error && e.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(
            e instanceof Error ? e.message : 'Network error. Please try again.'
          );
        }
        setProducts([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        window.clearTimeout(timeoutId);
        if (active) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    page,
    selectedCategory,
    debouncedQ,
    sort,
    priceRange.min,
    priceRange.max,
    retryCount,
    refreshToken,
  ]);

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
    setFiltersOpen(false);
  };

  const handlePriceTierChange = (id: string) => {
    setSelectedPriceTier(id);
    setPage(1);
  };

  const handleSortChange = (next: ProductSort) => {
    setSort(next);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDebouncedQ('');
    setSelectedCategory('all');
    setSelectedPriceTier('any');
    setSort('featured');
    setPage(1);
    setFiltersOpen(false);
  };

  const displayTotalPages =
    total > 0 ? Math.max(totalPages, Math.ceil(total / PAGE_SIZE)) : 0;
  const paginationSegments = getPaginationSegments(page, displayTotalPages);
  const canPrev = page > 1 && !loading;
  const canNext = displayTotalPages > 0 && page < displayTotalPages && !loading;

  if (error && products.length === 0 && !loading) {
    return (
      <div className="product-page product-page--collection product-state-center">
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
              setRetryCount((count) => count + 1);
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
    <div className="product-page product-page--collection">
      <div className="collection-wrap">
        <header className="collection-header">
          <div className="collection-header-intro">
            <div className="collection-eyebrow">
              <span className="collection-eyebrow-line" aria-hidden />
              <span className="collection-eyebrow-text">{copy.collectionLabel}</span>
            </div>
            <h1 className="collection-title">{copy.heroTitle}</h1>
            <p className="collection-subtitle">{copy.heroDescription}</p>
          </div>

          <div className="collection-header-tools">
            <label className="collection-search" htmlFor="collection-search">
              <Search size={18} className="collection-search-icon" aria-hidden />
              <input
                id="collection-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={copy.searchPlaceholderCollection}
                className="collection-search-input"
              />
            </label>

            <label className="collection-sort">
              <span className="sr-only">{copy.sortTitle}</span>
              <select
                className="collection-sort-select"
                value={sort}
                onChange={(event) => handleSortChange(event.target.value as ProductSort)}
                aria-label={copy.sortTitle}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="collection-sort-chevron" aria-hidden />
            </label>
          </div>
        </header>

        <div className="collection-body">
          <ProductsFilterSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={selectCategory}
            selectedPriceTier={selectedPriceTier}
            onPriceTierChange={handlePriceTierChange}
            onClearAll={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            mobileOpen={filtersOpen}
            onMobileOpenChange={setFiltersOpen}
          />

          <main className="collection-main">
            <p className="collection-count" ref={gridTopRef}>
              {loading && products.length === 0 ? (
                copy.loading
              ) : total === 0 ? (
                copy.noPiecesInView
              ) : (
                <>
                  {copy.showingPrefix}{' '}
                  <strong>{total}</strong> {copy.showingPieces}
                </>
              )}
            </p>

            {loading && products.length === 0 ? (
              <div className="collection-loading">
                <div className="product-spinner" aria-hidden />
              </div>
            ) : null}

            {!loading && total === 0 ? (
              <div className="collection-empty">
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptyDescription}</p>
                <button type="button" className="collection-empty-btn" onClick={clearAllFilters}>
                  {copy.viewAll}
                </button>
              </div>
            ) : null}

            {!loading && products.length > 0 ? (
              <>
                <ul className="collection-grid">
                  {products.map((product) => (
                    <li key={product.id}>
                      <CollectionProductCard
                        product={product}
                        imageSrc={getProductImage(product)}
                        onImageError={() => handleImageError(product.id)}
                      />
                    </li>
                  ))}
                </ul>

                {displayTotalPages > 1 ? (
                  <nav className="collection-pagination" aria-label={copy.paginationLabel}>
                    <button
                      type="button"
                      disabled={!canPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="collection-page-btn"
                    >
                      {copy.prev}
                    </button>
                    <div className="collection-page-nums" role="group">
                      {paginationSegments.map((item, i) =>
                        item === 'ellipsis' ? (
                          <span key={`e-${i}`} className="collection-page-ellipsis" aria-hidden>
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            disabled={loading}
                            onClick={() => setPage(item)}
                            aria-current={item === page ? 'page' : undefined}
                            className={`collection-page-num${
                              item === page ? ' collection-page-num--active' : ''
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!canNext}
                      onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))}
                      className="collection-page-btn"
                    >
                      {copy.next}
                    </button>
                  </nav>
                ) : null}
              </>
            ) : null}

            {loading && products.length > 0 ? (
              <p className="collection-loading-more" aria-live="polite">
                {copy.loadingMore}
              </p>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

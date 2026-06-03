'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';

import type { Product } from '@/types/product';
import CollectionProductCard from "@/components/productComponent/CollectionProductCard";
import CollectionProductCardSkeleton from "@/components/productComponent/CollectionProductCardSkeleton";
import ProductsFilterSidebar from "@/components/productComponent/ProductsFilterSidebar";
import { isValidCategoryNavId } from '@/lib/categoryNav';
import productContent from '@/lib/productContent';
import type { ProductSort } from '@/lib/productFilters';
import { priceTierToRange } from '@/lib/productFilters';

const PAGE_SIZE = 12;
const FETCH_TIMEOUT_MS = 25_000;
const SKELETON_COUNT = PAGE_SIZE;
const copy = productContent.list;
const priceTiers = productContent.priceTiers;

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'featured', label: copy.sortFeatured },
  { value: 'price-asc', label: copy.sortPriceAsc },
  { value: 'price-desc', label: copy.sortPriceDesc },
  { value: 'name-asc', label: copy.sortNameAsc },
  { value: 'name-desc', label: copy.sortNameDesc },
];

type ProductsPageClientProps = {
  initialQuery?: string;
  initialCategory?: string;
  initialPriceTier?: string;
  /** Bumped after checkout (bfcache return) to refetch without remounting the tree. */
  refreshToken?: number;
};

const LEGACY_CATEGORY_IDS = new Set([
  'gold',
  'diamond',
  'silver',
  'gemstone',
  'rings',
  'necklaces',
  'earrings',
  'bracelets',
]);

function normalizeCategoryId(raw: string): string {
  const id = raw.trim().toLowerCase();
  if (!id || id === 'all') return 'all';
  if (isValidCategoryNavId(id) || LEGACY_CATEGORY_IDS.has(id)) return id;
  return 'all';
}

function normalizePriceTierId(raw: string): string {
  const id = raw.trim();
  if (!id) return 'any';
  return priceTiers.some((tier) => tier.id === id) ? id : 'any';
}

function mergeProducts(prev: Product[], incoming: Product[]): Product[] {
  if (incoming.length === 0) return prev;
  const ids = new Set(prev.map((p) => p.id));
  const next = [...prev];
  for (const product of incoming) {
    if (!ids.has(product.id)) {
      ids.add(product.id);
      next.push(product);
    }
  }
  return next;
}

export default function ProductsPageClient({
  initialQuery = '',
  initialCategory = '',
  initialPriceTier = '',
  refreshToken = 0,
}: ProductsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = initialQuery.trim();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [debouncedQ, setDebouncedQ] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState(() =>
    normalizeCategoryId(initialCategory)
  );
  const [selectedPriceTier, setSelectedPriceTier] = useState(() =>
    normalizePriceTierId(initialPriceTier)
  );
  const [sort, setSort] = useState<ProductSort>('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const priceRange = useMemo(
    () => priceTierToRange(selectedPriceTier, priceTiers),
    [selectedPriceTier]
  );

  const [retryCount, setRetryCount] = useState(0);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const fetchGenRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedPriceTier !== 'any' ||
    sort !== 'featured' ||
    Boolean(searchTerm.trim());

  const syncListUrl = useCallback(
    (next: { category: string; price: string; q: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.q) params.set('q', next.q);
      else params.delete('q');
      if (next.category && next.category !== 'all') {
        params.set('category', next.category);
      } else {
        params.delete('category');
      }
      if (next.price && next.price !== 'any') {
        params.set('price', next.price);
      } else {
        params.delete('price');
      }
      const qs = params.toString();
      router.replace(qs ? `/products?${qs}` : '/products', { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    setSearchTerm((prev) => (prev === urlQuery ? prev : urlQuery));
    setDebouncedQ((prev) => (prev === urlQuery ? prev : urlQuery));
    pageRef.current = 1;
  }, [urlQuery]);

  useEffect(() => {
    setSelectedCategory(normalizeCategoryId(initialCategory));
    pageRef.current = 1;
  }, [initialCategory]);

  useEffect(() => {
    setSelectedPriceTier(normalizePriceTierId(initialPriceTier));
    pageRef.current = 1;
  }, [initialPriceTier]);

  useEffect(() => {
    if (searchTerm.trim() === urlQuery) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedQ(searchTerm.trim());
      pageRef.current = 1;
      setSelectedPriceTier('any');
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchTerm, urlQuery]);

  useEffect(() => {
    setSelectedPriceTier('any');
  }, [selectedCategory]);

  const fetchProducts = useCallback(
    async (page: number, append: boolean, generation: number) => {
      if (append) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError('');
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

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

        if (generation !== fetchGenRef.current) {
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load products');
        }

        const incoming = (data.products ?? []) as Product[];
        const nextTotal = typeof data.total === 'number' ? data.total : 0;
        const totalPages =
          typeof data.totalPages === 'number'
            ? data.totalPages
            : Math.ceil(nextTotal / PAGE_SIZE);

        setTotal(nextTotal);
        setProducts((prev) => (append ? mergeProducts(prev, incoming) : incoming));
        setHasMore(page < totalPages && incoming.length > 0);
        pageRef.current = page;
      } catch (e) {
        if (generation !== fetchGenRef.current) {
          return;
        }
        if (e instanceof Error && e.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(
            e instanceof Error ? e.message : 'Network error. Please try again.'
          );
        }
        if (!append) {
          setProducts([]);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (generation !== fetchGenRef.current) {
          return;
        }
        if (append) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [
      debouncedQ,
      selectedCategory,
      sort,
      priceRange.min,
      priceRange.max,
    ]
  );

  useEffect(() => {
    const generation = ++fetchGenRef.current;
    pageRef.current = 1;
    setProducts([]);
    setHasMore(false);
    void fetchProducts(1, false, generation);
  }, [
    fetchProducts,
    retryCount,
    refreshToken,
  ]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loading || loadingMore || !hasMore || loadingMoreRef.current) {
          return;
        }

        const nextPage = pageRef.current + 1;
        const generation = fetchGenRef.current;
        void fetchProducts(nextPage, true, generation);
      },
      { root: null, rootMargin: '280px 0px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchProducts, hasMore, loading, loadingMore, products.length]);

  const handleImageError = (productId: string) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  const getProductImage = (product: Product) => {
    if (imageErrors[product.id]) {
      return '/placeholder.jpg';
    }
    return product.image || '/placeholder.jpg';
  };

  const resetList = () => {
    pageRef.current = 1;
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectCategory = (id: string) => {
    setSelectedCategory(id);
    resetList();
    setFiltersOpen(false);
    syncListUrl({
      category: id,
      price: selectedPriceTier,
      q: debouncedQ,
    });
  };

  const handlePriceTierChange = (id: string) => {
    setSelectedPriceTier(id);
    resetList();
    syncListUrl({
      category: selectedCategory,
      price: id,
      q: debouncedQ,
    });
  };

  const handleSortChange = (next: ProductSort) => {
    setSort(next);
    resetList();
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDebouncedQ('');
    setSelectedCategory('all');
    setSelectedPriceTier('any');
    setSort('featured');
    resetList();
    setFiltersOpen(false);
    syncListUrl({ category: 'all', price: 'any', q: '' });
  };

  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? copy.sortFeatured;

  const showInitialSkeleton = loading && products.length === 0;
  const showGrid = products.length > 0 || showInitialSkeleton;

  if (error && products.length === 0 && !loading) {
    return (
      <div className="product-page product-page--collection product-state-center">
        <div className="product-state-card">
          <div className="collection-empty-icon" aria-hidden>
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
        <nav className="collection-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="collection-breadcrumb__sep" aria-hidden>
            /
          </span>
          <span className="collection-breadcrumb__current">Shop</span>
        </nav>

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
            <label className="collection-search" htmlFor="collection-search-desktop">
              <Search size={18} className="collection-search-icon" aria-hidden />
              <input
                id="collection-search-desktop"
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
                suppressHydrationWarning
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

        <div className="collection-mobile-tools">
          <label className="collection-search" htmlFor="collection-search-mobile">
            <Search size={18} className="collection-search-icon" aria-hidden />
            <input
              id="collection-search-mobile"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={copy.searchPlaceholderCollection}
              className="collection-search-input"
            />
          </label>

          <div className="collection-mobile-bar">
            <label className="collection-sort--bar">
              <span className="sr-only">{copy.sortTitle}</span>
              <span className="collection-sort-label">{sortLabel}</span>
              <select
                className="collection-sort-select"
                value={sort}
                onChange={(event) => handleSortChange(event.target.value as ProductSort)}
                aria-label={copy.sortTitle}
                suppressHydrationWarning
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="collection-sort-chevron" aria-hidden />
            </label>

            <button
              type="button"
              className="collection-filter-trigger"
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={17} aria-hidden />
              {copy.filtersOpen}
            </button>
          </div>
        </div>

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
              {showInitialSkeleton ? (
                copy.loading
              ) : total === 0 ? (
                copy.noPiecesInView
              ) : (
                <>
                  {copy.showingPrefix}{' '}
                  <strong>{total}</strong> {copy.showingPieces}
                  {products.length < total ? (
                    <>
                      {' '}
                      · {products.length} {copy.loadedSoFar}
                    </>
                  ) : null}
                </>
              )}
            </p>

            {!showInitialSkeleton && total === 0 ? (
              <div className="collection-empty">
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptyDescription}</p>
                <button type="button" className="collection-empty-btn" onClick={clearAllFilters}>
                  {copy.viewAll}
                </button>
              </div>
            ) : null}

            {showGrid ? (
              <>
                <ul className="collection-grid" aria-busy={loading || loadingMore}>
                  {products.map((product, index) => (
                    <li
                      key={product.id}
                      className="collection-grid-item"
                      style={{ animationDelay: `${(index % 8) * 0.06}s` }}
                    >
                      <CollectionProductCard
                        product={product}
                        imageSrc={getProductImage(product)}
                        onImageError={() => handleImageError(product.id)}
                      />
                    </li>
                  ))}

                  {showInitialSkeleton
                    ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <li key={`skeleton-initial-${i}`} className="collection-grid-item">
                          <CollectionProductCardSkeleton index={i} />
                        </li>
                      ))
                    : null}

                  {loadingMore
                    ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <li key={`skeleton-more-${i}`} className="collection-grid-item">
                          <CollectionProductCardSkeleton index={i} />
                        </li>
                      ))
                    : null}
                </ul>

                <div ref={loadMoreRef} className="collection-scroll-sentinel" aria-hidden />

                {!hasMore && !loading && !loadingMore && products.length > 0 ? (
                  <p className="collection-end-note">{copy.endOfCollection}</p>
                ) : null}

                {loadingMore ? (
                  <p className="collection-loading-more" aria-live="polite">
                    {copy.loadingMore}
                  </p>
                ) : null}
              </>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

import { rememberListProducts } from '@/lib/productListSnapshot';
import type { Product } from '@/types/product';
import CollectionProductCard from "@/components/productComponent/CollectionProductCard";
import CollectionProductCardSkeleton from "@/components/productComponent/CollectionProductCardSkeleton";
import ProductsFilterSidebar from "@/components/productComponent/ProductsFilterSidebar";
import { isValidCategoryNavId } from '@/lib/categoryNav';
import productContent, { formatProductCopy } from '@/lib/productContent';
import type { ProductSort } from '@/lib/productFilters';
import { priceTierToRange } from '@/lib/productFilters';
import { buildActiveFilterChips } from '@/lib/collectionActiveFilters';
import {
  countActiveCollectionFacets,
  EMPTY_COLLECTION_FACETS,
  parseCollectionFacetFilters,
  serializeCollectionFacetFilters,
  toggleFacetSelection,
  type CollectionFacetFilters,
} from '@/lib/shopCollectionFilters';
import {
  categoryShowsRingSizeFilter,
  parseRingSizesQueryParam,
  serializeRingSizesQueryParam,
} from '@/utils/ringSizeChart';

type ListUrlState = {
  category: string;
  price: string;
  q: string;
  sizes: string[];
  facets: CollectionFacetFilters;
};

function applyListStateToUrlParams(
  params: URLSearchParams,
  next: ListUrlState
): void {
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

  const sizesParam = categoryShowsRingSizeFilter(next.category)
    ? serializeRingSizesQueryParam(next.sizes)
    : '';
  if (sizesParam) params.set('sizes', sizesParam);
  else params.delete('sizes');

  for (const key of [
    'discount',
    'weight',
    'material',
    'metal',
    'shop',
    'occasion',
    'searchTag',
  ] as const) {
    params.delete(key);
  }
  const facetParams = serializeCollectionFacetFilters(next.facets);
  for (const [key, value] of Object.entries(facetParams)) {
    params.set(key, value);
  }
}

/** Products shown per “page” — next batch loads when user scrolls near the bottom. */
const PAGE_SIZE = 12;
const FETCH_TIMEOUT_MS = 45_000;
const SCROLL_LOAD_ROOT_MARGIN = '400px 0px';
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
  initialRingSizes?: string;
  initialFacets?: CollectionFacetFilters;
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

function productListKey(product: Product): string {
  const slug = product.slug ?? product.handle ?? "";
  return slug ? `${product.id}|${slug}` : product.id;
}

function mergeProducts(prev: Product[], incoming: Product[]): Product[] {
  if (incoming.length === 0) return prev;
  const keys = new Set(prev.map((p) => productListKey(p)));
  const next = [...prev];
  for (const product of incoming) {
    const key = productListKey(product);
    if (!keys.has(key)) {
      keys.add(key);
      next.push(product);
    }
  }
  return next;
}

export default function ProductsPageClient({
  initialQuery = '',
  initialCategory = '',
  initialPriceTier = '',
  initialRingSizes = '',
  initialFacets = EMPTY_COLLECTION_FACETS,
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
  const [selectedRingSizes, setSelectedRingSizes] = useState<string[]>(() =>
    parseRingSizesQueryParam(initialRingSizes)
  );
  const [facets, setFacets] = useState<CollectionFacetFilters>(initialFacets);
  const [sort, setSort] = useState<ProductSort>('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const priceRange = useMemo(
    () => priceTierToRange(selectedPriceTier, priceTiers),
    [selectedPriceTier]
  );

  const [retryCount, setRetryCount] = useState(0);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    rootMargin: SCROLL_LOAD_ROOT_MARGIN,
    threshold: 0,
  });
  const fetchGenRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(false);
  const fetchProductsRef = useRef<
    (page: number, append: boolean, generation: number) => Promise<void>
  >(async () => {});
  const inFlightPagesRef = useRef<Set<number>>(new Set());

  const categoryHero = useMemo(() => {
    if (selectedCategory === 'all') {
      return {
        title: copy.heroTitle,
        description: copy.heroDescription?.trim() ?? '',
      };
    }
    const cat = productContent.categories.find((c) => c.id === selectedCategory);
    const name = cat?.name ?? copy.heroTitle;
    const description = formatProductCopy(copy.heroDescriptionCategory, {
      category: name,
      categoryLower: name.toLowerCase(),
    }).trim();
    return {
      title: formatProductCopy(copy.heroTitleCategory, { category: name }),
      description: description || copy.heroDescription?.trim() || '',
    };
  }, [selectedCategory]);

  const hasSidebarFilters =
    selectedPriceTier !== 'any' ||
    selectedRingSizes.length > 0 ||
    countActiveCollectionFacets(facets) > 0;

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    hasSidebarFilters ||
    sort !== 'featured' ||
    Boolean(debouncedQ.trim());

  const activeFilterChips = useMemo(
    () =>
      buildActiveFilterChips({
        categoryId: selectedCategory,
        priceTierId: selectedPriceTier,
        ringSizeIds: selectedRingSizes,
        facets,
      }),
    [selectedCategory, selectedPriceTier, selectedRingSizes, facets]
  );

  const filterBadgeCount =
    activeFilterChips.length + (debouncedQ.trim() ? 1 : 0);

  const syncListUrl = useCallback(
    (next: ListUrlState) => {
      const params = new URLSearchParams(searchParams.toString());
      applyListStateToUrlParams(params, next);
      const qs = params.toString();
      router.replace(qs ? `/products?${qs}` : '/products', { scroll: false });
    },
    [router, searchParams]
  );

  const currentListUrlState = useCallback(
    (): ListUrlState => ({
      category: selectedCategory,
      price: selectedPriceTier,
      q: debouncedQ,
      sizes: selectedRingSizes,
      facets,
    }),
    [
      selectedCategory,
      selectedPriceTier,
      debouncedQ,
      selectedRingSizes,
      facets,
    ]
  );

  useEffect(() => {
    setSearchTerm((prev) => (prev === urlQuery ? prev : urlQuery));
    setDebouncedQ((prev) => (prev === urlQuery ? prev : urlQuery));
    pageRef.current = 1;
  }, [urlQuery]);

  useEffect(() => {
    const categoryFromUrl = normalizeCategoryId(searchParams.get('category') ?? '');
    setSelectedCategory((prev) =>
      prev === categoryFromUrl ? prev : categoryFromUrl
    );
    pageRef.current = 1;
  }, [searchParams, initialCategory]);

  useEffect(() => {
    setSelectedPriceTier(normalizePriceTierId(initialPriceTier));
    pageRef.current = 1;
  }, [initialPriceTier]);

  useEffect(() => {
    setSelectedRingSizes(parseRingSizesQueryParam(initialRingSizes));
    pageRef.current = 1;
  }, [initialRingSizes]);

  const initialFacetsKey = useMemo(
    () =>
      [
        initialFacets.discounts.join(','),
        initialFacets.weights.join(','),
        initialFacets.materials.join(','),
        initialFacets.metals.join(','),
        initialFacets.shopFor.join(','),
        initialFacets.occasions.join(','),
        initialFacets.searchTags.join(','),
      ].join('|'),
    [initialFacets]
  );

  useEffect(() => {
    setFacets(initialFacets);
    pageRef.current = 1;
  }, [initialFacetsKey, initialFacets]);

  useEffect(() => {
    if (searchTerm.trim() === urlQuery) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedQ(searchTerm.trim());
      pageRef.current = 1;
      setSelectedPriceTier('any');
      setSelectedRingSizes([]);
      setFacets(EMPTY_COLLECTION_FACETS);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchTerm, urlQuery]);

  useEffect(() => {
    if (!categoryShowsRingSizeFilter(selectedCategory)) {
      setSelectedRingSizes([]);
    }
  }, [selectedCategory]);

  const buildListParams = useCallback(
    (page: number, limit: number) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
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
      if (
        categoryShowsRingSizeFilter(selectedCategory) &&
        selectedRingSizes.length > 0
      ) {
        params.set('sizes', serializeRingSizesQueryParam(selectedRingSizes));
      }
      const facetParams = serializeCollectionFacetFilters(facets);
      for (const [key, value] of Object.entries(facetParams)) {
        params.set(key, value);
      }
      return params;
    },
    [
      debouncedQ,
      selectedCategory,
      selectedRingSizes,
      facets,
      sort,
      priceRange.min,
      priceRange.max,
    ]
  );

  const fetchProducts = useCallback(
    async (page: number, append: boolean, generation: number) => {
      if (inFlightPagesRef.current.has(page)) {
        return;
      }
      if (append) {
        if (loadingMoreRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        loadingRef.current = true;
        setLoading(true);
        setError('');
      }

      inFlightPagesRef.current.add(page);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(
          `/api/products?${buildListParams(page, PAGE_SIZE).toString()}`,
          { signal: controller.signal, cache: 'no-store' }
        );
        const data = await response.json();

        if (generation !== fetchGenRef.current) {
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load products');
        }

        const responsePage =
          typeof data.page === 'number' ? data.page : Number(data.page) || 0;
        if (responsePage !== page) {
          throw new Error(
            `Catalog page mismatch (requested ${page}, got ${responsePage}). Refresh and try again.`
          );
        }

        const incoming = (data.products ?? []) as Product[];
        const nextTotal = typeof data.total === 'number' ? data.total : 0;
        const totalPages =
          typeof data.totalPages === 'number'
            ? data.totalPages
            : Math.ceil(nextTotal / PAGE_SIZE);

        const nextHasMore = page < totalPages && incoming.length > 0;

        setTotal(nextTotal);
        setProducts((prev) => {
          const merged = append ? mergeProducts(prev, incoming) : incoming;
          if (append && incoming.length > 0 && merged.length === prev.length) {
            console.warn(
              `[products] Page ${page} returned only duplicates — check API pagination.`
            );
          }
          return merged;
        });
        rememberListProducts(incoming);
        setHasMore(nextHasMore);
        hasMoreRef.current = nextHasMore;
        pageRef.current = page;
      } catch (e) {
        if (generation !== fetchGenRef.current) {
          return;
        }
        if (e instanceof Error && e.name === 'AbortError') {
          if (append) {
            console.warn('[products] Load more timed out — scroll again to retry.');
          } else {
            setError('Request timed out. Please try again.');
          }
        } else {
          setError(
            e instanceof Error ? e.message : 'Network error. Please try again.'
          );
        }
        if (!append) {
          setProducts([]);
          setTotal(0);
          setHasMore(false);
          hasMoreRef.current = false;
        }
      } finally {
        window.clearTimeout(timeoutId);
        inFlightPagesRef.current.delete(page);
        if (generation !== fetchGenRef.current) {
          return;
        }
        if (append) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [buildListParams]
  );

  fetchProductsRef.current = fetchProducts;

  const requestNextPage = useCallback(() => {
    if (!hasMoreRef.current || loadingRef.current || loadingMoreRef.current) {
      return;
    }
    const nextPage = pageRef.current + 1;
    void fetchProductsRef.current(nextPage, true, fetchGenRef.current);
  }, []);

  const facetsQueryKey = useMemo(
    () => JSON.stringify(serializeCollectionFacetFilters(facets)),
    [facets]
  );

  const listQueryKey = useMemo(
    () =>
      JSON.stringify({
        debouncedQ,
        selectedCategory,
        ringSizes: selectedRingSizes.join(','),
        facets: facetsQueryKey,
        sort,
        min: priceRange.min,
        max: priceRange.max,
      }),
    [
      debouncedQ,
      selectedCategory,
      selectedRingSizes,
      facetsQueryKey,
      sort,
      priceRange.min,
      priceRange.max,
    ]
  );

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    const generation = ++fetchGenRef.current;
    pageRef.current = 1;
    hasMoreRef.current = false;
    inFlightPagesRef.current.clear();
    setProducts([]);
    setHasMore(false);
    void fetchProductsRef.current(1, false, generation);
  }, [listQueryKey, retryCount, refreshToken]);

  /** Load next page when the sentinel is visible and the previous batch finished. */
  useEffect(() => {
    if (!loadMoreInView || loading || loadingMore || !hasMoreRef.current) {
      return;
    }
    requestNextPage();
  }, [loadMoreInView, loading, loadingMore, requestNextPage]);

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

  const setCategoryAll = () => {
    setSelectedCategory('all');
    resetList();
    syncListUrl({
      ...currentListUrlState(),
      category: 'all',
      sizes: [],
    });
  };

  const handleRingSizesChange = (sizes: string[]) => {
    setSelectedRingSizes(sizes);
    resetList();
    syncListUrl({ ...currentListUrlState(), sizes });
  };

  const handleFacetsChange = (next: CollectionFacetFilters) => {
    setFacets(next);
    resetList();
    syncListUrl({ ...currentListUrlState(), facets: next });
  };

  const handlePriceTierChange = (id: string) => {
    setSelectedPriceTier(id);
    resetList();
    syncListUrl({ ...currentListUrlState(), price: id });
  };

  const handleSortChange = (next: ProductSort) => {
    setSort(next);
    resetList();
  };

  const clearSidebarFilters = () => {
    setSelectedPriceTier('any');
    setSelectedRingSizes([]);
    setFacets(EMPTY_COLLECTION_FACETS);
    resetList();
    setFiltersOpen(false);
    syncListUrl({
      ...currentListUrlState(),
      price: 'any',
      sizes: [],
      facets: EMPTY_COLLECTION_FACETS,
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDebouncedQ('');
    setSelectedCategory('all');
    setSelectedPriceTier('any');
    setSelectedRingSizes([]);
    setFacets(EMPTY_COLLECTION_FACETS);
    setSort('featured');
    resetList();
    setFiltersOpen(false);
    syncListUrl({
      category: 'all',
      price: 'any',
      q: '',
      sizes: [],
      facets: EMPTY_COLLECTION_FACETS,
    });
  };

  const removeActiveFilter = (chipId: string) => {
    resetList();

    if (chipId === 'category') {
      setCategoryAll();
      return;
    }

    if (chipId === 'price') {
      setSelectedPriceTier('any');
      syncListUrl({ ...currentListUrlState(), price: 'any' });
      return;
    }

    if (chipId.startsWith('ring-size-')) {
      const sizeId = chipId.slice('ring-size-'.length);
      const nextSizes = selectedRingSizes.filter((value) => value !== sizeId);
      setSelectedRingSizes(nextSizes);
      syncListUrl({ ...currentListUrlState(), sizes: nextSizes });
      return;
    }

    if (chipId.startsWith('discount-')) {
      const id = chipId.slice('discount-'.length);
      const next = {
        ...facets,
        discounts: toggleFacetSelection(facets.discounts, id),
      };
      setFacets(next);
      syncListUrl({ ...currentListUrlState(), facets: next });
      return;
    }

    if (chipId.startsWith('weight-')) {
      const id = chipId.slice('weight-'.length);
      const next = {
        ...facets,
        weights: toggleFacetSelection(facets.weights, id),
      };
      setFacets(next);
      syncListUrl({ ...currentListUrlState(), facets: next });
      return;
    }

    if (chipId.startsWith('material-')) {
      const id = chipId.slice('material-'.length);
      const next = {
        ...facets,
        materials: toggleFacetSelection(facets.materials, id),
      };
      setFacets(next);
      syncListUrl({ ...currentListUrlState(), facets: next });
      return;
    }

    if (chipId.startsWith('metal-')) {
      const id = chipId.slice('metal-'.length);
      const next = {
        ...facets,
        metals: toggleFacetSelection(facets.metals, id),
      };
      setFacets(next);
      syncListUrl({ ...currentListUrlState(), facets: next });
      return;
    }

    if (chipId.startsWith('shop-')) {
      const id = chipId.slice('shop-'.length);
      const next = {
        ...facets,
        shopFor: toggleFacetSelection(facets.shopFor, id),
      };
      setFacets(next);
      syncListUrl({ ...currentListUrlState(), facets: next });
      return;
    }

    if (chipId.startsWith('occasion-')) {
      const id = chipId.slice('occasion-'.length);
      const next = {
        ...facets,
        occasions: toggleFacetSelection(facets.occasions, id),
      };
      setFacets(next);
      syncListUrl({ ...currentListUrlState(), facets: next });
      return;
    }

    if (chipId.startsWith('search-tag-')) {
      const id = chipId.slice('search-tag-'.length);
      const next = {
        ...facets,
        searchTags: toggleFacetSelection(facets.searchTags, id),
      };
      setFacets(next);
      syncListUrl({ ...currentListUrlState(), facets: next });
    }
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
        <nav
          className="collection-breadcrumb collection-breadcrumb--desktop"
          aria-label="Breadcrumb"
        >
          <Link href="/">Home</Link>
          <span className="collection-breadcrumb__sep" aria-hidden>
            /
          </span>
          <span className="collection-breadcrumb__current">Shop</span>
        </nav>

        <header className="collection-header collection-header--animate">
          <div className="collection-header-intro">
            <p className="collection-eyebrow-text collection-eyebrow-text--solo">
              {copy.heroEyebrow ?? copy.collectionLabel}
            </p>
            <h1 className="collection-title">{categoryHero.title}</h1>
            {categoryHero.description ? (
              <p className="collection-subtitle">{categoryHero.description}</p>
            ) : null}
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
            filterBadgeCount={filterBadgeCount}
            selectedPriceTier={selectedPriceTier}
            onPriceTierChange={handlePriceTierChange}
            selectedRingSizes={selectedRingSizes}
            onRingSizesChange={handleRingSizesChange}
            facets={facets}
            onFacetsChange={handleFacetsChange}
            onClearSidebarFilters={clearSidebarFilters}
            hasSidebarFilters={hasSidebarFilters}
            mobileOpen={filtersOpen}
            onMobileOpenChange={setFiltersOpen}
          />

          <main className="collection-main">
            {filterBadgeCount > 0 ? (
              <div
                className="collection-active-filters"
                aria-label={copy.activeFiltersLabel ?? 'Active filters'}
              >
                {activeFilterChips.map((chip) => (
                  <span key={chip.id} className="collection-active-filter">
                    <span className="collection-active-filter__label">{chip.label}</span>
                    <button
                      type="button"
                      className="collection-active-filter__remove"
                      onClick={() => removeActiveFilter(chip.id)}
                      aria-label={formatProductCopy(
                        copy.activeFilterRemove ?? 'Remove {filter}',
                        { filter: chip.label }
                      )}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </span>
                ))}
                {debouncedQ.trim() ? (
                  <span key="search" className="collection-active-filter">
                    <span className="collection-active-filter__label">
                      {debouncedQ.trim()}
                    </span>
                    <button
                      type="button"
                      className="collection-active-filter__remove"
                      onClick={() => {
                        setSearchTerm('');
                        setDebouncedQ('');
                        resetList();
                      }}
                      aria-label={formatProductCopy(
                        copy.activeFilterRemove ?? 'Remove {filter}',
                        { filter: debouncedQ.trim() }
                      )}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </span>
                ) : null}
              </div>
            ) : null}

            <p className="collection-count" ref={gridTopRef}>
              {showInitialSkeleton ? (
                copy.loading
              ) : total === 0 ? (
                copy.noPiecesInView
              ) : (
                <>
                  <span className="collection-count__short">
                    {formatProductCopy(copy.countShort ?? '{total} pieces', {
                      total,
                    })}
                  </span>
                  <span className="collection-count__full" aria-hidden>
                    {copy.showingPrefix}{' '}
                    <strong>{total}</strong> {copy.showingPieces}
                    {products.length < total ? (
                      <>
                        {' '}
                        · {products.length} {copy.loadedSoFar}
                      </>
                    ) : null}
                  </span>
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
                      key={productListKey(product)}
                      className="collection-grid-item"
                      data-product-card
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
                        <li key={`skeleton-initial-${i}`} className="collection-grid-skeleton">
                          <CollectionProductCardSkeleton index={i} />
                        </li>
                      ))
                    : null}

                  {loadingMore
                    ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <li key={`skeleton-more-${i}`} className="collection-grid-skeleton">
                          <CollectionProductCardSkeleton index={i} />
                        </li>
                      ))
                    : null}
                </ul>

                <div ref={loadMoreRef} className="collection-scroll-sentinel" aria-hidden />

                {hasMore && !loading && products.length > 0 ? (
                  <div className="collection-load-more-wrap">
                    <button
                      type="button"
                      className="collection-load-more-btn"
                      onClick={requestNextPage}
                      disabled={loadingMore}
                      aria-busy={loadingMore}
                    >
                      {loadingMore
                        ? copy.loadingMore
                        : (copy.loadMoreButton ?? 'Load more products')}
                    </button>
                    <p className="collection-load-more-hint" aria-live="polite">
                      {formatProductCopy(copy.countShort ?? '{total} pieces', {
                        total,
                      })}
                      {products.length < total
                        ? ` · ${products.length} ${copy.loadedSoFar}`
                        : ''}
                    </p>
                  </div>
                ) : null}

                {!hasMore && !loading && !loadingMore && products.length > 0 ? (
                  <p className="collection-end-note collection-end-note--desktop">
                    {copy.endOfCollection}
                  </p>
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { getProductHref } from '@/utils/productUrl';

const PAGE_SIZE = 10;

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

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function ProductsPageClient() {
  const searchParams = useSearchParams();
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

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'rings', name: 'Rings' },
    { id: 'necklaces', name: 'Necklaces' },
    { id: 'earrings', name: 'Earrings' },
    { id: 'bracelets', name: 'Bracelets' },
  ];

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchTerm(q);
      setDebouncedQ(q.trim());
    }
  }, [searchParams]);

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
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#f7efe3] px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-[#eadcc8] bg-white p-10 text-center shadow-[0_24px_80px_rgba(70,45,21,0.08)]">
          <div className="text-4xl" aria-hidden>
            ⚠
          </div>
          <h2 className="mt-4 text-xl font-black text-[#2f1c12]">Unable to load products</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#765f4a]">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError('');
              void loadProducts();
            }}
            className="mt-8 rounded-full bg-[#9F2B68] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#7a1f4f]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f7efe3] text-[#2f1c12]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(159,43,104,0.08),transparent),radial-gradient(circle_at_100%_0%,rgba(244,199,107,0.15),transparent_40%),linear-gradient(180deg,#fffaf2_0%,#f7efe3_35%,#efe0cf_100%)]" />

      <div className="border-b border-[#eadcc8]/90 bg-[#fffaf2]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-sm text-[#765f4a]">
          <Link href="/landing#home" className="transition hover:text-[#9F2B68]">
            Home
          </Link>
          <span className="text-[#d8bd8a]" aria-hidden>
            /
          </span>
          <span className="font-semibold text-[#2f1c12]">Shop</span>
        </div>
      </div>

      <section className="relative overflow-hidden border-b border-[#eadcc8]/60">
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-[#9F2B68]/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-[#f4c76b]/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-center md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#b47723]">
            Pradeep Jewellers
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#2f1c12] md:text-5xl">
            Shop the collection
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#765f4a] md:text-lg">
            Fine jewellery with hallmarked gold, certified stones, and finishes you can feel in
            hand—browse every piece in one calm, curated space.
          </p>
          <div className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-3 text-sm font-semibold text-[#4a2b17]">
            <span className="rounded-full border border-[#d8bd8a] bg-white/70 px-4 py-2 shadow-sm">
              {total} designs
            </span>
            <span className="rounded-full border border-[#d8bd8a] bg-white/70 px-4 py-2 shadow-sm">
              Secure checkout
            </span>
            <span className="rounded-full bg-[#2f1c12] px-4 py-2 text-[#f7d58b] shadow-md">
              Made to feel personal
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="mb-10 rounded-3xl border border-[#eadcc8] bg-[#fffaf2]/90 p-5 shadow-[0_24px_80px_rgba(70,45,21,0.08)] backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <input
                id="product-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description…"
                className="w-full rounded-2xl border border-[#eadcc8] bg-white py-3.5 pl-12 pr-4 text-[#2f1c12] shadow-inner outline-none ring-[#9F2B68]/20 transition placeholder:text-[#b39d86] focus:border-[#9F2B68] focus:ring-4"
              />
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9d8a76]"
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

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                    selectedCategory === cat.id
                      ? 'bg-[#9F2B68] text-white shadow-lg shadow-[#9F2B68]/25'
                      : 'border border-[#d8bd8a] bg-white text-[#4a2b17] hover:border-[#9F2B68]/40 hover:bg-[#fff4d8]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#eadcc8]/80 pt-6">
            <p className="text-sm text-[#765f4a]">
              {total === 0 ? (
                <>No pieces in this view.</>
              ) : (
                <>
                  Showing{' '}
                  <span className="font-bold text-[#2f1c12]">
                    {rangeStart}–{rangeEnd}
                  </span>{' '}
                  of <span className="font-bold text-[#2f1c12]">{total}</span> pieces
                  {displayTotalPages > 1 ? (
                    <>
                      {' '}
                      · Page <span className="font-bold text-[#2f1c12]">{page}</span> of{' '}
                      <span className="font-bold text-[#2f1c12]">{displayTotalPages}</span>
                    </>
                  ) : null}
                </>
              )}
            </p>
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="text-sm font-semibold text-[#9F2B68] underline-offset-4 hover:underline"
              >
                Clear search
              </button>
            ) : null}
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#eadcc8] border-t-[#9F2B68]" />
            <p className="text-sm font-medium text-[#765f4a]">Loading collection…</p>
          </div>
        ) : null}

        {!loading && total === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#d8bd8a] bg-white/60 px-6 py-20 text-center">
            <div className="text-5xl" aria-hidden>
              ✦
            </div>
            <h3 className="mt-4 text-2xl font-black text-[#2f1c12]">No pieces match</h3>
            <p className="mx-auto mt-2 max-w-md text-[#765f4a]">
              Try another keyword or reset filters to see the full catalogue.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPage(1);
              }}
              className="mt-8 rounded-full bg-[#9F2B68] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#7a1f4f]"
            >
              View all products
            </button>
          </div>
        ) : null}

        {!loading && products.length > 0 ? (
          <>
            <div ref={gridTopRef} className="scroll-mt-28">
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const list = product.compareAtPrice ?? 0;
                return (
                  <li key={product.id}>
                    <Link
                      href={getProductHref(product)}
                      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#eadcc8] bg-white shadow-[0_18px_50px_rgba(70,45,21,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#d8bd8a] hover:shadow-[0_28px_70px_rgba(70,45,21,0.12)]"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#fbf4ea] to-[#f0e3d4]">
                        {getProductImage(product) !== '/placeholder.jpg' ? (
                          <Image
                            src={getProductImage(product)}
                            alt={product.name}
                            fill
                            className="object-contain p-5 transition duration-500 group-hover:scale-[1.04]"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            onError={() => handleImageError(product.id)}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl text-[#d8bd8a]">
                            ✦
                          </div>
                        )}

                        {list > product.price ? (
                          <span className="absolute left-3 top-3 rounded-full bg-[#9F2B68] px-2.5 py-1 text-xs font-bold text-white shadow-md">
                            Sale
                          </span>
                        ) : null}

                        {(product.variantCount ?? product.variants?.length ?? 0) > 1 ? (
                          <span className="absolute bottom-3 right-3 rounded-full bg-[#2f1c12]/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                            {product.variantCount ?? product.variants?.length} options
                          </span>
                        ) : null}

                        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#2f1c12]/25 to-transparent opacity-0 transition group-hover:opacity-100" />
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="line-clamp-2 text-lg font-black leading-snug text-[#2f1c12] transition group-hover:text-[#9F2B68]">
                          {product.name}
                        </h3>
                        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[#765f4a]">
                          {product.description}
                        </p>
                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#f4e7d7] pt-4">
                          <div>
                            <span className="text-xl font-black text-[#9F2B68]">
                              {formatPrice(product.price)}
                            </span>
                            {list > product.price ? (
                              <span className="ml-2 text-sm text-[#b39d86] line-through">
                                {formatPrice(list)}
                              </span>
                            ) : null}
                          </div>
                          <span className="shrink-0 rounded-full bg-[#2f1c12] px-3 py-1.5 text-xs font-bold text-white transition group-hover:bg-[#9F2B68]">
                            View product
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {displayTotalPages > 1 ? (
              <nav
                className="mt-10 flex flex-col items-stretch gap-4"
                aria-label="Pagination"
              >
                <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-[#eadcc8] bg-white/95 p-4 shadow-[0_18px_50px_rgba(70,45,21,0.06)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
                  <div className="flex shrink-0 items-center justify-center gap-2 sm:justify-start">
                    <button
                      type="button"
                      disabled={!canPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-full border border-[#eadcc8] bg-[#fffaf2] px-4 py-2 text-sm font-bold text-[#2f1c12] transition hover:border-[#9F2B68] hover:bg-white hover:text-[#9F2B68] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={!canNext}
                      onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))}
                      className="rounded-full border border-[#eadcc8] bg-[#fffaf2] px-4 py-2 text-sm font-bold text-[#2f1c12] transition hover:border-[#9F2B68] hover:bg-white hover:text-[#9F2B68] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>

                  <div
                    className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto pb-1 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="group"
                    aria-label="Page numbers"
                  >
                    {paginationSegments.map((item, i) =>
                      item === 'ellipsis' ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="flex h-9 min-w-[2.25rem] select-none items-center justify-center px-1 text-sm font-bold text-[#b39d86]"
                          aria-hidden
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          disabled={loading}
                          onClick={() => setPage(item)}
                          aria-current={item === page ? 'page' : undefined}
                          className={`flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-full px-2.5 text-sm font-bold transition ${
                            item === page
                              ? 'bg-[#9F2B68] text-white shadow-md shadow-[#9F2B68]/25'
                              : 'border border-transparent text-[#4a2b17] hover:border-[#eadcc8] hover:bg-[#fffaf2]'
                          } disabled:cursor-wait disabled:opacity-60`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>

                  <p className="shrink-0 text-center text-xs text-[#765f4a] sm:text-right sm:text-sm">
                    <span className="font-semibold text-[#2f1c12]">
                      {rangeStart}–{rangeEnd}
                    </span>{' '}
                    of {total}
                    <span className="mx-1 text-[#d8bd8a]" aria-hidden>
                      ·
                    </span>
                    Page {page} / {displayTotalPages}
                  </p>
                </div>
              </nav>
            ) : null}
            </div>
          </>
        ) : null}

        {loading && products.length > 0 ? (
          <div
            className="pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-[#eadcc8] bg-[#fffaf2]/95 px-4 py-2 text-xs font-semibold text-[#765f4a] shadow-lg backdrop-blur"
            aria-live="polite"
          >
            Loading…
          </div>
        ) : null}
      </div>
    </div>
  );
}

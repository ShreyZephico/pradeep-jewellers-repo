"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import ProductCommerceActions from "@/components/productComponent/ProductCommerceActions";
import ProductContentModal from "@/components/productComponent/ProductContentModal";
import ProductModal from "@/components/productComponent/ProductModal";
import { useCart } from "@/contexts/CartContext";
import "@/styles/product-details.css";
import {
  addProductToCart,
  resolveDefaultVariant,
  startProductCheckout,
} from "@/lib/productCheckout";
import PriceCalculationBreakdown from "@/components/productComponent/PriceCalculationBreakdown";
import {
  useProductBasePrice,
  type UseProductBasePriceResult,
} from "@/hooks/useProductBasePrice";
import { formatProductPrice } from "@/utils/formatPrice";
import productContent from "@/lib/productContent";
import { productHasCustomizationOptions } from "@/utils/productCustomization";
import { buildPriceBreakdownOptionLines, sumOptionLineAmounts } from "@/utils/priceBreakdownOptions";

type ProductDetailClientProps = {
  slug: string;
};

const copy = productContent.detail;
const breadcrumb = productContent.breadcrumb;

function CertifiedIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="certified-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function CertifiedAuthenticity() {
  const certifications = [
    {
      id: "bis",
      title: "BIS Hallmarked",
      description: "Government certified purity",
      icon: (
        <CertifiedIcon>
          <path d="M12 3L4 6.5V12c0 4.2 3.4 7.8 8 8.5 4.6-.7 8-4.3 8-8.5V6.5L12 3z" />
          <path d="M9 12l2 2 4-4" />
        </CertifiedIcon>
      ),
    },
    {
      id: "igi",
      title: "IGI Certified",
      description: "International gemological",
      icon: (
        <CertifiedIcon>
          <circle cx="12" cy="9" r="4.5" />
          <path d="M8.5 14.5L6 20h12l-2.5-5.5" />
          <path d="M12 7v2" />
          <path d="M10.5 9.5L12 11l1.5-1.5" />
        </CertifiedIcon>
      ),
    },
    {
      id: "sgl",
      title: "SGL Authentic",
      description: "Lab certified quality",
      icon: (
        <CertifiedIcon>
          <path d="M7 4h10l2 4v12H5V8l2-4z" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
          <path d="M12 4v4" />
        </CertifiedIcon>
      ),
    },
    {
      id: "buyback",
      title: "Buyback Policy",
      description: "100% value guarantee",
      icon: (
        <CertifiedIcon>
          <path d="M20 12a8 8 0 1 1-2.3-5.7" />
          <path d="M20 4v5h-5" />
          <path d="M8 12H6" />
          <path d="M12 8v8" />
        </CertifiedIcon>
      ),
    },
  ];

  return (
    <section className="certified-section" aria-labelledby="certified-authenticity-title">
      <div className="certified-container">
        <header className="certified-header">
          <h2 id="certified-authenticity-title" className="certified-title">
            Certified Authenticity
          </h2>
          <p className="certified-subtitle">
            Every piece comes with guaranteed certification and authentic documentation
          </p>
        </header>

        <ul className="certified-badges">
          {certifications.map((cert) => (
            <li key={cert.id} className="certified-badge">
              <span className="certified-icon-wrapper">{cert.icon}</span>
              <h3 className="certified-badge-title">{cert.title}</h3>
              <p className="certified-badge-desc">{cert.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProductDetailSummary({
  pricing,
  onCustomize,
  onPriceBreakdown,
}: {
  pricing: UseProductBasePriceResult;
  onCustomize: () => void;
  onPriceBreakdown: () => void;
}) {
  const { estimatedPrice, listPrice, loading } = pricing;

  return (
    <>
      <div className="product-detail-price-preview">
        <p className="product-detail-price-label">{copy.startingPrice}</p>
        <div className="product-detail-price-row">
          <span
            className={`product-detail-price-value${
              loading ? " product-detail-price-value--loading" : ""
            }`}
          >
            {loading ? copy.priceLoading : formatProductPrice(estimatedPrice)}
          </span>
          {listPrice > estimatedPrice ? (
            <span className="product-detail-price-compare">
              {formatProductPrice(listPrice)}
            </span>
          ) : null}
        </div>
        {copy.gstNote ? (
          <p className="product-detail-gst-note">{copy.gstNote}</p>
        ) : null}
        <p className="product-detail-price-hint">{copy.priceHint}</p>
      </div>

      <div className="product-detail-actions product-detail-actions--secondary">
        <button
          type="button"
          onClick={onCustomize}
          className="product-detail-btn-secondary"
        >
          {copy.customizeAndBuy}
        </button>
        <button
          type="button"
          onClick={onPriceBreakdown}
          className="product-detail-btn-ghost product-detail-btn-ghost--block"
        >
          {copy.viewPriceBreakdown}
        </button>
      </div>

      <ul className="product-detail-trust-list product-detail-trust-list--compact">
        {copy.trustBullets.map((bullet) => (
          <li key={bullet} className="product-detail-trust-item">
            <span className="product-detail-trust-icon" aria-hidden>
              ✓
            </span>
            {bullet}
          </li>
        ))}
      </ul>
    </>
  );
}

function ProductDetailLoaded({
  product,
  slug,
}: {
  product: Product;
  slug: string;
}) {
  const { refreshCart, goToCart } = useCart();
  const gallery = (() => {
    const list = (product.images ?? []).filter(
      (src): src is string => typeof src === "string" && src.trim().length > 0
    );
    const primary =
      typeof product.image === "string" && product.image.trim().length > 0
        ? [product.image]
        : [];
    // De-dupe while keeping order (so if product.image is also in images, it won't repeat).
    const merged = [...primary, ...list];
    return Array.from(new Set(merged));
  })();
  const hasGallery = gallery.length > 0;

  const [activeImage, setActiveImage] = useState(gallery[0] ?? "");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [commerceToast, setCommerceToast] = useState("");

  const pricing = useProductBasePrice(product);
  const defaultBreakupLines = buildPriceBreakdownOptionLines({
    metal: product.metalOptions?.[0] ?? null,
    carat: product.caratOptions?.[0] ?? null,
    quality: product.diamondQualities?.[0] ?? null,
    size: null,
  });
  const defaultBreakupAdjustments = sumOptionLineAmounts(defaultBreakupLines);

  useEffect(() => {
    writeCachedProduct(slug, product);
  }, [product, slug]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("buy") === "1" || params.get("customize") === "1") {
      setCustomizeOpen(true);
    }
  }, []);

  useEffect(() => {
    // If product changes (or images load), keep active image valid.
    if (!hasGallery) {
      if (activeImage) setActiveImage("");
      return;
    }
    if (!gallery.includes(activeImage)) {
      setActiveImage(gallery[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const runQuickCheckout = async (redirect: boolean) => {
    if (productHasCustomizationOptions(product)) {
      setCustomizeOpen(true);
      if (!redirect) {
        setCommerceToast(productContent.purchase.customizeBeforeCartError);
        window.setTimeout(() => setCommerceToast(""), 4000);
      }
      return;
    }

    const { variantId, catalogVariantId } = resolveDefaultVariant(product);
    if (!variantId) {
      setCustomizeOpen(true);
      return;
    }

    const setLoading = redirect ? setBuyLoading : setCartLoading;
    setLoading(true);
    setCommerceToast("");

    if (redirect) {
      const result = await startProductCheckout({
        product,
        variantId,
        catalogVariantId,
        customPrice: pricing.estimatedPrice,
        redirect: true,
      });
      setLoading(false);
      if (!result.ok) setCommerceToast(result.error);
      return;
    }

    const result = await addProductToCart({
      product,
      variantId,
      catalogVariantId,
      customPrice: pricing.estimatedPrice,
    });

    setLoading(false);

    if (!result.ok) {
      setCommerceToast(result.error);
      return;
    }

    await refreshCart();
    goToCart();
    setCommerceToast(productContent.commerce.addedToCart);
    window.setTimeout(() => setCommerceToast(""), 3200);
  };

  const specRows =
    product.variants?.[0]?.selectedOptions?.map((o) => ({
      label: o.name,
      value: o.value,
    })) ?? [];

  const MAX_THUMBS = 5;
  const thumbImages = gallery.slice(0, MAX_THUMBS);
  const thumbOverflow = Math.max(0, gallery.length - MAX_THUMBS);

  const activeIndex = activeImage ? gallery.indexOf(activeImage) : -1;
  const canNavigate = gallery.length > 1;
  const goPrev = () => {
    if (!canNavigate) return;
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const prev = (idx - 1 + gallery.length) % gallery.length;
    setActiveImage(gallery[prev] ?? "");
  };
  const goNext = () => {
    if (!canNavigate) return;
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const next = (idx + 1) % gallery.length;
    setActiveImage(gallery[next] ?? "");
  };

  return (
    <>
      <div className="product-detail-layout">
        <div
          className={`product-detail-grid product-detail-top${
            hasGallery ? "" : " product-detail-grid--no-media"
          }`}
        >
          {hasGallery ? (
            <div className="product-detail-gallery-col product-detail-animate product-detail-animate--media">
              <div
                className={`product-detail-gallery${
                  gallery.length > 1
                    ? " product-detail-gallery--with-thumbs"
                    : ""
                }`}
              >
                {gallery.length > 1 ? (
                  <div className="product-detail-thumbs product-detail-thumbs--side">
                    {thumbImages.map((src, idx) => {
                      const showOverflow =
                        thumbOverflow > 0 && idx === thumbImages.length - 1;
                      return (
                        <button
                          key={src}
                          type="button"
                          onClick={() =>
                            showOverflow
                              ? setGalleryDialogOpen(true)
                              : setActiveImage(src)
                          }
                          className={`product-detail-thumb${
                            activeImage === src
                              ? " product-detail-thumb--active"
                              : ""
                          }`}
                        >
                          <Image
                            src={src}
                            alt=""
                            fill
                            className="product-detail-thumb-img"
                            sizes="80px"
                          />
                          {showOverflow ? (
                            <span
                              className="product-detail-thumb-overflow"
                              aria-hidden
                            >
                              +{thumbOverflow}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="product-detail-hero-image">
                  <div className="product-detail-hero-frame">
                    {activeImage ? (
                      <Image
                        src={activeImage}
                        alt={product.name}
                        fill
                        className="product-detail-hero-img"
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        style={{ objectFit: "contain", objectPosition: "center" }}
                        priority
                      />
                    ) : null}
                  </div>

                  {canNavigate ? (
                    <>
                      <button
                        type="button"
                        className="product-detail-hero-nav product-detail-hero-nav--prev"
                        onClick={goPrev}
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="product-detail-hero-nav product-detail-hero-nav--next"
                        onClick={goNext}
                        aria-label="Next image"
                      >
                        ›
                      </button>
                      {activeIndex >= 0 ? (
                        <span className="product-detail-gallery-index" aria-live="polite">
                          {activeIndex + 1} / {gallery.length}
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              {gallery.length > 1 ? (
                <div className="product-detail-thumbs product-detail-thumbs--bottom">
                  {thumbImages.map((src, idx) => {
                    const showOverflow =
                      thumbOverflow > 0 && idx === thumbImages.length - 1;
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() =>
                          showOverflow
                            ? setGalleryDialogOpen(true)
                            : setActiveImage(src)
                        }
                        className={`product-detail-thumb${
                          activeImage === src
                            ? " product-detail-thumb--active"
                            : ""
                        }`}
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="product-detail-thumb-img"
                          sizes="80px"
                        />
                        {showOverflow ? (
                          <span
                            className="product-detail-thumb-overflow"
                            aria-hidden
                          >
                            +{thumbOverflow}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <aside className="product-detail-sidebar product-detail-animate product-detail-animate--panel">
            <div className="product-detail-card">
              <header className="product-detail-card-header">
                <p className="product-detail-vendor">
                  {product.vendor ?? productContent.brand.defaultVendor}
                </p>
                <h1 className="product-detail-title">
                  {product.name}
                </h1>

                <div className="product-detail-rating">
                  <span className="product-detail-rating-stars" aria-hidden>
                    {copy.ratingStars}
                  </span>
                  <span className="product-detail-rating-label">
                    {copy.ratingLabel}
                  </span>
                </div>

                {copy.assurances?.length ? (
                  <ul className="product-detail-assurance" aria-label="Product assurances">
                    {copy.assurances.map((label) => (
                      <li key={label} className="product-detail-assurance__item">
                        <span className="product-detail-assurance__dot" aria-hidden />
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </header>

              <div className="product-detail-card-body">
                <ProductDetailSummary
                  pricing={pricing}
                  onCustomize={() => setCustomizeOpen(true)}
                  onPriceBreakdown={() => setBreakdownOpen(true)}
                />

                <div className="product-detail-commerce-bottom">
                  <ProductCommerceActions
                    buyLoading={buyLoading}
                    cartLoading={cartLoading}
                    onBuyNow={() => void runQuickCheckout(true)}
                    onAddToCart={() => void runQuickCheckout(false)}
                  />

                  {commerceToast ? (
                    <p
                      className="product-detail-commerce-toast product-animate-in"
                      role="status"
                    >
                      {commerceToast}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="product-detail-details product-detail-bottom">
          <section className="product-detail-section">
            <h2 className="product-detail-section-title">{copy.aboutTitle}</h2>
            <div className="product-detail-copy">
              <p className="product-detail-description">{product.description}</p>
              {product.shortDescription ? (
                <p className="product-detail-short-description">
                  {product.shortDescription}
                </p>
              ) : null}
            </div>
          </section>

          {specRows.length > 0 ? (
            <section className="product-detail-section">
              <h2 className="product-detail-section-title">{copy.specsTitle}</h2>
              <table className="product-detail-spec-table">
                <tbody>
                  {specRows.map((row) => (
                    <tr key={`${row.label}-${row.value}`}>
                      <th scope="row">{row.label}</th>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </div>

        {/* ===== CERTIFIED AUTHENTICITY SECTION - ADDED HERE ===== */}
        <CertifiedAuthenticity />
      </div>

      <ProductContentModal
        open={galleryDialogOpen}
        title="All images"
        onClose={() => setGalleryDialogOpen(false)}
      >
        <div className="product-detail-gallery-dialog">
          {gallery.map((src) => (
            <button
              key={src}
              type="button"
              className={`product-detail-gallery-dialog-item${
                src === activeImage ? " is-active" : ""
              }`}
              onClick={() => {
                setActiveImage(src);
                setGalleryDialogOpen(false);
              }}
            >
              <span className="product-detail-gallery-dialog-img">
                <Image src={src} alt="" fill sizes="160px" />
              </span>
            </button>
          ))}
        </div>
      </ProductContentModal>

      <ProductModal
        product={product}
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
      />

      <ProductContentModal
        open={breakdownOpen}
        title={productContent.priceBreakdown.title}
        onClose={() => setBreakdownOpen(false)}
      >
        <PriceCalculationBreakdown
          breakdown={pricing.breakdown}
          weightGrams={pricing.weightGrams}
          karatLabel={pricing.karatLabel}
          metalLabel={product.metalOptions?.[0]?.label}
          diamondLabel={product.diamondQualities?.[0]?.label}
          loading={pricing.loading}
          optionLines={defaultBreakupLines}
          optionAdjustments={defaultBreakupAdjustments}
          displayTotal={pricing.estimatedPrice + defaultBreakupAdjustments}
          embedded
        />
      </ProductContentModal>
    </>
  );
}

const productDetailCacheKey = (slug: string) => `pj-product-detail:${slug}`;
const PRODUCT_DETAIL_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedProductEntry = {
  product: Product;
  cachedAt: number;
};

function readCachedProduct(slug: string): Product | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(productDetailCacheKey(slug));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedProductEntry | Product;
    const parsed =
      entry && typeof entry === "object" && "product" in entry && "cachedAt" in entry
        ? (entry as CachedProductEntry).product
        : (entry as Product);
    const cachedAt =
      entry && typeof entry === "object" && "cachedAt" in entry
        ? (entry as CachedProductEntry).cachedAt
        : 0;
    if (cachedAt && Date.now() - cachedAt > PRODUCT_DETAIL_CACHE_TTL_MS) {
      sessionStorage.removeItem(productDetailCacheKey(slug));
      return null;
    }
    const handle = parsed.slug ?? parsed.handle;
    return handle === slug || parsed.id === slug ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedProduct(slug: string, product: Product): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedProductEntry = { product, cachedAt: Date.now() };
    sessionStorage.setItem(productDetailCacheKey(slug), JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const productRef = useRef<Product | null>(null);
  const mountFetchDone = useRef(false);

  const applySessionCache = useCallback((): boolean => {
    const cached = readCachedProduct(slug);
    if (!cached) return false;
    setProduct(cached);
    productRef.current = cached;
    setError("");
    setLoading(false);
    return true;
  }, [slug]);

  const fetchProduct = useCallback(
    async (options?: { silent?: boolean; signal?: AbortSignal }) => {
      const silent = options?.silent === true;
      if (!silent) {
        setLoading(true);
        setError("");
      }

      const ownController = options?.signal ? null : new AbortController();
      const signal = options?.signal ?? ownController!.signal;
      const timeoutId = ownController
        ? window.setTimeout(() => ownController.abort(), 45_000)
        : null;

      try {
        const response = await fetch(
          `/api/product/${encodeURIComponent(slug)}`,
          { signal, cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok || !data.success || !data.product) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Product not found"
          );
        }

        const next = data.product as Product;
        writeCachedProduct(slug, next);
        setProduct(next);
        productRef.current = next;
        setError("");
      } catch (e: unknown) {
        if (signal.aborted) {
          if (!silent && !productRef.current) {
            setError(
              "Product took too long to load. Please refresh or try again."
            );
          }
          return;
        }
        const message = e instanceof Error ? e.message : "Something went wrong";
        if (!silent || !productRef.current) {
          setError(message);
          setProduct(null);
        }
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [slug]
  );

  const handleHistoryReturn = useCallback(() => {
    const hadCache = applySessionCache();
    void fetchProduct({ silent: hadCache || !!productRef.current });
  }, [applySessionCache, fetchProduct]);

  // Primary mount effect — single source of truth for initial load
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    mountFetchDone.current = false;

    const run = async () => {
      // If returning from Shopify, use cache immediately and refresh silently
      const comingFromShopify = document.referrer.includes(
        "f4hvea-e6.myshopify.com"
      );
      if (comingFromShopify) {
        applySessionCache();
        mountFetchDone.current = true;
        if (!cancelled) void fetchProduct({ silent: true });
        return;
      }

      const hadCache = applySessionCache();
      if (!hadCache) {
        setLoading(true);
        setError("");
      }

      try {
        const response = await fetch(
          `/api/product/${encodeURIComponent(slug)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok || !data.success || !data.product) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Product not found"
          );
        }

        const next = data.product as Product;
        writeCachedProduct(slug, next);
        setProduct(next);
        productRef.current = next;
        setError("");
      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof Error && e.name === "AbortError") {
          if (!productRef.current) {
            setError(
              "Product took too long to load. Please refresh or try again."
            );
          }
          return;
        }
        const message = e instanceof Error ? e.message : "Something went wrong";
        if (!productRef.current) {
          setError(message);
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          mountFetchDone.current = true;
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug, applySessionCache, fetchProduct]);

  // bfcache restore and SPA popstate handler
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) handleHistoryReturn();
    };
    const onPopState = () => {
      if (mountFetchDone.current) handleHistoryReturn();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPopState);
    };
  }, [handleHistoryReturn]);

  if (loading) {
    return (
      <div className="product-detail-page product-state-center">
        <div className="product-spinner" aria-hidden />
        <p>{copy.loading}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page product-state-center">
        <div className="product-state-card">
          <h1>{copy.unavailableTitle}</h1>
          <p>{error || copy.unavailableFallback}</p>
          <Link href="/products" className="product-btn-primary">
            {copy.backToShop}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-breadcrumb-bar">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">{breadcrumb.home}</Link>
          <span aria-hidden>{breadcrumb.separator}</span>
          <Link href="/products">{breadcrumb.shop}</Link>
          <span aria-hidden>{breadcrumb.separator}</span>
          <span aria-current="page">{product.name}</span>
        </nav>
      </div>

      <div className="product-container product-detail-main">
        <ProductDetailLoaded product={product} slug={slug} />
      </div>
    </div>
  );
}
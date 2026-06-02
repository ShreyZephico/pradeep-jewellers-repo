"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  handleCheckoutAuthFailure,
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

type ProductDetailClientProps = {
  slug: string;
};

const copy = productContent.detail;
const breadcrumb = productContent.breadcrumb;

// ===== CERTIFIED AUTHENTICITY COMPONENT =====
// ===== CERTIFIED AUTHENTICITY COMPONENT with SVG Icons =====
function CertifiedAuthenticity() {
  const certifications = [
    {
      id: "bis",
      title: "BIS Hallmarked",
      description: "Government certified purity",
      icon: (
        <svg className="certified-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z" />
          <path d="M12 7.5V12.5" />
          <path d="M9 10.5L12 12.5L15 10.5" />
        </svg>
      ),
    },
    {
      id: "igi",
      title: "IGI Certified",
      description: "International gemological",
      icon: (
        <svg className="certified-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2L12 7" />
          <path d="M12 22L12 17" />
          <path d="M2 12L7 12" />
          <path d="M22 12L17 12" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 9L12 12L14 14" />
        </svg>
      ),
    },
    {
      id: "sgl",
      title: "SGL Authentic",
      description: "Lab certified quality",
      icon: (
        <svg className="certified-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L12 6" />
          <path d="M12 18L12 22" />
          <path d="M4.93 4.93L7.76 7.76" />
          <path d="M16.24 16.24L19.07 19.07" />
          <path d="M2 12L6 12" />
          <path d="M18 12L22 12" />
          <path d="M4.93 19.07L7.76 16.24" />
          <path d="M16.24 7.76L19.07 4.93" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 9L12 12L14 14" />
        </svg>
      ),
    },
    {
      id: "buyback",
      title: "Buyback Policy",
      description: "100% value guarantee",
      icon: (
        <svg className="certified-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2V4" />
          <path d="M12 20V22" />
          <path d="M4 12H2" />
          <path d="M22 12H20" />
          <path d="M7.5 7.5L5.5 5.5" />
          <path d="M18.5 18.5L16.5 16.5" />
          <path d="M16.5 7.5L18.5 5.5" />
          <path d="M5.5 18.5L7.5 16.5" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 8V12L14 14" />
        </svg>
      ),
    },
  ];

  return (
    <section className="certified-section">
      <div className="certified-container">
        <div className="certified-header">
          <h2 className="certified-title">Certified Authenticity</h2>
          <p className="certified-subtitle">
            Every piece comes with guaranteed certification and authentic documentation
          </p>
        </div>

        <div className="certified-badges">
          {certifications.map((cert, index) => (
            <div
              key={cert.id}
              className="certified-badge"
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            >
              <div className="certified-icon-wrapper">
                {cert.icon}
              </div>
              <h3 className="certified-badge-title">{cert.title}</h3>
              <p className="certified-badge-desc">{cert.description}</p>
            </div>
          ))}
        </div>
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
      <div className="item-detail-price-preview">
        <p className="item-detail-price-label">{copy.startingPrice}</p>
        <div className="item-detail-price-row">
          <span
            className={`product-detail-price-value${
              loading ? " product-detail-price-value--loading" : ""
            }`}
          >
            {loading ? copy.priceLoading : formatProductPrice(estimatedPrice)}
          </span>
          {listPrice > estimatedPrice ? (
            <span className="item-detail-price-compare">
              {formatProductPrice(listPrice)}
            </span>
          ) : null}
        </div>
        <p className="item-detail-price-hint">{copy.priceHint}</p>
      </div>

      <div className="item-detail-actions product-detail-actions--secondary">
        <button
          type="button"
          onClick={onCustomize}
          className="item-detail-btn-secondary"
        >
          {copy.customizeAndBuy}
        </button>
        <button
          type="button"
          onClick={onPriceBreakdown}
          className="item-detail-btn-ghost product-detail-btn-ghost--block"
        >
          {copy.viewPriceBreakdown}
        </button>
      </div>

      <ul className="item-detail-trust-list product-detail-trust-list--compact">
        {copy.trustBullets.map((bullet) => (
          <li key={bullet} className="item-detail-trust-item">
            <span className="item-detail-trust-icon" aria-hidden>
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
      if (!result.ok) {
        handleCheckoutAuthFailure(result);
        if (!result.needsLogin) setCommerceToast(result.error);
      }
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
      handleCheckoutAuthFailure(result);
      if (!result.needsLogin) setCommerceToast(result.error);
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
      <div className="item-detail-layout">
        <div
          className={`product-detail-grid product-detail-top${
            hasGallery ? "" : " product-detail-grid--no-media"
          }`}
        >
          {hasGallery ? (
            <div className="item-detail-gallery-col product-detail-animate product-detail-animate--media">
              <div
                className={`product-detail-gallery${
                  gallery.length > 1
                    ? " product-detail-gallery--with-thumbs"
                    : ""
                }`}
              >
                {gallery.length > 1 ? (
                  <div className="item-detail-thumbs product-detail-thumbs--side">
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
                            className="item-detail-thumb-img"
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

                <div className="item-detail-hero-image">
                  <div className="item-detail-hero-frame">
                    {activeImage ? (
                      <Image
                        src={activeImage}
                        alt={product.name}
                        fill
                        className="item-detail-hero-img"
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        priority
                      />
                    ) : null}
                  </div>

                  {canNavigate ? (
                    <>
                      <button
                        type="button"
                        className="item-detail-hero-nav item-detail-hero-nav--prev"
                        onClick={goPrev}
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="item-detail-hero-nav item-detail-hero-nav--next"
                        onClick={goNext}
                        aria-label="Next image"
                      >
                        ›
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {gallery.length > 1 ? (
                <div className="item-detail-thumbs product-detail-thumbs--bottom">
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
                          className="item-detail-thumb-img"
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

          <aside className="item-detail-sidebar product-detail-animate product-detail-animate--panel">
            <div className="item-detail-card">
              <header className="item-detail-card-header">
                <p className="item-detail-vendor">
                  {product.vendor ?? productContent.brand.defaultVendor}
                </p>
                <h1 className="item-item-title product-item-title--detail">
                  {product.name}
                </h1>

                <div className="item-detail-rating">
                  <span className="item-detail-rating-stars" aria-hidden>
                    {copy.ratingStars}
                  </span>
                  <span className="item-detail-rating-label">
                    {copy.ratingLabel}
                  </span>
                </div>
              </header>

              <div className="item-detail-card-body">
                <ProductDetailSummary
                  pricing={pricing}
                  onCustomize={() => setCustomizeOpen(true)}
                  onPriceBreakdown={() => setBreakdownOpen(true)}
                />

                <div className="item-detail-commerce-bottom">
                  <ProductCommerceActions
                    buyLoading={buyLoading}
                    cartLoading={cartLoading}
                    onBuyNow={() => void runQuickCheckout(true)}
                    onAddToCart={() => void runQuickCheckout(false)}
                  />

                  {commerceToast ? (
                    <p
                      className="item-detail-commerce-toast product-animate-in"
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

        <div className="item-detail-details product-detail-bottom">
          <section className="item-detail-section">
            <h2 className="item-detail-section-title">{copy.aboutTitle}</h2>
            <div className="item-detail-copy">
              <p className="item-detail-description">{product.description}</p>
              {product.shortDescription ? (
                <p className="item-detail-short-description">
                  {product.shortDescription}
                </p>
              ) : null}
            </div>
          </section>

          {specRows.length > 0 ? (
            <section className="item-detail-section">
              <h2 className="item-detail-section-title">{copy.specsTitle}</h2>
              <table className="item-detail-spec-table">
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
        <div className="item-detail-gallery-dialog">
          {gallery.map((src) => (
            <button
              key={src}
              type="button"
              className={`item-detail-gallery-dialog-item${
                src === activeImage ? " is-active" : ""
              }`}
              onClick={() => {
                setActiveImage(src);
                setGalleryDialogOpen(false);
              }}
            >
              <span className="item-detail-gallery-dialog-img">
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
          loading={pricing.loading}
          displayTotal={pricing.estimatedPrice}
          embedded
        />
      </ProductContentModal>
    </>
  );
}

const productDetailCacheKey = (slug: string) => `pj-product-detail:${slug}`;

function readCachedProduct(slug: string): Product | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(productDetailCacheKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Product;
    const handle = parsed.slug ?? parsed.handle;
    return handle === slug || parsed.id === slug ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedProduct(slug: string, product: Product): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(productDetailCacheKey(slug), JSON.stringify(product));
  } catch {
    // ignore quota / private mode
  }
}

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  console.log("=== COMPONENT RENDERING ===", slug);
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
      <div className="item-page product-state-center">
        <div className="item-spinner" aria-hidden />
        <p>{copy.loading}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="item-page product-state-center">
        <div className="item-state-card">
          <h1>{copy.unavailableTitle}</h1>
          <p>{error || copy.unavailableFallback}</p>
          <Link href="/products" className="item-btn-primary">
            {copy.backToShop}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="item-page product-detail-page">
      <div className="item-breadcrumb-bar">
        <nav
          className="item-container product-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link href="/landing#home">{breadcrumb.home}</Link>
          <span className="item-breadcrumb-sep" aria-hidden>
            {breadcrumb.separator}
          </span>
          <Link href="/products">{breadcrumb.shop}</Link>
          <span className="item-breadcrumb-sep" aria-hidden>
            {breadcrumb.separator}
          </span>
          <span className="item-breadcrumb-current">{product.name}</span>
        </nav>
      </div>

      <div className="item-container product-detail-main">
        <ProductDetailLoaded product={product} slug={slug} />
      </div>
    </div>
  );
}
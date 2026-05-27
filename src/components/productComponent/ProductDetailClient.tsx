"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import ProductCommerceActions from "@/components/productComponent/ProductCommerceActions";
import ProductContentModal from "@/components/productComponent/ProductContentModal";
import ProductModal from "@/components/productComponent/ProductModal";
import { useCart } from "@/contexts/CartContext";
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
  const [activeImage, setActiveImage] = useState(
    product.images?.[0] ?? product.image ?? "/placeholder.jpg"
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
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

  const gallery =
    product.images?.filter(Boolean).length && product.images!.length > 0
      ? product.images!
      : [product.image];

  const specRows =
    product.variants?.[0]?.selectedOptions?.map((o) => ({
      label: o.name,
      value: o.value,
    })) ?? [];

  return (
    <>
      <div className="product-detail-grid">
        <div className="product-detail-gallery-col">
          <div className="product-detail-hero-image">
            <div className="product-detail-hero-frame">
              {activeImage && activeImage !== "/placeholder.jpg" ? (
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  className="product-detail-hero-img"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                />
              ) : (
                <div className="product-detail-placeholder" aria-hidden>
                  {copy.placeholderSymbol}
                </div>
              )}
            </div>
          </div>

          {gallery.length > 1 ? (
            <div className="product-detail-thumbs">
              {gallery.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(src)}
                  className={`product-detail-thumb${
                    activeImage === src ? " product-detail-thumb--active" : ""
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="product-detail-thumb-img"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="product-detail-sidebar">
          <div className="product-detail-card">
            <header className="product-detail-card-header">
              <p className="product-detail-vendor">
                {product.vendor ?? productContent.brand.defaultVendor}
              </p>
              <h1 className="product-item-title product-item-title--detail">
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

              <ProductCommerceActions
                className="product-detail-commerce-top"
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
            </header>

            <div className="product-detail-card-body">
              <ProductDetailSummary
                pricing={pricing}
                onCustomize={() => setCustomizeOpen(true)}
                onPriceBreakdown={() => setBreakdownOpen(true)}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="product-detail-details">
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
            setError("Product took too long to load. Please refresh or try again.");
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
      const comingFromShopify = document.referrer.includes("f4hvea-e6.myshopify.com");
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
            setError("Product took too long to load. Please refresh or try again.");
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
      <div className="product-page product-state-center">
        <div className="product-spinner" aria-hidden />
        <p>{copy.loading}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-page product-state-center">
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
    <div className="product-page product-detail-page">
      <div className="product-breadcrumb-bar">
        <nav
          className="product-container product-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link href="/landing#home">{breadcrumb.home}</Link>
          <span className="product-breadcrumb-sep" aria-hidden>
            {breadcrumb.separator}
          </span>
          <Link href="/products">{breadcrumb.shop}</Link>
          <span className="product-breadcrumb-sep" aria-hidden>
            {breadcrumb.separator}
          </span>
          <span className="product-breadcrumb-current">{product.name}</span>
        </nav>
      </div>

      <div className="product-container product-detail-main">
        <ProductDetailLoaded product={product} slug={slug} />
      </div>
    </div>
  );
}

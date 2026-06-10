"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import GoldShineIcon from "@/components/icons/GoldShineIcon";
import ProductCommerceActions from "@/components/productComponent/ProductCommerceActions";
import ProductWhatsAppEnquireButton from "@/components/productComponent/ProductWhatsAppEnquireButton";
import ProductDiamondDetailsAccordion from "@/components/productComponent/ProductDiamondDetailsAccordion";
import ProductCustomizeSummaryBar from "@/components/productComponent/ProductCustomizeSummaryBar";
import ProductDeliveryEstimate from "@/components/productComponent/ProductDeliveryEstimate";
import ProductRecommendedSection from "@/components/productComponent/ProductRecommendedSection";
import ProductContentModal from "@/components/productComponent/ProductContentModal";
import ProductModal from "@/components/productComponent/ProductModal";
import { useCart } from "@/contexts/CartContext";
import {
  readProductDetailCache,
  writeProductDetailCache,
} from "@/lib/productDetailCache";
import { getInflightProductDetail } from "@/lib/productDetailPrefetch";
import { readListProductSnapshot } from "@/lib/productListSnapshot";
import { useProductDetailSeed } from "@/hooks/useProductDetailSeed";
import ProductDetailSkeleton from "@/components/productComponent/ProductDetailSkeleton";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import "@/styles/product-details.css";
import {
  addProductToCart,
  resolveDefaultVariant,
  startProductCheckout,
} from "@/lib/productCheckout";
import PriceCalculationBreakdown from "@/components/productComponent/PriceCalculationBreakdown";
import {
  useProductConfiguredPrice,
  type UseProductConfiguredPriceResult,
} from "@/hooks/useProductConfiguredPrice";
import { formatProductPrice } from "@/utils/formatPrice";
import contactData from "@/data/contactDatas.json";
import productContent from "@/lib/productContent";
import {
  buildSpecRowsFromSelections,
  buildCustomizationLineAttributes,
  applyCustomizationDefaults,
  areCustomizationSelectionsEqual,
  customizationCatalogRevision,
  getDefaultProductCustomization,
  productHasCustomizationOptions,
  resolveCustomizationOptions,
  type CustomizationSelections,
} from "@/utils/productCustomization";
import { productHasDiamondDetails } from "@/utils/diamondDetails";
import { getGalleryImagesForMetalSelection } from "@/utils/productGalleryByMetal";

type ProductDetailClientProps = {
  slug: string;
  initialProduct?: Product | null;
};

const copy = productContent.detail;
const breadcrumb = productContent.breadcrumb;
const breakdownCopy = productContent.priceBreakdown;

function formatWeightGrams(weight: number): string {
  const w = Math.round(weight * 1000) / 1000;
  return `${w} ${breakdownCopy.weightUnit}`;
}

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
  product,
  selection,
  pricing,
  onCustomize,
  onPriceBreakdown,
  onBuyNow,
  onAddToCart,
  showConfiguredPrice,
  showCustomizeBar,
  buyLoading,
  cartLoading,
  commerceToast,
}: {
  product: Product;
  selection: CustomizationSelections;
  pricing: UseProductConfiguredPriceResult;
  onCustomize: () => void;
  onPriceBreakdown: () => void;
  onBuyNow: () => void;
  onAddToCart: () => void;
  showConfiguredPrice: boolean;
  showCustomizeBar: boolean;
  buyLoading: boolean;
  cartLoading: boolean;
  commerceToast: string;
}) {
  const { totalPrice, listPrice, loading, weightGrams } = pricing;
  const priceLabel = showConfiguredPrice
    ? productContent.purchase.yourPrice
    : copy.startingPrice;

  return (
    <>
      <div className="product-detail-price-preview">
        <p className="product-detail-price-label">{priceLabel}</p>
        <div className="product-detail-price-row">
          <span
            className={`product-detail-price-value${
              loading ? " product-detail-price-value--loading" : ""
            }`}
          >
            {loading ? copy.priceLoading : formatProductPrice(totalPrice)}
          </span>
          {weightGrams > 0 ? (
            <span
              className="product-detail-price-weight"
              aria-label={`${copy.weightLabel}: ${formatWeightGrams(weightGrams)}`}
            >
              <span className="product-detail-price-weight-label-row">
                <GoldShineIcon
                  className="product-detail-price-weight-icon"
                  title={copy.weightLabel}
                />
                <span className="product-detail-price-weight-label">{copy.weightLabel}</span>
              </span>
              <span className="product-detail-price-weight-value">
                {formatWeightGrams(weightGrams)}
              </span>
            </span>
          ) : null}
          {listPrice > totalPrice ? (
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
        {showCustomizeBar ? (
          <ProductCustomizeSummaryBar
            product={product}
            selection={selection}
            onCustomize={onCustomize}
          />
        ) : null}

        {productHasDiamondDetails(product.diamondDetails) ? (
          <ProductDiamondDetailsAccordion
            product={product}
            selectedLabel={selection.quality}
          />
        ) : null}

        <div className="product-detail-commerce-inline">
          <ProductCommerceActions
            layout="row"
            buyLoading={buyLoading}
            cartLoading={cartLoading}
            onBuyNow={onBuyNow}
            onAddToCart={onAddToCart}
          />

          {commerceToast ? (
            <p className="product-detail-commerce-toast product-animate-in" role="status">
              {commerceToast}
            </p>
          ) : null}
        </div>

        <ProductWhatsAppEnquireButton
          product={product}
          selection={selection}
          totalPrice={totalPrice}
        />

        <button
          type="button"
          onClick={onPriceBreakdown}
          className="product-detail-btn-ghost product-detail-btn-ghost--block"
        >
          {copy.viewPriceBreakdown}
        </button>

        <ProductDeliveryEstimate variant="compact" />
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
        <li className="product-detail-trust-item">
          <span className="product-detail-trust-icon" aria-hidden>
            ✓
          </span>
          {copy.sizingHelpPrefix}{" "}
          <a
            href={contactData.header.videoCallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="product-detail-trust-link"
          >
            {contactData.header.videoCallText}
          </a>
        </li>
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
  const hasCustomization = productHasCustomizationOptions(product);
  const [confirmedSelection, setConfirmedSelection] = useState<CustomizationSelections>(
    () => getDefaultProductCustomization(product)
  );
  const [liveSelection, setLiveSelection] = useState<CustomizationSelections | null>(
    null
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [activeImage, setActiveImage] = useState("");
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [commerceToast, setCommerceToast] = useState("");
  const [customizeSyncKey, setCustomizeSyncKey] = useState(0);

  const galleryMetalLabel =
    customizeOpen && liveSelection?.metal
      ? liveSelection.metal
      : confirmedSelection.metal;

  const gallery = useMemo(
    () => getGalleryImagesForMetalSelection(product, galleryMetalLabel),
    [product, galleryMetalLabel]
  );
  const hasGallery = gallery.length > 0;

  useEffect(() => {
    if (!hasGallery) {
      setActiveImage((prev) => (prev === "" ? prev : ""));
      return;
    }
    setActiveImage((prev) => {
      if (prev && gallery.includes(prev)) return prev;
      return gallery[0] ?? "";
    });
  }, [gallery, hasGallery]);

  const catalogRevision = customizationCatalogRevision(product);
  const pricing = useProductConfiguredPrice(product, confirmedSelection);
  const lastAppliedCatalogRevision = useRef<string | null>(null);

  useEffect(() => {
    if (lastAppliedCatalogRevision.current === catalogRevision) {
      return;
    }
    lastAppliedCatalogRevision.current = catalogRevision;
    setConfirmedSelection((prev) => {
      const merged = applyCustomizationDefaults(prev, product);
      return areCustomizationSelectionsEqual(prev, merged) ? prev : merged;
    });
  }, [catalogRevision, product]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      hasCustomization &&
      (params.get("buy") === "1" || params.get("customize") === "1")
    ) {
      setCustomizeOpen(true);
    }
  }, [hasCustomization]);

  useEffect(() => {
    if (!customizeOpen) {
      setLiveSelection(null);
    }
  }, [customizeOpen]);

  useEffect(() => {
    if (customizeOpen) {
      setCustomizeSyncKey((key) => key + 1);
    }
  }, [customizeOpen]);

  const runQuickCheckout = async (redirect: boolean) => {
    if (hasCustomization) {
      const resolved = resolveCustomizationOptions(product, confirmedSelection);
      const variantId = resolved.variant?.id ?? product.variantId;
      if (!variantId) {
        setCustomizeOpen(true);
        return;
      }

      const catalogVariantId =
        variantId.startsWith("gid://shopify/ProductVariant/")
          ? undefined
          : resolved.variant?.catalogVariantId ??
            product.variants?.find(
              (v) =>
                v.catalogVariantId === variantId || v.id === variantId
            )?.catalogVariantId;

      const attributes = buildCustomizationLineAttributes(product, confirmedSelection);

      const setLoading = redirect ? setBuyLoading : setCartLoading;
      setLoading(true);
      setCommerceToast("");

      if (redirect) {
        const result = await startProductCheckout({
          product,
          variantId,
          catalogVariantId,
          customPrice: pricing.totalPrice,
          attributes,
          priceBreakdown: pricing.breakdown ?? undefined,
          weightGrams: pricing.weightGrams,
          karatLabel: pricing.karatLabel,
          optionAdjustments: pricing.optionAdjustments,
          optionLines: pricing.optionLines,
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
        customPrice: pricing.totalPrice,
        attributes,
        priceBreakdown: pricing.breakdown ?? undefined,
        weightGrams: pricing.weightGrams,
        karatLabel: pricing.karatLabel,
        optionAdjustments: pricing.optionAdjustments,
        optionLines: pricing.optionLines,
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
        customPrice: pricing.totalPrice,
        priceBreakdown: pricing.breakdown ?? undefined,
        weightGrams: pricing.weightGrams,
        karatLabel: pricing.karatLabel,
        optionAdjustments: pricing.optionAdjustments,
        optionLines: pricing.optionLines,
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
      customPrice: pricing.totalPrice,
      priceBreakdown: pricing.breakdown ?? undefined,
      weightGrams: pricing.weightGrams,
      karatLabel: pricing.karatLabel,
      optionAdjustments: pricing.optionAdjustments,
      optionLines: pricing.optionLines,
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

  const specRows = hasCustomization
    ? buildSpecRowsFromSelections(product, confirmedSelection)
    : product.variants?.[0]?.selectedOptions?.map((o) => ({
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
                  product={product}
                  selection={
                    customizeOpen && liveSelection
                      ? liveSelection
                      : confirmedSelection
                  }
                  pricing={pricing}
                  showConfiguredPrice={hasCustomization}
                  showCustomizeBar={hasCustomization}
                  buyLoading={buyLoading}
                  cartLoading={cartLoading}
                  commerceToast={commerceToast}
                  onCustomize={() => setCustomizeOpen(true)}
                  onPriceBreakdown={() => setBreakdownOpen(true)}
                  onBuyNow={() => void runQuickCheckout(true)}
                  onAddToCart={() => void runQuickCheckout(false)}
                />
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

        <ProductRecommendedSection slug={slug} product={product} />
      </div>

      <div className="product-detail-commerce-dock">
        <ProductCommerceActions
          layout="row"
          buyLoading={buyLoading}
          cartLoading={cartLoading}
          onBuyNow={() => void runQuickCheckout(true)}
          onAddToCart={() => void runQuickCheckout(false)}
        />
        {commerceToast ? (
          <p className="product-detail-commerce-toast product-animate-in" role="status">
            {commerceToast}
          </p>
        ) : null}
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
        open={hasCustomization && customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        initialSelection={confirmedSelection}
        selectionSyncKey={customizeSyncKey}
        onSelectionChange={setLiveSelection}
        onConfirm={(snapshot) => {
          setConfirmedSelection(snapshot.selections);
          setLiveSelection(null);
        }}
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
          metalLabel={pricing.metalLabel}
          diamondLabel={pricing.diamondLabel}
          loading={pricing.loading}
          optionLines={pricing.optionLines}
          optionAdjustments={pricing.optionAdjustments}
          displayTotal={pricing.totalPrice}
          embedded
        />
      </ProductContentModal>
    </>
  );
}

export default function ProductDetailClient({
  slug,
  initialProduct = null,
}: ProductDetailClientProps) {
  const seed = useProductDetailSeed(slug, initialProduct);
  const [apiProduct, setApiProduct] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const productRef = useRef<Product | null>(initialProduct ?? seed);
  const mountFetchDone = useRef(false);

  const product = useMemo(
    () => apiProduct ?? seed ?? initialProduct,
    [apiProduct, seed, initialProduct]
  );

  useEffect(() => {
    productRef.current = product;
  }, [product]);

  useEffect(() => {
    setApiProduct(null);
    setError("");
    setRefreshing(false);
  }, [slug]);

  const refreshProduct = useCallback(
    async (options?: { silent?: boolean; signal?: AbortSignal }) => {
      const silent = options?.silent === true;
      const hasProduct = Boolean(productRef.current);

      if (hasProduct && silent) {
        setRefreshing(true);
      } else if (!hasProduct) {
        setError("");
      }

      const applyProduct = (next: Product) => {
        writeProductDetailCache(slug, next);
        setApiProduct(next);
        productRef.current = next;
        setError("");
      };

      try {
        const inflight = getInflightProductDetail(slug);
        if (inflight) {
          const prefetched = await inflight;
          if (options?.signal?.aborted) return;
          if (prefetched) {
            applyProduct(prefetched);
            return;
          }
        }

        const response = await fetch(`/api/product/${encodeURIComponent(slug)}`, {
          signal: options?.signal,
        });
        const data = await parseJsonResponse<{
          success?: boolean;
          error?: string;
          product?: Product;
        }>(response);

        if (!response.ok || !data?.success || !data.product) {
          throw new Error(
            typeof data?.error === "string" ? data.error : "Product not found"
          );
        }

        applyProduct(data.product);
      } catch (e: unknown) {
        if (options?.signal?.aborted) return;
        const message = e instanceof Error ? e.message : "Something went wrong";
        if (!silent && !productRef.current) {
          setError(message);
          setApiProduct(null);
        }
      } finally {
        setRefreshing(false);
      }
    },
    [slug]
  );

  const handleHistoryReturn = useCallback(() => {
    const cached = readProductDetailCache(slug);
    if (cached) {
      setApiProduct(cached);
      productRef.current = cached;
      setError("");
    }
    void refreshProduct({ silent: true });
  }, [slug, refreshProduct]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    mountFetchDone.current = false;

    const hasSeed = Boolean(
      initialProduct ?? readProductDetailCache(slug) ?? readListProductSnapshot(slug)
    );
    if (!hasSeed) {
      setError("");
    }

    void refreshProduct({ silent: hasSeed, signal: controller.signal }).then(() => {
      if (!cancelled) {
        mountFetchDone.current = true;
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug, initialProduct, refreshProduct]);

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

  if (!product) {
    if (error) {
      return (
        <div className="product-detail-page product-state-center">
          <div className="product-state-card">
            <h1>{copy.unavailableTitle}</h1>
            <p>{error}</p>
            <Link href="/products" className="product-btn-primary">
              {copy.backToShop}
            </Link>
          </div>
        </div>
      );
    }

    return <ProductDetailSkeleton />;
  }

  return (
    <div
      className={`product-detail-page${refreshing ? " product-detail-page--refreshing" : ""}`}
    >
      {refreshing ? (
        <span className="product-detail-refresh-bar" aria-hidden />
      ) : null}
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
        <ProductDetailLoaded key={slug} product={product} slug={slug} />
      </div>
    </div>
  );
}
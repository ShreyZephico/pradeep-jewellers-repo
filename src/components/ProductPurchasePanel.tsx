"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";
import { formatProductPrice } from "@/utils/formatPrice";
import { isKaratLabel, resolveKaratFromSelection } from "@/utils/karat";
import { findBestMatchingVariant } from "@/utils/variantOptionMatch";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import ProductCommerceActions from "@/components/ProductCommerceActions";
import PriceCalculationBreakdown from "@/components/PriceCalculationBreakdown";
import { useCart } from "@/contexts/CartContext";
import {
  addProductToCart,
  handleCheckoutAuthFailure,
  startProductCheckout,
} from "@/lib/productCheckout";
import productContent from "@/lib/productContent";
import { getCustomizationValidationError } from "@/utils/productCustomization";

export { formatProductPrice };

const copy = productContent.purchase;

function optionClass(selected: boolean, center?: boolean) {
  return [
    "product-option-btn",
    center ? "product-option-btn--center" : "",
    selected ? "product-option-btn--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export type ProductPurchasePanelProps = {
  product: Product;
  /** When true, shows the compact image + title summary (modal layout). */
  showDesignSummary?: boolean;
  /** Dark header row with price (modal) vs subtle card (page). */
  priceHeaderVariant?: "modal" | "page";
  onClose?: () => void;
  checkoutButtonLabel?: string;
  /**
   * `storefront-cart` — Storefront cart with variant GID only (`createCheckout` in shopify.ts); pricing from Shopify.
   * `customer-session` — `/api/checkout` (requires logged-in Shopify customer).
   */
  checkoutFlow?: "customer-session" | "storefront-cart";
};

export default function ProductPurchasePanel({
  product,
  showDesignSummary = true,
  priceHeaderVariant = "modal",
  onClose,
  checkoutButtonLabel,
}: ProductPurchasePanelProps) {
  const { refreshCart, goToCart } = useCart();
  const [buyLoading, setBuyLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [cartToast, setCartToast] = useState("");
  const karatPickerOptions =
    product.caratOptions?.length
      ? product.caratOptions
      : product.metalOptions?.every((o) => isKaratLabel(o.label))
        ? product.metalOptions
        : [];

  const metalPickerOptions =
    product.metalOptions?.filter((o) => !isKaratLabel(o.label)) ?? [];

  const [selectedMetal, setSelectedMetal] = useState("");
  const [selectedCarat, setSelectedCarat] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const hasMetalOptions = metalPickerOptions.length > 0;
  const hasCaratOptions = karatPickerOptions.length > 0;

  const selectKarat = (label: string) => {
    setSelectedCarat(label);
    if (product.metalOptions?.some((o) => o.label === label && isKaratLabel(label))) {
      setSelectedMetal(label);
    }
  };
  const hasDiamondOptions = Boolean(product.diamondQualities?.length);
  const hasSizeOptions = Boolean(product.sizeOptions?.length);
  const selectedMetalOption = product.metalOptions?.find(
    (option) => option.label === selectedMetal
  );
  const selectedCaratOption = product.caratOptions?.find(
    (option) => option.label === selectedCarat
  );
  const selectedQualityOption = product.diamondQualities?.find(
    (option) => option.label === selectedQuality
  );
  const selectedSizeOption = product.sizeOptions?.find(
    (option) => option.size === selectedSize
  );
  const karatLabel = resolveKaratFromSelection(selectedMetal, selectedCarat);

  const selectedVariant = findBestMatchingVariant(product.variants, {
    metal: selectedMetal,
    carat: selectedCarat,
    quality: selectedQuality,
    size: selectedSize,
    karatLabel,
  });

  const selectedVariantId = selectedVariant?.id ?? product.variantId ?? "";

  const baseWeight =
    selectedVariant?.weight ??
    product.variants?.find((v) => v.weight && v.weight > 0)?.weight ??
    5;

  const variantPrice = selectedVariant?.price ?? product.price;
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<VariantPriceBreakdown | null>(
    null
  );
  const [priceLoading, setPriceLoading] = useState(false);

  const optionAdjustments =
    (selectedMetalOption?.priceAdjustment ?? 0) +
    (selectedCaratOption?.priceAdjustment ?? 0) +
    (selectedQualityOption?.priceAdjustment ?? 0) +
    (selectedSizeOption?.priceAdjustment ?? 0);

  useEffect(() => {
    let cancelled = false;
    setLivePrice(variantPrice);

    const recalculate = async () => {
      setPriceLoading(true);
      try {
        const response = await fetch("/api/price/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weight: baseWeight,
            carat: karatLabel ?? null,
          }),
        });
        const data = await response.json();
        if (!cancelled && data.success && typeof data.finalPrice === "number") {
          setLivePrice(data.finalPrice);
          setPriceBreakdown({
            purity: data.purity,
            karat: data.karat,
            base24KGoldPrice: data.base24KGoldPrice,
            adjustedGoldPrice: data.adjustedGoldPrice,
            perGramRate: data.perGramRate,
            actualGoldPrice: data.actualGoldPrice,
            makingCharge: data.makingCharge,
            subtotal: data.subtotal,
            gst: data.gst,
            finalPrice: data.finalPrice,
          });
        } else if (!cancelled) {
          setLivePrice(variantPrice);
          setPriceBreakdown(null);
        }
      } catch {
        if (!cancelled) {
          setLivePrice(variantPrice);
          setPriceBreakdown(null);
        }
      } finally {
        if (!cancelled) {
          setPriceLoading(false);
        }
      }
    };

    void recalculate();
    return () => {
      cancelled = true;
    };
  }, [
    karatLabel,
    baseWeight,
    selectedMetal,
    selectedCarat,
    selectedQuality,
    selectedSize,
    variantPrice,
  ]);
  const catalogVariantIdForCheckout =
    selectedVariantId.startsWith("gid://shopify/ProductVariant/")
      ? undefined
      : selectedVariant?.catalogVariantId ??
        product.variants?.find(
          (v) =>
            v.catalogVariantId === selectedVariantId ||
            v.id === selectedVariantId
        )?.catalogVariantId;
  const productSlugForCheckout = (product.slug ?? product.handle ?? "").trim();
  const estimatedPrice = (livePrice ?? variantPrice) + optionAdjustments;
  const selectedImage = selectedVariant?.image ?? product.image;
  const listPrice = product.compareAtPrice ?? 0;

  const buildLineAttributes = () => {
    const attributes: { key: string; value: string }[] = [];
    if (selectedMetal) {
      attributes.push({ key: "Metal", value: selectedMetal });
    }
    if (selectedCarat) {
      attributes.push({ key: "Carat", value: selectedCarat });
    }
    if (selectedQuality) {
      attributes.push({ key: "Diamond Quality", value: selectedQuality });
    }
    if (selectedSize) {
      attributes.push({ key: "Ring Size", value: selectedSize });
    }
    return attributes;
  };

  const handleCheckout = async (redirect: boolean) => {
    const optionsError = getCustomizationValidationError(product, {
      metal: selectedMetal,
      carat: selectedCarat,
      quality: selectedQuality,
      size: selectedSize,
    });
    if (optionsError) {
      setCheckoutError(optionsError);
      return;
    }

    if (!selectedVariantId) {
      setCheckoutError(copy.selectOptionsError);
      return;
    }

    setCheckoutError("");
    setCartToast("");
    const setLoading = redirect ? setBuyLoading : setCartLoading;
    setLoading(true);

    if (redirect) {
      const result = await startProductCheckout({
        product,
        variantId: selectedVariantId,
        catalogVariantId: catalogVariantIdForCheckout,
        customPrice: estimatedPrice,
        attributes: buildLineAttributes(),
        redirect: true,
      });
      setLoading(false);
      if (!result.ok) {
        handleCheckoutAuthFailure(result);
        if (!result.needsLogin) setCheckoutError(result.error);
      }
      return;
    }

    const result = await addProductToCart({
      product,
      variantId: selectedVariantId,
      catalogVariantId: catalogVariantIdForCheckout,
      customPrice: estimatedPrice,
      attributes: buildLineAttributes(),
      priceBreakdown: priceBreakdown ?? undefined,
      weightGrams: baseWeight,
      karatLabel,
      optionAdjustments,
    });

    setLoading(false);

    if (!result.ok) {
      handleCheckoutAuthFailure(result);
      if (!result.needsLogin) setCheckoutError(result.error);
      return;
    }

    await refreshCart();
    goToCart();
    setCartToast(productContent.commerce.addedToCart);
    window.setTimeout(() => setCartToast(""), 3200);
  };

  const isPage = priceHeaderVariant === "page";

  return (
    <div className="product-purchase">
      <div
        className={`product-purchase-price-header product-purchase-price-header--${
          isPage ? "page" : "modal"
        }`}
      >
        <div>
          <p
            className={`product-purchase-price-label product-purchase-price-label--${
              isPage ? "page" : "modal"
            }`}
          >
            {copy.yourPrice}
          </p>
          <div className="product-purchase-price-row">
            <p
              className={`product-purchase-price-main product-purchase-price-main--${
                isPage ? "page" : "modal"
              }${priceLoading ? " product-purchase-price-main--loading" : ""}`}
            >
              {priceLoading ? copy.priceLoading : formatProductPrice(estimatedPrice)}
            </p>
            {listPrice > estimatedPrice ? (
              <p className={`product-purchase-price-strike--${isPage ? "page" : "modal"}`}>
                {formatProductPrice(listPrice)}
              </p>
            ) : null}
          </div>
          {isPage ? <p className="product-purchase-price-note">{copy.gstNote}</p> : null}
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.closeModalAria}
            className="product-purchase-close"
          >
            <span className="product-purchase-close-icon">×</span>
          </button>
        ) : null}
      </div>

      {!isPage ? (
        <div className="product-purchase-top-actions">
          <ProductCommerceActions
            buyLoading={buyLoading}
            cartLoading={cartLoading}
            onBuyNow={() => void handleCheckout(true)}
            onAddToCart={() => void handleCheckout(false)}
          />
          {cartToast ? (
            <p className="product-purchase-cart-toast product-animate-in" role="status">
              {cartToast}
            </p>
          ) : null}
        </div>
      ) : null}

      {priceHeaderVariant === "page" ? (
        <PriceCalculationBreakdown
          breakdown={priceBreakdown}
          weightGrams={baseWeight}
          karatLabel={karatLabel}
          loading={priceLoading}
          optionAdjustments={optionAdjustments}
          displayTotal={estimatedPrice}
        />
      ) : null}

      <div className="product-purchase-body">
        {showDesignSummary ? (
          <section className="product-purchase-summary">
            <div className="product-purchase-summary-img-wrap">
              <Image
                src={selectedImage}
                alt={product.name}
                width={220}
                height={180}
                className="product-purchase-summary-img"
              />
            </div>

            <div>
              <p className="product-purchase-summary-eyebrow">{copy.selectedDesign}</p>
              <h3 className="product-item-title product-item-title--summary">
                {product.name}
              </h3>
              <p className="product-purchase-summary-desc">{product.description}</p>
              {product.customizable ? (
                <p className="product-purchase-custom-note">{copy.customizableNote}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {hasMetalOptions ? (
          <section>
            <h3 className="product-purchase-section-title">
              {product.metalOptionName ?? copy.metalOptionDefault}
            </h3>
            <div className="product-purchase-options">
              {metalPickerOptions.map((option) => {
                const isSelected = selectedMetal === option.label;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedMetal(option.label)}
                    className={optionClass(isSelected)}
                  >
                    <span className="product-option-btn-label">{option.label}</span>
                    {option.note ? (
                      <span className="product-option-btn-note">
                        {option.note}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {hasCaratOptions ? (
          <section>
            <h3 className="product-purchase-section-title">
              {product.caratOptionName ?? copy.caratOptionDefault}
            </h3>
            <p className="product-purchase-section-hint">{copy.caratHint}</p>
            <div className="product-purchase-options">
              {karatPickerOptions.map((option) => {
                const isSelected =
                  selectedCarat === option.label ||
                  (isKaratLabel(option.label) && selectedMetal === option.label);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => selectKarat(option.label)}
                    className={optionClass(isSelected)}
                  >
                    <span className="product-option-btn-label">{option.label}</span>
                    {option.note ? (
                      <span className="product-option-btn-note">
                        {option.note}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {hasDiamondOptions ? (
          <section>
            <div className="product-purchase-section-header">
              <h3 className="product-purchase-section-title">
                {product.diamondOptionName ?? copy.diamondOptionDefault}
              </h3>
              <button type="button" className="product-purchase-guide-link">
                {copy.diamondGuide}
              </button>
            </div>
            <div className="product-purchase-options">
              {product.diamondQualities?.map((option) => {
                const isSelected = selectedQuality === option.label;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedQuality(option.label)}
                    className={optionClass(isSelected)}
                  >
                    <span className="product-option-btn-label">{option.label}</span>
                    {option.note ? (
                      <span className="product-option-btn-note">
                        {option.note}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {hasSizeOptions ? (
          <section>
            <div className="product-purchase-section-header">
              <h3 className="product-purchase-section-title">
                {product.sizeOptionName ?? copy.sizeOptionDefault}
              </h3>
              <button type="button" className="product-purchase-guide-link">
                {copy.sizeGuide}
              </button>
            </div>
            <div className="product-purchase-options product-purchase-options--size">
              {product.sizeOptions?.map((option) => {
                const isSelected = selectedSize === option.size;
                return (
                  <button
                    key={option.size}
                    type="button"
                    onClick={() => setSelectedSize(option.size)}
                    className={optionClass(isSelected, true)}
                  >
                    <span className="product-option-btn-size">{option.size}</span>
                    {option.mm ? (
                      <span className="product-option-btn-mm">{option.mm}</span>
                    ) : null}
                    {option.note ? (
                      <span className="product-option-btn-note product-option-btn-note--sm">
                        {option.note}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {(checkoutError || isPage) ? (
        <div className="product-purchase-footer">
          {checkoutError ? <p className="product-purchase-error">{checkoutError}</p> : null}
          {isPage ? (
            <ProductCommerceActions
              buyLoading={buyLoading}
              cartLoading={cartLoading}
              onBuyNow={() => void handleCheckout(true)}
              onAddToCart={() => void handleCheckout(false)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}



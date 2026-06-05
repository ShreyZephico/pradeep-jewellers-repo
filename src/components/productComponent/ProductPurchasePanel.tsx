"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatProductPrice } from "@/utils/formatPrice";
import { isKaratLabel, resolveKaratFromSelection } from "@/utils/karat";
import { findBestMatchingVariant } from "@/utils/variantOptionMatch";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import ProductCommerceActions from "@/components/productComponent/ProductCommerceActions";
import PriceCalculationBreakdown from "@/components/productComponent/PriceCalculationBreakdown";
import { useCart } from "@/contexts/CartContext";
import { parsePriceCalculateResponse } from "@/lib/priceCalculateResponse";
import {
  addProductToCart,
  startProductCheckout,
} from "@/lib/productCheckout";
import productContent, { formatProductCopy } from "@/lib/productContent";
import "@/styles/ProductPurchasePanel.css";
import { buildPriceBreakdownOptionLines } from "@/utils/priceBreakdownOptions";
import {
  getCustomizationValidationError,
  applyCustomizationDefaults,
  customizationCatalogRevision,
  getDefaultProductCustomization,
  getProductCustomizationPickers,
  buildCustomizationLineAttributes,
  type ConfirmedCustomizationSnapshot,
  type CustomizationField,
  type CustomizationSelections,
} from "@/utils/productCustomization";
import {
  formatRingSizeMm,
  parseRingSizeInput,
  parseStoredRingSize,
  resolveRingSizeSelection,
  type RingSizeInputMode,
} from "@/utils/ringSizeChart";
import {
  getSizeSpecLabel,
  getSizeValidationMessage,
  inferJewelryCategory,
} from "@/utils/productCustomizationLabels";

export { formatProductPrice };

const copy = productContent.purchase;

function optionClass(selected: boolean, center?: boolean, invalid?: boolean) {
  return [
    "product-option-btn",
    center ? "product-option-btn--center" : "",
    selected ? "product-option-btn--selected" : "",
    invalid ? "product-option-btn--invalid-hint" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export type ProductPurchasePanelProps = {
  product: Product;
  showDesignSummary?: boolean;
  priceHeaderVariant?: "modal" | "page";
  onClose?: () => void;
  checkoutButtonLabel?: string;
  checkoutFlow?: "customer-session" | "storefront-cart";
  initialSelection?: CustomizationSelections;
  selectionSyncKey?: string | number;
  onConfirm?: (snapshot: ConfirmedCustomizationSnapshot) => void;
  /** Live picker values (e.g. gallery preview while customize modal is open). */
  onSelectionChange?: (selection: CustomizationSelections) => void;
};

export default function ProductPurchasePanel({
  product,
  showDesignSummary = true,
  priceHeaderVariant = "modal",
  onClose,
  initialSelection,
  selectionSyncKey,
  onConfirm,
  onSelectionChange,
}: ProductPurchasePanelProps) {
  const { refreshCart, goToCart } = useCart();
  const [buyLoading, setBuyLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [cartToast, setCartToast] = useState("");
  const [errorField, setErrorField] = useState<CustomizationField | null>(null);

  const metalRef = useRef<HTMLElement>(null);
  const caratRef = useRef<HTMLElement>(null);
  const diamondRef = useRef<HTMLElement>(null);
  const sizeRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const customSizeInputId = useId();
  const pickers = getProductCustomizationPickers(product);
  const catalogRevision = customizationCatalogRevision(product);
  const emptySelection: CustomizationSelections = {
    metal: "",
    carat: "",
    quality: "",
    size: "",
  };
  const resolvedInitial = applyCustomizationDefaults(
    initialSelection ?? emptySelection,
    product
  );

  const [selectedMetal, setSelectedMetal] = useState(resolvedInitial.metal);
  const [selectedCarat, setSelectedCarat] = useState(resolvedInitial.carat);
  const [selectedQuality, setSelectedQuality] = useState(resolvedInitial.quality);
  const isRingProduct = inferJewelryCategory(product) === "ring";
  const initialRingSize = isRingProduct
    ? parseStoredRingSize(resolvedInitial.size)
    : null;
  const [selectedSize, setSelectedSize] = useState(() =>
    isRingProduct
      ? initialRingSize?.selectedSize || "5"
      : resolvedInitial.size
  );
  const [customSizeActive, setCustomSizeActive] = useState(
    () => (isRingProduct && initialRingSize?.customActive) ?? false
  );
  const [customSizeInput, setCustomSizeInput] = useState(
    () => (isRingProduct ? initialRingSize?.customInput : "") ?? ""
  );
  const [customSizeInputMode, setCustomSizeInputMode] = useState<RingSizeInputMode>(
    () => initialRingSize?.customInputMode ?? "indian"
  );

  const ringSizeResolution = useMemo(() => {
    if (!isRingProduct) {
      return null;
    }
    return resolveRingSizeSelection({
      customActive: customSizeActive,
      customInput: customSizeInput,
      selectedSize,
      customInputMode: customSizeInputMode,
    });
  }, [
    isRingProduct,
    customSizeActive,
    customSizeInput,
    selectedSize,
    customSizeInputMode,
  ]);

  const effectiveSize = isRingProduct
    ? (ringSizeResolution?.orderValue ?? "")
    : customSizeActive
      ? customSizeInput.trim()
      : selectedSize;
  const sizeForVariantMatch = isRingProduct
    ? (ringSizeResolution?.matchValue ?? selectedSize)
    : effectiveSize;

  const customSizeHint = useMemo(() => {
    if (!isRingProduct || !customSizeActive) {
      return null;
    }
    const parsed = parseRingSizeInput(customSizeInput, customSizeInputMode);
    if (parsed.kind === "empty") {
      return null;
    }
    if (parsed.kind === "invalid") {
      return null;
    }
    if (parsed.kind === "standard") {
      return formatProductCopy(copy.customSizeHintStandard, {
        size: parsed.size,
        mm: formatRingSizeMm(parsed.mm),
      });
    }
    if (parsed.kind === "half") {
      return formatProductCopy(copy.customSizeHintHalf, {
        size: parsed.size,
        mm: formatRingSizeMm(parsed.mm),
      });
    }
    if (parsed.nearestSize && parsed.nearestMm != null) {
      return formatProductCopy(copy.customSizeHintMm, {
        size: parsed.nearestSize,
        mm: formatRingSizeMm(parsed.nearestMm),
      });
    }
    return formatRingSizeMm(parsed.mm);
  }, [isRingProduct, customSizeActive, customSizeInput, customSizeInputMode, copy]);

  const hasMetalOptions = pickers.showMetal;
  const hasCaratOptions = pickers.showCarat;
  const hasDiamondOptions = pickers.showDiamond;
  const hasSizeOptions = pickers.showSize;

  const selectKarat = (label: string) => {
    setSelectedCarat(label);
    if (product.metalOptions?.some((o) => o.label === label && isKaratLabel(label))) {
      setSelectedMetal(label);
    }
  };

  const selectedMetalOption = product.metalOptions?.find(
    (option) => option.label === selectedMetal
  );
  const selectedCaratOption = product.caratOptions?.find(
    (option) => option.label === selectedCarat
  );
  const selectedQualityOption = pickers.diamond.find(
    (option) => option.label === selectedQuality
  );
  const selectedSizeLookup =
    isRingProduct && ringSizeResolution?.standardSize
      ? ringSizeResolution.standardSize
      : effectiveSize;
  const selectedSizeOption =
    pickers.sizes.find((option) => option.size === selectedSizeLookup) ??
    (effectiveSize ? { size: effectiveSize, priceAdjustment: 0 } : undefined);
  const karatLabel = resolveKaratFromSelection(selectedMetal, selectedCarat);

  const selectedVariant = findBestMatchingVariant(product.variants, {
    metal: selectedMetal,
    carat: selectedCarat,
    quality: selectedQuality,
    size: sizeForVariantMatch,
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

  const optionBreakdownLines = buildPriceBreakdownOptionLines({
    metal: selectedMetalOption ?? null,
    carat: selectedCaratOption ?? null,
    quality: selectedQualityOption ?? null,
    size: selectedSizeOption ?? null,
    product,
  });

  const isPage = priceHeaderVariant === "page";
  const isModal = !isPage;

  const scrollToField = useCallback((field: CustomizationField) => {
    const refs: Record<CustomizationField, RefObject<HTMLElement | null>> = {
      metal: metalRef,
      carat: caratRef,
      diamond: diamondRef,
      size: sizeRef,
    };
    const target = refs[field].current;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    footerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const clearFeedback = useCallback(() => {
    setCheckoutError("");
    setCartToast("");
    setErrorField(null);
  }, []);

  const applySelectionState = useCallback(
    (selection: CustomizationSelections) => {
      const merged = applyCustomizationDefaults(selection, product);
      setSelectedMetal(merged.metal);
      setSelectedCarat(merged.carat);
      setSelectedQuality(merged.quality);
      if (isRingProduct) {
        const restored = parseStoredRingSize(merged.size);
        setCustomSizeActive(restored.customActive);
        setCustomSizeInput(restored.customInput);
        setCustomSizeInputMode(restored.customInputMode);
        setSelectedSize(restored.selectedSize || "5");
      } else {
        setCustomSizeActive(false);
        setCustomSizeInput("");
        setSelectedSize(merged.size);
      }
    },
    [isRingProduct, product]
  );

  const lastAppliedCatalogRevision = useRef<string | null>(null);

  useEffect(() => {
    if (selectionSyncKey === undefined) return;
    applySelectionState(initialSelection ?? emptySelection);
    clearFeedback();
  }, [
    selectionSyncKey,
    initialSelection,
    applySelectionState,
    clearFeedback,
  ]);

  useEffect(() => {
    if (lastAppliedCatalogRevision.current === catalogRevision) {
      return;
    }
    lastAppliedCatalogRevision.current = catalogRevision;
    applySelectionState({
      metal: selectedMetal,
      carat: selectedCarat,
      quality: selectedQuality,
      size: effectiveSize,
    });
  }, [
    catalogRevision,
    applySelectionState,
    selectedMetal,
    selectedCarat,
    selectedQuality,
    effectiveSize,
  ]);

  useEffect(() => {
    clearFeedback();
  }, [selectedMetal, selectedCarat, selectedQuality, selectedSize, clearFeedback]);

  useEffect(() => {
    onSelectionChange?.({
      metal: selectedMetal,
      carat: selectedCarat,
      quality: selectedQuality,
      size: effectiveSize,
    });
  }, [
    selectedMetal,
    selectedCarat,
    selectedQuality,
    effectiveSize,
    onSelectionChange,
  ]);

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
            makingChargePercent: product.makingChargePercent ?? null,
          }),
        });
        const pricing = await parsePriceCalculateResponse(response);
        if (!cancelled && pricing) {
          setLivePrice(pricing.finalPrice);
          setPriceBreakdown(pricing.breakdown);
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
    effectiveSize,
    variantPrice,
    product.makingChargePercent,
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

  const estimatedPrice = (livePrice ?? variantPrice) + optionAdjustments;
  const selectedImage = selectedVariant?.image ?? product.image;
  const listPrice = product.compareAtPrice ?? 0;

  const buildLineAttributes = () =>
    buildCustomizationLineAttributes(product, {
      metal: selectedMetal,
      carat: selectedCarat,
      quality: selectedQuality,
      size: effectiveSize,
    });

  const showValidationError = (message: string, field: CustomizationField) => {
    setCheckoutError(message);
    setErrorField(field);
    setCartToast("");
    scrollToField(field);
    footerRef.current?.focus({ preventScroll: true });
  };

  const validateSizeSelection = (): boolean => {
    if (!hasSizeOptions) {
      return true;
    }
    if (customSizeActive) {
      if (!customSizeInput.trim()) {
        showValidationError(copy.errorCustomSize, "size");
        return false;
      }
      if (isRingProduct && ringSizeResolution?.inputKind === "invalid") {
        showValidationError(
          customSizeInputMode === "mm"
            ? copy.errorCustomSizeInvalidMm
            : copy.errorCustomSizeInvalidIndian,
          "size"
        );
        return false;
      }
      return true;
    }
    if (!selectedSize.trim()) {
      showValidationError(getSizeValidationMessage(product), "size");
      return false;
    }
    return true;
  };

  const handleCheckout = async (redirect: boolean) => {
    const validation = getCustomizationValidationError(product, {
      metal: selectedMetal,
      carat: selectedCarat,
      quality: selectedQuality,
      size: effectiveSize,
    });
    if (validation) {
      showValidationError(validation.message, validation.field);
      return;
    }

    if (!validateSizeSelection()) {
      return;
    }

    if (!selectedVariantId) {
      showValidationError(copy.selectOptionsError, hasSizeOptions ? "size" : "metal");
      return;
    }

    setCheckoutError("");
    setErrorField(null);
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
        priceBreakdown: priceBreakdown ?? undefined,
        weightGrams: baseWeight,
        karatLabel,
        optionAdjustments,
        redirect: true,
      });
      setLoading(false);
      if (!result.ok) {
        setCheckoutError(result.error);
        footerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
      setCheckoutError(result.error);
      footerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    await refreshCart();
    setCheckoutError("");
    setErrorField(null);
    setCartToast(productContent.commerce.addedToCart);
    window.setTimeout(() => setCartToast(""), 3200);
    goToCart();
  };

  const handleConfirm = () => {
    const validation = getCustomizationValidationError(product, {
      metal: selectedMetal,
      carat: selectedCarat,
      quality: selectedQuality,
      size: effectiveSize,
    });
    if (validation) {
      showValidationError(validation.message, validation.field);
      return;
    }

    if (!validateSizeSelection()) {
      return;
    }

    if (!selectedVariantId) {
      showValidationError(copy.selectOptionsError, hasSizeOptions ? "size" : "metal");
      return;
    }

    const snapshot: ConfirmedCustomizationSnapshot = {
      selections: {
        metal: selectedMetal,
        carat: selectedCarat,
        quality: selectedQuality,
        size: effectiveSize,
      },
      estimatedPrice,
      priceBreakdown,
      weightGrams: baseWeight,
      karatLabel,
      optionAdjustments,
      variantId: selectedVariantId,
      catalogVariantId: catalogVariantIdForCheckout,
    };

    setCheckoutError("");
    setErrorField(null);
    onConfirm?.(snapshot);
    onClose?.();
  };

  const sectionInvalid = (field: CustomizationField) => errorField === field;

  const priceDisplay = (
    <div className="product-purchase-price-block">
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
      {isModal ? (
        <p className="product-purchase-modal-gst">{copy.modalGstNote}</p>
      ) : (
        <p className="product-purchase-price-note">{copy.gstNote}</p>
      )}
    </div>
  );

  const actionFooter = (
    <footer
      ref={footerRef}
      className={isModal ? "product-purchase-sticky-footer" : "product-purchase-footer"}
      tabIndex={-1}
    >
      {checkoutError ? (
        <div className="product-purchase-feedback product-purchase-feedback--error" role="alert">
          <span className="product-purchase-feedback-icon" aria-hidden>
            !
          </span>
          <p>{checkoutError}</p>
        </div>
      ) : null}

      {cartToast ? (
        <div className="product-purchase-feedback product-purchase-feedback--success" role="status">
          <span className="product-purchase-feedback-icon" aria-hidden>
            ✓
          </span>
          <p>{cartToast}</p>
        </div>
      ) : null}

      {isModal ? (
        <p className="product-purchase-footer-note">{copy.footerSecureNote}</p>
      ) : null}

      {isModal && onConfirm ? (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={buyLoading || cartLoading || priceLoading}
          className="product-commerce-btn-confirm"
        >
          {copy.confirmSelection}
        </button>
      ) : null}

      {/* <ProductCommerceActions
        layout="row"
        buyLoading={buyLoading}
        cartLoading={cartLoading}
        onBuyNow={() => void handleCheckout(true)}
        onAddToCart={() => void handleCheckout(false)}
      /> */}
    </footer>
  );

  return (
    <div className={`product-purchase${isModal ? " product-purchase--modal" : ""}`}>
      {isModal ? (
        <header className="product-purchase-modal-head">
          <div className="product-purchase-modal-head-copy">
            <div className="product-purchase-modal-thumb" aria-hidden>
              <Image
                src={selectedImage}
                alt=""
                width={52}
                height={52}
                className="product-purchase-modal-thumb-img"
              />
            </div>
            <div className="product-purchase-modal-head-text">
              <h2 className="product-purchase-modal-title">{product.name}</h2>
            </div>
          </div>
          <div className="product-purchase-modal-head-aside">
            {priceDisplay}
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label={copy.closeModalAria}
                className="product-purchase-close product-purchase-close--modal"
              >
                <span className="product-purchase-close-icon" aria-hidden>
                  ×
                </span>
              </button>
            ) : null}
          </div>
        </header>
      ) : (
        <div className="product-purchase-price-header product-purchase-price-header--page">
          {priceDisplay}
        </div>
      )}

      <div
        className={`product-purchase-body${isModal ? " product-purchase-modal-scroll" : ""}`}
      >
        {showDesignSummary && !isModal ? (
          <section
            className={`product-purchase-summary${
              isModal ? " product-purchase-summary--modal" : ""
            }`}
          >
            <div className="product-purchase-summary-img-wrap">
              <Image
                src={selectedImage}
                alt={product.name}
                width={220}
                height={180}
                className="product-purchase-summary-img"
              />
            </div>
            <div className="product-purchase-summary-text">
              <p className="product-purchase-summary-eyebrow">{copy.selectedDesign}</p>
              <h3 className="product-purchase-summary-title">{product.name}</h3>
              {!isModal ? (
                <p className="product-purchase-summary-desc">{product.description}</p>
              ) : null}
              {product.customizable ? (
                <p className="product-purchase-custom-note">{copy.customizableNote}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {hasMetalOptions ? (
          <section
            ref={metalRef}
            className={`product-purchase-section${
              sectionInvalid("metal") ? " product-purchase-section--invalid" : ""
            }`}
          >
            <h3 className="product-purchase-section-title">
              {product.metalOptionName ?? copy.metalOptionDefault}
              <span className="product-purchase-required" aria-hidden>
                *
              </span>
            </h3>
            <div className="product-purchase-options product-purchase-options--metal">
              {pickers.metal.map((option) => {
                const isSelected = selectedMetal === option.label;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedMetal(option.label)}
                    className={optionClass(isSelected, false, sectionInvalid("metal"))}
                    aria-pressed={isSelected}
                  >
                    <span className="product-option-btn-label">{option.label}</span>
                    {option.note ? (
                      <span className="product-option-btn-note">{option.note}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {hasCaratOptions ? (
          <section
            ref={caratRef}
            className={`product-purchase-section${
              sectionInvalid("carat") ? " product-purchase-section--invalid" : ""
            }`}
          >
            <h3 className="product-purchase-section-title">
              {product.caratOptionName ?? copy.caratOptionDefault}
              <span className="product-purchase-required" aria-hidden>
                *
              </span>
            </h3>
            <p className="product-purchase-section-hint">{copy.caratHint}</p>
            <div className="product-purchase-options product-purchase-options--metal">
              {pickers.carat.map((option) => {
                const isSelected =
                  selectedCarat === option.label ||
                  (isKaratLabel(option.label) && selectedMetal === option.label);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => selectKarat(option.label)}
                    className={optionClass(isSelected, false, sectionInvalid("carat"))}
                    aria-pressed={isSelected}
                  >
                    <span className="product-option-btn-label">{option.label}</span>
                    {option.note ? (
                      <span className="product-option-btn-note">{option.note}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {hasDiamondOptions ? (
          <section
            ref={diamondRef}
            className={`product-purchase-section${
              sectionInvalid("diamond") ? " product-purchase-section--invalid" : ""
            }`}
          >
            <div className="product-purchase-section-header">
              <h3 className="product-purchase-section-title">
                {product.diamondOptionName ?? copy.diamondOptionDefault}
                <span className="product-purchase-required" aria-hidden>
                  *
                </span>
              </h3>
              <Link
                href="/diamond-guide"
                className="product-purchase-guide-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.diamondGuide}
              </Link>
            </div>
            <div className="product-purchase-options product-purchase-options--diamond">
              {pickers.diamond.map((option) => {
                const isSelected = selectedQuality === option.label;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedQuality(option.label)}
                    className={optionClass(isSelected, false, sectionInvalid("diamond"))}
                    aria-pressed={isSelected}
                  >
                    <span className="product-option-btn-label">{option.label}</span>
                    {option.note ? (
                      <span className="product-option-btn-note">{option.note}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {hasSizeOptions ? (
          <section
            ref={sizeRef}
            className={`product-purchase-section${
              sectionInvalid("size") ? " product-purchase-section--invalid" : ""
            }`}
          >
            <div className="product-purchase-section-header">
              <h3 className="product-purchase-section-title">
                {product.sizeOptionName ?? getSizeSpecLabel(product)}
                <span className="product-purchase-required" aria-hidden>
                  *
                </span>
              </h3>
              <a
                href="https://workdrive.zohoexternal.in/external/80ca836e76f8383e2afda8491fcd9ded5ffe8cfa495029d905efa26a121f6c52/download"
                className="product-purchase-guide-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.sizeGuide}
              </a>
            </div>
            <div className="product-purchase-options product-purchase-options--size">
              {pickers.sizes.map((option) => {
                const isSelected = !customSizeActive && selectedSize === option.size;
                return (
                  <button
                    key={option.size}
                    type="button"
                    onClick={() => {
                      setCustomSizeActive(false);
                      setCustomSizeInput("");
                      setSelectedSize(option.size);
                    }}
                    className={optionClass(isSelected, true, sectionInvalid("size"))}
                    aria-pressed={isSelected}
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
              {isRingProduct ? (
                <button
                  type="button"
                  onClick={() => {
                    setCustomSizeActive(true);
                    setSelectedSize("");
                    setCustomSizeInputMode("indian");
                  }}
                  className={optionClass(
                    customSizeActive,
                    true,
                    sectionInvalid("size")
                  )}
                  aria-pressed={customSizeActive}
                >
                  <span className="product-option-btn-label">{copy.myCustomSize}</span>
                </button>
              ) : null}
            </div>
            {isRingProduct && customSizeActive ? (
              <div className="product-purchase-custom-size-field">
                <div
                  className="product-purchase-custom-size-mode"
                  role="group"
                  aria-label={copy.customSizeModeGroup}
                >
                  <button
                    type="button"
                    className={`product-purchase-custom-size-mode-btn${
                      customSizeInputMode === "indian"
                        ? " product-purchase-custom-size-mode-btn--active"
                        : ""
                    }`}
                    aria-pressed={customSizeInputMode === "indian"}
                    onClick={() => {
                      setCustomSizeInputMode("indian");
                      setCustomSizeInput("");
                    }}
                  >
                    {copy.customSizeModeIndian}
                  </button>
                  <button
                    type="button"
                    className={`product-purchase-custom-size-mode-btn${
                      customSizeInputMode === "mm"
                        ? " product-purchase-custom-size-mode-btn--active"
                        : ""
                    }`}
                    aria-pressed={customSizeInputMode === "mm"}
                    onClick={() => {
                      setCustomSizeInputMode("mm");
                      setCustomSizeInput("");
                    }}
                  >
                    {copy.customSizeModeMm}
                  </button>
                </div>
                <label
                  htmlFor={customSizeInputId}
                  className="product-purchase-custom-size-label"
                >
                  {customSizeInputMode === "mm"
                    ? copy.customSizeLabelMm
                    : copy.customSizeLabelIndian}
                </label>
                <input
                  id={customSizeInputId}
                  type="text"
                  inputMode="decimal"
                  value={customSizeInput}
                  onChange={(event) => setCustomSizeInput(event.target.value)}
                  placeholder={
                    customSizeInputMode === "mm"
                      ? copy.customSizePlaceholderMm
                      : copy.customSizePlaceholderIndian
                  }
                  className="product-purchase-custom-size-input"
                  aria-invalid={sectionInvalid("size")}
                  aria-describedby={
                    customSizeHint ? `${customSizeInputId}-hint` : undefined
                  }
                  autoComplete="off"
                />
                {customSizeHint ? (
                  <p
                    id={`${customSizeInputId}-hint`}
                    className="product-purchase-custom-size-hint"
                  >
                    {customSizeHint}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {isPage ? (
        <>
          <PriceCalculationBreakdown
            breakdown={priceBreakdown}
            weightGrams={baseWeight}
            karatLabel={karatLabel}
            metalLabel={selectedMetalOption?.label ?? selectedMetal}
            diamondLabel={selectedQualityOption?.label ?? selectedQuality}
            loading={priceLoading}
            optionAdjustments={optionAdjustments}
            optionLines={optionBreakdownLines}
            displayTotal={estimatedPrice}
          />
          {actionFooter}
        </>
      ) : (
        actionFooter
      )}
    </div>
  );
}

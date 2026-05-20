"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";
import { formatProductPrice } from "@/utils/formatPrice";
import { isKaratLabel, resolveKaratFromSelection } from "@/utils/karat";
import { findBestMatchingVariant } from "@/utils/variantOptionMatch";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import PriceCalculationBreakdown from "@/components/PriceCalculationBreakdown";
import { saveReturnPath } from "@/lib/authRedirect";

export { formatProductPrice };

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
  checkoutFlow = "customer-session",
}: ProductPurchasePanelProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const karatPickerOptions =
    product.caratOptions?.length
      ? product.caratOptions
      : product.metalOptions?.every((o) => isKaratLabel(o.label))
        ? product.metalOptions
        : [];

  const metalPickerOptions =
    product.metalOptions?.filter((o) => !isKaratLabel(o.label)) ?? [];

  const initialKarat =
    product.caratOptions?.[0]?.label ??
    product.metalOptions?.find((o) => isKaratLabel(o.label))?.label ??
    "";

  const [selectedMetal, setSelectedMetal] = useState(
    metalPickerOptions[0]?.label ??
      product.metalOptions?.find((o) => isKaratLabel(o.label))?.label ??
      ""
  );
  const [selectedCarat, setSelectedCarat] = useState(initialKarat);
  const [selectedQuality, setSelectedQuality] = useState(
    product.diamondQualities?.[0]?.label ?? ""
  );
  const [selectedSize, setSelectedSize] = useState(
    product.sizeOptions?.[0]?.size ?? ""
  );
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

  const redirectToLogin = () => {
    saveReturnPath();
    window.location.href = "/login";
  };

  const handleCheckout = async () => {
    if (!selectedVariantId) {
      setCheckoutError(
        "Please select all customization options before proceeding."
      );
      return;
    }

    try {
      const authResponse = await fetch("/api/auth/check", {
        credentials: "include",
      });
      const authData = await authResponse.json();
      if (!authData.isAuthenticated) {
        redirectToLogin();
        return;
      }
    } catch {
      setCheckoutError("Unable to verify login. Please try again.");
      return;
    }

    const isStorefrontCart = checkoutFlow === "storefront-cart";
    if (isStorefrontCart) {
      const hasGid = selectedVariantId.startsWith("gid://shopify/ProductVariant/");
      if (!hasGid && (!productSlugForCheckout || !catalogVariantIdForCheckout)) {
        setCheckoutError(
          "Checkout needs this product linked to Shopify (matching handle/slug) and a resolvable variant. Reload the page or contact support."
        );
        return;
      }
    }

    setCheckoutError("");
    setIsCheckingOut(true);

    try {
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

      attributes.push({ key: "Design", value: product.name });
      attributes.push({
        key: "Estimated Custom Price",
        value: formatProductPrice(estimatedPrice),
      });

      const response = await fetch(
        isStorefrontCart ? "/api/checkout/cart" : "/api/checkout",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isStorefrontCart
              ? {
                  variantId: selectedVariantId,
                  productSlug: productSlugForCheckout,
                  catalogVariantId: catalogVariantIdForCheckout ?? "",
                  customPrice: estimatedPrice,
                  productName: product.name,
                  attributes,
                }
              : {
                  variantId: selectedVariantId,
                  attributes,
                  productName: product.name,
                  customPrice: estimatedPrice,
                  useDraftOrder: product.customizable,
                }
          ),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Unable to start checkout.");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Unable to start checkout. Please try again."
      );
      setIsCheckingOut(false);
    }
  };

  const priceHeaderClass =
    priceHeaderVariant === "modal"
      ? "flex items-start justify-between border-b border-[#eadcc8] bg-[#2f1c12] px-7 py-5"
      : "rounded-2xl border border-[#eadcc8] bg-white px-5 py-4 shadow-sm";

  const priceLabelClass =
    priceHeaderVariant === "modal"
      ? "text-xs font-bold uppercase tracking-[0.22em] text-[#d8bd8a]"
      : "text-xs font-bold uppercase tracking-[0.22em] text-[#765f4a]";

  const priceMainClass =
    priceHeaderVariant === "modal"
      ? "text-xl font-black text-[#f7d58b]"
      : "text-3xl font-black text-[#9F2B68]";

  const strikeClass =
    priceHeaderVariant === "modal"
      ? "text-sm font-semibold text-[#bda98f] line-through"
      : "text-lg font-semibold text-[#b39d86] line-through";

  return (
    <div className="flex flex-col overflow-hidden">
      <div className={priceHeaderClass}>
        <div>
          <p className={priceLabelClass}>Your price</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <p
              className={`${priceMainClass} transition-opacity ${priceLoading ? "opacity-50" : ""}`}
            >
              {priceLoading ? "…" : formatProductPrice(estimatedPrice)}
            </p>
            {listPrice > estimatedPrice ? (
              <p className={strikeClass}>{formatProductPrice(listPrice)}</p>
            ) : null}
          </div>
          {priceHeaderVariant === "page" ? (
            <p className="mt-1 text-xs text-[#765f4a]">Inclusive of GST · Secure checkout</p>
          ) : null}
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customisation modal"
            className="rounded-full p-2 text-[#f7d58b] transition hover:bg-white/10"
          >
            <span className="block text-2xl leading-none">×</span>
          </button>
        ) : null}
      </div>

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

      <div className="space-y-8 overflow-y-auto px-5 py-6 sm:px-7">
        {showDesignSummary ? (
          <section className="grid gap-5 rounded-[1.5rem] border border-[#eadcc8] bg-white/65 p-4 sm:grid-cols-[180px_1fr]">
            <div className="flex h-44 items-center justify-center rounded-[1.25rem] bg-[#fbf4ea]">
              <Image
                src={selectedImage}
                alt={product.name}
                width={220}
                height={180}
                className="max-h-36 w-auto object-contain drop-shadow-[0_14px_18px_rgba(78,48,20,0.12)]"
              />
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b47723]">
                Selected design
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2f1c12]">
                {product.name}
              </h3>
              <p className="mt-3 max-w-md text-sm font-medium leading-6 text-[#765f4a]">
                {product.description}
              </p>
              {product.customizable ? (
                <p className="mt-3 rounded-2xl bg-[#fff7df] px-4 py-3 text-sm font-bold text-[#7a4a20]">
                  Custom estimate updates as you select metal, carat, diamond quality, and size.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {hasMetalOptions ? (
          <section>
            <h3 className="text-sm font-black text-[#4a2b17]">
              {product.metalOptionName ?? "Choice of metal"}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {metalPickerOptions.map((option) => {
                const isSelected = selectedMetal === option.label;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedMetal(option.label)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-[#2f1c12] bg-[#f7d58b] text-[#2f1c12]"
                        : "border-[#eadcc8] bg-white/70 text-[#765f4a] hover:border-[#d6a850]"
                    }`}
                  >
                    <span className="block text-sm font-bold">{option.label}</span>
                    {option.note ? (
                      <span className="mt-2 block rounded-lg bg-white/75 px-3 py-1 text-center text-xs font-bold text-[#765f4a]">
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
            <h3 className="text-sm font-black text-[#4a2b17]">
              {product.caratOptionName ?? "Gold purity (Karat)"}
            </h3>
            <p className="mt-1 text-xs text-[#765f4a]">
              Price updates when you change karat (e.g. 18K vs 22K).
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {karatPickerOptions.map((option) => {
                const isSelected =
                  selectedCarat === option.label ||
                  (isKaratLabel(option.label) && selectedMetal === option.label);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => selectKarat(option.label)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-[#2f1c12] bg-[#f7d58b] text-[#2f1c12]"
                        : "border-[#eadcc8] bg-white/70 text-[#765f4a] hover:border-[#d6a850]"
                    }`}
                  >
                    <span className="block text-sm font-bold">{option.label}</span>
                    {option.note ? (
                      <span className="mt-2 block rounded-lg bg-white/75 px-3 py-1 text-center text-xs font-bold text-[#765f4a]">
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
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-black text-[#4a2b17]">
                {product.diamondOptionName ?? "Diamond quality"}
              </h3>
              <button
                type="button"
                className="text-xs font-black uppercase tracking-wide text-[#b47723]"
              >
                Diamond guide
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {product.diamondQualities?.map((option) => {
                const isSelected = selectedQuality === option.label;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedQuality(option.label)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-[#2f1c12] bg-[#f7d58b] text-[#2f1c12]"
                        : "border-[#eadcc8] bg-white/70 text-[#765f4a] hover:border-[#d6a850]"
                    }`}
                  >
                    <span className="block text-sm font-bold">{option.label}</span>
                    {option.note ? (
                      <span className="mt-2 block rounded-lg bg-white/75 px-3 py-1 text-center text-xs font-bold text-[#765f4a]">
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
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-black text-[#4a2b17]">
                {product.sizeOptionName ?? "Select size"}
              </h3>
              <button
                type="button"
                className="text-xs font-black uppercase tracking-wide text-[#b47723]"
              >
                Size guide
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {product.sizeOptions?.map((option) => {
                const isSelected = selectedSize === option.size;
                return (
                  <button
                    key={option.size}
                    type="button"
                    onClick={() => setSelectedSize(option.size)}
                    className={`rounded-2xl border px-3 py-3 text-center transition ${
                      isSelected
                        ? "border-[#2f1c12] bg-[#f7d58b] text-[#2f1c12]"
                        : "border-[#eadcc8] bg-white/70 text-[#765f4a] hover:border-[#d6a850]"
                    }`}
                  >
                    <span className="block text-base font-bold">{option.size}</span>
                    {option.mm ? (
                      <span className="block text-xs font-semibold">{option.mm}</span>
                    ) : null}
                    {option.note ? (
                      <span className="mt-2 block rounded-lg bg-white/75 px-2 py-1 text-[11px] font-bold text-[#765f4a]">
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

      <div className="border-t border-[#eadcc8] bg-[#fffaf2] p-4">
        {checkoutError ? (
          <p className="mb-3 rounded-2xl bg-[#fff1e8] px-4 py-3 text-sm font-bold text-[#8a3c1c]">
            {checkoutError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={isCheckingOut}
          className="w-full rounded-full bg-[#2f1c12] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#f7d58b] transition hover:bg-[#4a2b17] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCheckingOut
            ? "Opening checkout…"
            : checkoutButtonLabel ?? "Proceed to payment"}
        </button>
      </div>
    </div>
  );
}

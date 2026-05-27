"use client";

import productContent from "@/lib/productContent";

const copy = productContent.commerce;

type ProductCommerceActionsProps = {
  onBuyNow: () => void;
  onAddToCart: () => void;
  buyDisabled?: boolean;
  cartDisabled?: boolean;
  buyLoading?: boolean;
  cartLoading?: boolean;
  /** `stack` on narrow cards; `row` in sidebar / modal */
  layout?: "row" | "stack";
  className?: string;
};

export default function ProductCommerceActions({
  onBuyNow,
  onAddToCart,
  buyDisabled = false,
  cartDisabled = false,
  buyLoading = false,
  cartLoading = false,
  layout = "row",
  className = "",
}: ProductCommerceActionsProps) {
  const layoutClass =
    layout === "stack"
      ? "product-commerce-actions--stack"
      : "product-commerce-actions--row";

  return (
    <div
      className={`product-commerce-actions product-animate-in ${layoutClass} ${className}`.trim()}
      role="group"
      aria-label={copy.actionsAria}
    >
      <button
        type="button"
        onClick={onBuyNow}
        disabled={buyDisabled || buyLoading || cartLoading}
        className="product-btn-primary product-commerce-btn-buy"
      >
        {buyLoading ? copy.buyLoading : copy.buyNow}
      </button>
      <button
        type="button"
        onClick={onAddToCart}
        disabled={cartDisabled || buyLoading || cartLoading}
        className="product-commerce-btn-cart"
      >
        {cartLoading ? copy.cartLoading : copy.addToCart}
      </button>
    </div>
  );
}



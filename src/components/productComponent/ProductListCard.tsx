"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import ProductCommerceActions from "@/components/productComponent/ProductCommerceActions";
import productContent, { formatProductCopy } from "@/lib/productContent";
import { useCart } from "@/contexts/CartContext";
import {
  addProductToCart,
  resolveDefaultVariant,
  startProductCheckout,
} from "@/lib/productCheckout";
import {
  getProductCustomizeHref,
  productHasCustomizationOptions,
} from "@/utils/productCustomization";
import { productLinkWarmHandlers } from "@/lib/productDetailNavigation";
import { getProductHref } from "@/utils/productUrl";

type ProductListCardProps = {
  product: Product;
  imageSrc: string;
  onImageError: () => void;
  animationIndex?: number;
};

const copy = productContent.list;
const detailCopy = productContent.detail;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function ProductListCard({
  product,
  imageSrc,
  onImageError,
  animationIndex = 0,
}: ProductListCardProps) {
  const { refreshCart, goToCart } = useCart();
  const [buyLoading, setBuyLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [toast, setToast] = useState("");

  const list = product.compareAtPrice ?? 0;
  const href = getProductHref(product);
  const warm = productLinkWarmHandlers(product);
  const delayStyle = { animationDelay: `${Math.min(animationIndex, 8) * 60}ms` };

  const runCheckout = async (redirect: boolean) => {
    if (productHasCustomizationOptions(product)) {
      window.location.href = redirect
        ? `${href}?buy=1`
        : getProductCustomizeHref(product);
      return;
    }

    const { variantId, catalogVariantId, price } = resolveDefaultVariant(product);
    if (!variantId) {
      window.location.href = href;
      return;
    }

    const setLoading = redirect ? setBuyLoading : setCartLoading;
    setLoading(true);
    setToast("");

    if (redirect) {
      const result = await startProductCheckout({
        product,
        variantId,
        catalogVariantId,
        customPrice: price,
        redirect: true,
      });
      setLoading(false);
      if (!result.ok) setToast(result.error);
      return;
    }

    const result = await addProductToCart({
      product,
      variantId,
      catalogVariantId,
      customPrice: price,
      productImage: imageSrc,
    });

    setLoading(false);

    if (!result.ok) {
      setToast(result.error);
      return;
    }

    await refreshCart();
    goToCart();
    setToast(productContent.commerce.addedToCart);
    window.setTimeout(() => setToast(""), 3200);
  };

  return (
    <article className="product-card product-card--animated" style={delayStyle}>
      <Link href={href} className="product-card-media" {...warm}>
        {imageSrc !== "/placeholder.jpg" ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="product-card-img"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={onImageError}
          />
        ) : (
          <div className="product-detail-placeholder" aria-hidden>
            {copy.placeholderSymbol}
          </div>
        )}

        {list > product.price ? (
          <span className="product-card-badge-sale">{copy.saleBadge}</span>
        ) : null}

        {(product.variantCount ?? product.variants?.length ?? 0) > 1 ? (
          <span className="product-card-badge-options">
            {formatProductCopy(copy.optionsBadge, {
              count: product.variantCount ?? product.variants?.length ?? 0,
            })}
          </span>
        ) : null}
      </Link>

      <div className="product-card-body">
        <Link href={href} className="product-card-title-link" {...warm}>
          <h3 className="product-item-title product-item-title--card">{product.name}</h3>
        </Link>

        <ProductCommerceActions
          layout="stack"
          buyLoading={buyLoading}
          cartLoading={cartLoading}
          onBuyNow={() => void runCheckout(true)}
          onAddToCart={() => void runCheckout(false)}
        />

        {toast ? (
          <p className="product-card-toast product-animate-in" role="status">
            {toast}
          </p>
        ) : null}

        <p className="product-card-desc">{product.description}</p>

        <div className="product-card-footer">
          <div>
            <span className="product-card-price">{formatPrice(product.price)}</span>
            {list > product.price ? (
              <span className="product-card-compare">{formatPrice(list)}</span>
            ) : null}
          </div>
          <Link href={href} className="product-card-cta" {...warm}>
            {copy.viewProduct}
          </Link>
        </div>
      </div>
    </article>
  );
}



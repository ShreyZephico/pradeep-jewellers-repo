"use client";

import Image from "next/image";
import Link from "next/link";

import { inferProductCategoryId } from "@/lib/productRecommendations";
import productContent from "@/lib/productContent";
import type { Product } from "@/types/product";
import { formatProductPrice } from "@/utils/formatPrice";
import { productLinkWarmHandlers } from "@/lib/productDetailNavigation";
import { getProductHref } from "@/utils/productUrl";

type RecommendedProductCardProps = {
  product: Product;
  imageSrc: string;
  onImageError: () => void;
};

export default function RecommendedProductCard({
  product,
  imageSrc,
  onImageError,
}: RecommendedProductCardProps) {
  const copy = productContent.detail.recommended;
  const href = getProductHref(product);
  const warm = productLinkWarmHandlers(product);
  const categoryId = inferProductCategoryId(product);
  const categoryLabel =
    categoryId && copy.categoryLabels
      ? (copy.categoryLabels as Record<string, string>)[categoryId]
      : null;

  return (
    <article className="product-rec-card">
      <Link href={href} className="product-rec-card__link" {...warm}>
        <span className="product-rec-card__media">
          {imageSrc !== "/placeholder.jpg" ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              className="product-rec-card__img"
              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 180px"
              onError={onImageError}
            />
          ) : (
            <span className="product-rec-card__placeholder" aria-hidden>
              {productContent.detail.placeholderSymbol}
            </span>
          )}
          {categoryLabel ? (
            <span className="product-rec-card__badge">{categoryLabel}</span>
          ) : null}
          <span className="product-rec-card__overlay" aria-hidden>
            {copy.viewLabel ?? "View"}
          </span>
        </span>
        <span className="product-rec-card__body">
          <span className="product-rec-card__name">{product.name}</span>
          <span className="product-rec-card__price">{formatProductPrice(product.price)}</span>
        </span>
      </Link>
    </article>
  );
}

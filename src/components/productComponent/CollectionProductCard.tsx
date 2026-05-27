"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import productContent, { formatProductCopy } from "@/lib/productContent";
import {
  getProductCornerBadge,
  getProductMakingLabel,
  getProductMaterialLabel,
} from "@/lib/productDisplay";
import { formatProductPrice } from "@/utils/formatPrice";
import { getProductHref } from "@/utils/productUrl";

type CollectionProductCardProps = {
  product: Product;
  imageSrc: string;
  onImageError: () => void;
};

const copy = productContent.list;

export default function CollectionProductCard({
  product,
  imageSrc,
  onImageError,
}: CollectionProductCardProps) {
  const href = getProductHref(product);
  const cornerBadge = getProductCornerBadge(product);
  const material = getProductMaterialLabel(product);
  const makingLabel = getProductMakingLabel(product);

  return (
    <article className="collection-card group">
      <Link href={href} className="collection-card-media">
        {imageSrc !== "/placeholder.jpg" ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="collection-card-img"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={onImageError}
          />
        ) : (
          <div className="collection-card-placeholder" aria-hidden>
            {copy.placeholderSymbol}
          </div>
        )}

        {cornerBadge ? (
          <span className="collection-card-tag">{cornerBadge}</span>
        ) : null}

        <button
          type="button"
          className="collection-card-wishlist"
          aria-label={formatProductCopy(copy.wishlistLabel, { name: product.name })}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            aria-hidden
          >
            <path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10Z" />
          </svg>
        </button>
      </Link>

      <div className="collection-card-body">
        <p className="collection-card-material">{material}</p>
        <Link href={href}>
          <h3 className="collection-card-name">{product.name}</h3>
        </Link>
        <div className="collection-card-price-row">
          <p className="collection-card-price">{formatProductPrice(product.price)}</p>
          {makingLabel ? (
            <p className="collection-card-making">{makingLabel}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

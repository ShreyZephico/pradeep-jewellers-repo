"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import {
  getProductCornerBadge,
  getProductMakingLabel,
  getProductMaterialLabel,
} from "@/lib/productDisplay";
import productContent from "@/lib/productContent";
import { formatProductPrice } from "@/utils/formatPrice";
import { getProductHref } from "@/utils/productUrl";

type CollectionProductCardProps = {
  product: Product;
  imageSrc: string;
  onImageError: () => void;
};

export default function CollectionProductCard({
  product,
  imageSrc,
  onImageError,
}: CollectionProductCardProps) {
  const copy = productContent.list;
  const href = getProductHref(product);
  const cornerBadge = getProductCornerBadge(product);
  const material = getProductMaterialLabel(product);
  const makingLabel = getProductMakingLabel(product);

  return (
    <article className="collection-card collection-card--shine group">
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
      </Link>

      <div className="collection-card-body">
        {material ? (
          <p className="collection-card-material collection-card-material--desktop">
            {material}
          </p>
        ) : null}
        <Link href={href}>
          <h3 className="collection-card-name">{product.name}</h3>
        </Link>
        <div className="collection-card-price-row">
          <p className="collection-card-price">{formatProductPrice(product.price)}</p>
          {makingLabel ? (
            <p className="collection-card-making collection-card-making--desktop">
              {makingLabel}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

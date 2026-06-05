import type { CSSProperties } from "react";

type RecommendedProductCardSkeletonProps = {
  index?: number;
};

export default function RecommendedProductCardSkeleton({
  index = 0,
}: RecommendedProductCardSkeletonProps) {
  return (
    <article
      className="product-rec-card product-rec-card--skeleton"
      style={{ "--rec-skeleton-index": index } as CSSProperties}
      aria-hidden
    >
      <div className="product-rec-card__media product-rec-card__shimmer" />
      <div className="product-rec-card__body">
        <div className="product-rec-card__shimmer product-rec-card__shimmer-line" />
        <div className="product-rec-card__shimmer product-rec-card__shimmer-line product-rec-card__shimmer-line--short" />
      </div>
    </article>
  );
}

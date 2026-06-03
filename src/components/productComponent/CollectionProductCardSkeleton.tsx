import type { CSSProperties } from "react";

type CollectionProductCardSkeletonProps = {
  index?: number;
};

export default function CollectionProductCardSkeleton({
  index = 0,
}: CollectionProductCardSkeletonProps) {
  return (
    <article
      className="collection-card collection-card--skeleton"
      style={{ "--skeleton-index": index } as CSSProperties}
      aria-hidden
    >
      <div className="collection-card-skeleton-media" />
      <div className="collection-card-skeleton-body">
        <div className="collection-card-skeleton-line collection-card-skeleton-line--short" />
        <div className="collection-card-skeleton-line collection-card-skeleton-line--title" />
        <div className="collection-card-skeleton-line collection-card-skeleton-line--price" />
      </div>
    </article>
  );
}

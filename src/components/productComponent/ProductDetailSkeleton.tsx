import productContent from "@/lib/productContent";

const breadcrumb = productContent.breadcrumb;

export default function ProductDetailSkeleton() {
  return (
    <div
      className="product-detail-page product-detail-page--skeleton"
      aria-busy="true"
      aria-label={productContent.detail.loading}
    >
      <div className="product-breadcrumb-bar">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <span className="product-detail-skeleton-line product-detail-skeleton-line--short" />
        </nav>
      </div>

      <div className="product-container product-detail-main">
        <div className="product-detail-layout">
          <div className="product-detail-grid product-detail-top">
            <div className="product-detail-gallery-col">
              <div className="product-detail-skeleton-media" />
            </div>

            <div className="product-detail-info-col product-detail-skeleton-info">
              <div className="product-detail-skeleton-line product-detail-skeleton-line--title" />
              <div className="product-detail-skeleton-line product-detail-skeleton-line--price" />
              <div className="product-detail-skeleton-line" />
              <div className="product-detail-skeleton-line product-detail-skeleton-line--medium" />
              <div className="product-detail-skeleton-actions">
                <div className="product-detail-skeleton-btn" />
                <div className="product-detail-skeleton-btn product-detail-skeleton-btn--secondary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">
        {breadcrumb.home} {breadcrumb.separator} {breadcrumb.shop}
      </span>
    </div>
  );
}

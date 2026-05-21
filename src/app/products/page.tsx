import { Suspense } from "react";

import ProductsPageClient from "@/components/ProductsPageClient";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="product-page product-state-center">Loading collection…</div>}>
      <ProductsPageClient />
    </Suspense>
  );
}

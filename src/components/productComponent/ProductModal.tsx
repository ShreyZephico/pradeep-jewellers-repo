"use client";

import { useEffect } from "react";
import type { Product } from "@/types/product";
import ModalPortal from "@/components/ModalPortal";
import ProductPurchasePanel from "@/components/productComponent/ProductPurchasePanel";

type ProductModalProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
};

export default function ProductModal({ product, open, onClose }: ProductModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !product) {
    return null;
  }

  return (
    <ModalPortal>
      <div
        className="product-modal-overlay product-modal-overlay--drawer"
        role="presentation"
        onClick={onClose}
      >
        <div
          className="product-modal-shell"
          role="dialog"
          aria-modal="true"
          onClick={(event) => event.stopPropagation()}
        >
          <ProductPurchasePanel
            key={product.id}
            product={product}
            showDesignSummary
            priceHeaderVariant="modal"
            onClose={onClose}
          />
        </div>
      </div>
    </ModalPortal>
  );
}


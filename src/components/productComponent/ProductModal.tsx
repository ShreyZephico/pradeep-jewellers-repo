"use client";

import { useEffect } from "react";
import type { Product } from "@/types/product";
import ModalPortal from "@/components/ModalPortal";
import ProductPurchasePanel from "@/components/productComponent/ProductPurchasePanel";

type ProductModalProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  initialSelection?: import("@/utils/productCustomization").CustomizationSelections;
  selectionSyncKey?: string | number;
  onConfirm?: (
    snapshot: import("@/utils/productCustomization").ConfirmedCustomizationSnapshot
  ) => void;
  onSelectionChange?: (
    selection: import("@/utils/productCustomization").CustomizationSelections
  ) => void;
};

export default function ProductModal({
  product,
  open,
  onClose,
  initialSelection,
  selectionSyncKey,
  onConfirm,
  onSelectionChange,
}: ProductModalProps) {
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
            initialSelection={initialSelection}
            selectionSyncKey={selectionSyncKey}
            onConfirm={onConfirm}
            onSelectionChange={onSelectionChange}
          />
        </div>
      </div>
    </ModalPortal>
  );
}


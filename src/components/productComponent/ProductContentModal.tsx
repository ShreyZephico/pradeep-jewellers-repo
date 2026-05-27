"use client";

import { useEffect, type ReactNode } from "react";
import ModalPortal from "@/components/ModalPortal";
import productContent from "@/lib/productContent";

type ProductContentModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const copy = productContent.detail;

export default function ProductContentModal({
  open,
  title,
  onClose,
  children,
}: ProductContentModalProps) {
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

  if (!open) {
    return null;
  }

  return (
    <ModalPortal>
      <div className="product-modal-overlay" role="presentation" onClick={onClose}>
        <div
          className="product-content-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-content-modal-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="product-content-modal-header">
            <h2 id="product-content-modal-title" className="product-content-modal-title">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="product-content-modal-close"
              aria-label={copy.closeModal}
            >
              ×
            </button>
          </header>
          <div className="product-content-modal-body">{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
}

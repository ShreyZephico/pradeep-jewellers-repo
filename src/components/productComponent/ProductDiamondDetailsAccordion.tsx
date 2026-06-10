"use client";

import { useId, useState } from "react";

import productContent from "@/lib/productContent";
import type { Product } from "@/types/product";
import { formatProductPrice } from "@/utils/formatPrice";
import {
  buildDiamondDetailDisplayRows,
  formatDiamondDetailLabel,
  productHasDiamondDetails,
  resolveDiamondDetailByLabel,
} from "@/utils/diamondDetails";

const copy = productContent.purchase;

type ProductDiamondDetailsAccordionProps = {
  product: Product;
  selectedLabel: string;
};

export default function ProductDiamondDetailsAccordion({
  product,
  selectedLabel,
}: ProductDiamondDetailsAccordionProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  if (!productHasDiamondDetails(product.diamondDetails)) {
    return null;
  }

  const details = product.diamondDetails ?? [];
  const detail =
    resolveDiamondDetailByLabel(details, selectedLabel) ?? details[0] ?? null;

  if (!detail) {
    return null;
  }

  const labels = {
    carat: copy.diamondDetailCarat,
    color: copy.diamondDetailColor,
    clarity: copy.diamondDetailClarity,
    type: copy.diamondDetailType,
    shape: copy.diamondDetailShape,
    quantity: copy.diamondDetailQuantity,
    price: copy.diamondDetailPrice,
  };

  const rows = buildDiamondDetailDisplayRows(detail, labels, formatProductPrice, {
    excludeColor: true,
  });

  if (rows.length === 0) {
    return null;
  }

  const summaryLabel =
    selectedLabel.trim() || formatDiamondDetailLabel(detail) || copy.diamondDetailsTitle;

  return (
    <div className="product-diamond-accordion">
      <button
        type="button"
        className="product-diamond-accordion__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="product-diamond-accordion__title">{copy.diamondDetailsTitle}</span>
        <span className="product-diamond-accordion__meta">
          {!open && summaryLabel ? (
            <span className="product-diamond-accordion__summary">{summaryLabel}</span>
          ) : null}
          <span
            className={`product-diamond-accordion__chevron${
              open ? " product-diamond-accordion__chevron--open" : ""
            }`}
            aria-hidden
          />
        </span>
      </button>

      {open ? (
        <div id={panelId} className="product-diamond-accordion__panel">
          <dl className="product-diamond-accordion__grid">
            {rows.map((row) => (
              <div key={`${row.label}-${row.value}`} className="product-diamond-accordion__row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

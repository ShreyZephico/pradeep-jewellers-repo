"use client";

import Link from "next/link";

import productContent from "@/lib/productContent";
import type { Product, ProductDiamondDetail } from "@/types/product";
import { formatProductPrice } from "@/utils/formatPrice";
import {
  buildDiamondDetailDisplayRows,
  formatDiamondDetailLabel,
} from "@/utils/diamondDetails";

const copy = productContent.purchase;

type ProductDiamondDetailsSectionProps = {
  product: Product;
  details: ProductDiamondDetail[];
  selectedLabel: string;
  onSelect: (label: string) => void;
  invalid?: boolean;
};

function diamondCardClass(selected: boolean, invalid: boolean): string {
  return [
    "product-option-btn",
    "product-diamond-details-card",
    selected ? "product-option-btn--selected" : "",
    invalid ? "product-option-btn--invalid-hint" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function ProductDiamondDetailsSection({
  product,
  details,
  selectedLabel,
  onSelect,
  invalid = false,
}: ProductDiamondDetailsSectionProps) {
  const labels = {
    carat: copy.diamondDetailCarat,
    color: copy.diamondDetailColor,
    clarity: copy.diamondDetailClarity,
    type: copy.diamondDetailType,
    shape: copy.diamondDetailShape,
    quantity: copy.diamondDetailQuantity,
    price: copy.diamondDetailPrice,
  };

  const multiSelect = details.length > 1;
  const hasSelection = Boolean(selectedLabel.trim());

  return (
    <section
      className={`product-purchase-section product-purchase-section--diamond-details${
        invalid ? " product-purchase-section--invalid" : ""
      }`}
    >
      <div className="product-purchase-section-header">
        <h3 className="product-purchase-section-title">
          {product.diamondOptionName ?? copy.diamondDetailsTitle}
          <span className="product-purchase-required" aria-hidden>
            *
          </span>
        </h3>
        <Link
          href="/diamond-guide"
          className="product-purchase-guide-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.diamondGuide}
        </Link>
      </div>

      <p className="product-purchase-section-hint product-diamond-details-hint">
        {hasSelection
          ? copy.diamondDetailsSelectedHint
          : copy.diamondDetailsRequiredHint}
      </p>

      <div
        className={`product-diamond-details-list${
          multiSelect ? " product-diamond-details-list--grid" : ""
        }`}
      >
        {details.map((detail, index) => {
          const label = formatDiamondDetailLabel(detail);
          const rows = buildDiamondDetailDisplayRows(detail, labels, formatProductPrice);
          const isSelected = selectedLabel === label;
          const cardKey = `${label}-${index}`;

          return (
            <button
              key={cardKey}
              type="button"
              className={diamondCardClass(isSelected, invalid)}
              aria-pressed={isSelected}
              onClick={() => onSelect(label)}
            >
              <DiamondDetailCardBody
                title={label || copy.diamondDetailsTitle}
                rows={rows}
                selected={isSelected}
                selectLabel={copy.diamondDetailsSelectLabel}
                includedLabel={copy.diamondDetailsIncludedLabel}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DiamondDetailCardBody({
  title,
  rows,
  selected,
  selectLabel,
  includedLabel,
}: {
  title: string;
  rows: { label: string; value: string }[];
  selected: boolean;
  selectLabel: string;
  includedLabel: string;
}) {
  return (
    <>
      <p className="product-diamond-details-card-title">{title}</p>
      <dl className="product-diamond-details-grid">
        {rows.map((row) => (
          <div key={`${row.label}-${row.value}`} className="product-diamond-details-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <span
        className={`product-diamond-details-status${
          selected ? " product-diamond-details-status--on" : ""
        }`}
        aria-hidden
      >
        {selected ? includedLabel : selectLabel}
      </span>
    </>
  );
}

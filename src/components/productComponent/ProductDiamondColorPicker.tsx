"use client";

import Link from "next/link";

import productContent from "@/lib/productContent";
import type { ProductDiamondDetail } from "@/types/product";
import {
  formatDiamondDetailLabel,
  getSelectedDiamondColor,
  getUniqueDiamondColors,
  resolveDiamondLabelForColor,
} from "@/utils/diamondDetails";

const copy = productContent.purchase;

type ProductDiamondColorPickerProps = {
  details: ProductDiamondDetail[];
  selectedLabel: string;
  onSelect: (label: string) => void;
  invalid?: boolean;
};

export default function ProductDiamondColorPicker({
  details,
  selectedLabel,
  onSelect,
  invalid = false,
}: ProductDiamondColorPickerProps) {
  const uniqueColors = getUniqueDiamondColors(details);
  const useColorMode = uniqueColors.length > 0;
  const selectedColor = getSelectedDiamondColor(details, selectedLabel);
  const fallbackLabels = details
    .map((detail) => formatDiamondDetailLabel(detail))
    .filter(Boolean);

  const hasSelection = Boolean(selectedLabel.trim());

  return (
    <section
      className={`product-purchase-section product-purchase-section--diamond-color${
        invalid ? " product-purchase-section--invalid" : ""
      }`}
    >
      <div className="product-purchase-section-header">
        <h3 className="product-purchase-section-title">
          {copy.diamondColorTitle}
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

      <p className="product-purchase-section-hint">
        {hasSelection ? copy.diamondColorSelectedHint : copy.diamondColorRequiredHint}
      </p>

      <div className="product-purchase-options product-purchase-options--diamond">
        {useColorMode
          ? uniqueColors.map((color) => {
              const isSelected = selectedColor.toUpperCase() === color.toUpperCase();
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    onSelect(resolveDiamondLabelForColor(details, color, selectedLabel))
                  }
                  className={[
                    "product-option-btn",
                    isSelected ? "product-option-btn--selected" : "",
                    invalid && !isSelected ? "product-option-btn--invalid-hint" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={isSelected}
                >
                  <span className="product-option-btn-label">{color}</span>
                </button>
              );
            })
          : fallbackLabels.map((label) => {
              const isSelected = selectedLabel === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelect(label)}
                  className={[
                    "product-option-btn",
                    isSelected ? "product-option-btn--selected" : "",
                    invalid && !isSelected ? "product-option-btn--invalid-hint" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={isSelected}
                >
                  <span className="product-option-btn-label">{label}</span>
                </button>
              );
            })}
      </div>
    </section>
  );
}

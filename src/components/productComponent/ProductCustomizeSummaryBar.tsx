"use client";

import type { CSSProperties } from "react";
import type { Product } from "@/types/product";
import productContent from "@/lib/productContent";
import {
  getCustomizationSummarySegments,
  type CustomizationSelections,
  type CustomizationSummarySegmentKey,
} from "@/utils/productCustomization";

const copy = productContent.detail;

type ProductCustomizeSummaryBarProps = {
  product: Product;
  selection: CustomizationSelections;
  onCustomize: () => void;
};

type CustomizeBarSegmentProps = {
  label: string;
  value: string;
  segmentKey: CustomizationSummarySegmentKey;
  onActivate: (focus?: CustomizationSummarySegmentKey) => void;
};

function CustomizeBarSegment({
  label,
  value,
  segmentKey,
  onActivate,
}: CustomizeBarSegmentProps) {
  return (
    <button
      type="button"
      className="product-customize-bar__segment"
      onClick={() => onActivate(segmentKey)}
      title={`${label}: ${value}`}
    >
      <span className="product-customize-bar__label">{label}</span>
      <span className="product-customize-bar__value">{value}</span>
    </button>
  );
}

export default function ProductCustomizeSummaryBar({
  product,
  selection,
  onCustomize,
}: ProductCustomizeSummaryBarProps) {
  const segments = getCustomizationSummarySegments(product, selection, {
    size: copy.summarySizeLabel ?? "Size",
    metal: copy.summaryMetalLabel ?? "Metal",
    diamond: copy.summaryDiamondLabel ?? "Diamond",
  });

  if (segments.length === 0) {
    return null;
  }

  const openCustomize = (focus?: CustomizationSummarySegmentKey) => {
    void focus;
    onCustomize();
  };

  return (
    <div
      className="product-customize-bar"
      role="group"
      aria-label={copy.customizeCta}
      style={
        {
          "--customize-segment-count": segments.length,
        } as CSSProperties
      }
    >
      <div className="product-customize-bar__options">
        {segments.map((segment) => (
          <CustomizeBarSegment
            key={segment.key}
            label={segment.label}
            value={segment.value}
            segmentKey={segment.key}
            onActivate={openCustomize}
          />
        ))}
      </div>
      <button
        type="button"
        className="product-customize-bar__cta"
        onClick={() => openCustomize()}
      >
        {copy.customizeCta ?? "Customise"}
      </button>
    </div>
  );
}

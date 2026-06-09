import type { Product, ProductDiamondDetail, ProductOption } from "@/types/product";
import { getDiamondPickerOptions } from "@/utils/customizePickerCatalog";
import { formatDiamondDetailLabel } from "@/utils/diamondDetails";

function normalizeLabel(label: string): string {
  return label.trim().toUpperCase().replace(/\s+/g, "");
}

function detailToQualityOption(detail: ProductDiamondDetail): ProductOption {
  const label = formatDiamondDetailLabel(detail);
  const priceValue = detail.price ? Number(detail.price) : NaN;
  const noteParts = [
    detail.carat?.trim() ? `${detail.carat.trim()} ct` : "",
    detail.diamondType?.trim() ?? "",
  ].filter(Boolean);

  return {
    label,
    note: noteParts.length ? noteParts.join(" · ") : undefined,
    priceAdjustment: Number.isFinite(priceValue) ? priceValue : undefined,
  };
}

/** Resolve selected diamond label to a priced catalog option (Shopify or metafield). */
export function resolveDiamondQualityOption(
  product: Product,
  selectedLabel: string
): ProductOption | null {
  const label = selectedLabel.trim();
  if (!label) {
    return null;
  }

  const fromPicker = getDiamondPickerOptions(product).find(
    (option) => normalizeLabel(option.label) === normalizeLabel(label)
  );
  if (fromPicker) {
    return fromPicker;
  }

  const detail = product.diamondDetails?.find(
    (entry) => normalizeLabel(formatDiamondDetailLabel(entry)) === normalizeLabel(label)
  );
  if (!detail) {
    return null;
  }

  return detailToQualityOption(detail);
}

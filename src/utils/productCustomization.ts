import productContent from "@/lib/productContent";
import type { Product } from "@/types/product";
import { isKaratLabel } from "@/utils/karat";
import { getProductHref } from "@/utils/productUrl";

export type CustomizationSelections = {
  metal: string;
  carat: string;
  quality: string;
  size: string;
};

export function productHasCustomizationOptions(product: Product): boolean {
  const metalPicker =
    product.metalOptions?.filter((o) => !isKaratLabel(o.label)) ?? [];
  const karatPicker =
    product.caratOptions?.length
      ? product.caratOptions
      : product.metalOptions?.every((o) => isKaratLabel(o.label))
        ? product.metalOptions
        : [];

  return Boolean(
    product.customizable ||
    metalPicker.length ||
    karatPicker.length ||
    product.diamondQualities?.length ||
    product.sizeOptions?.length
  );
}

export function getProductCustomizeHref(product: Product): string {
  return `${getProductHref(product)}?customize=1`;
}

/** Returns an error message when required customization choices are missing. */
export function getCustomizationValidationError(
  product: Product,
  selected: CustomizationSelections
): string | null {
  const message = productContent.purchase.selectOptionsError;

  const metalPicker =
    product.metalOptions?.filter((o) => !isKaratLabel(o.label)) ?? [];
  const karatPicker =
    product.caratOptions?.length
      ? product.caratOptions
      : product.metalOptions?.every((o) => isKaratLabel(o.label))
        ? product.metalOptions
        : [];

  if (metalPicker.length && !selected.metal.trim()) {
    return message;
  }

  const karatChosen =
    selected.carat.trim() ||
    (selected.metal.trim() && isKaratLabel(selected.metal));

  if (karatPicker.length && !karatChosen) {
    return message;
  }

  if (product.diamondQualities?.length && !selected.quality.trim()) {
    return message;
  }

  if (product.sizeOptions?.length && !selected.size.trim()) {
    return message;
  }

  return null;
}

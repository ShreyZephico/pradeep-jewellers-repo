import productContent from "@/lib/productContent";
import {
  collectionFilterConfig,
  type CollectionFilterOption,
} from "@/lib/shopCollectionFilters";
import { formatRingFilterSizeLabel, getRingFilterSizeOptions } from "@/utils/ringSizeChart";

const priceTiers = productContent.priceTiers;
const ringSizeOptions = getRingFilterSizeOptions();

export type ActiveFilterChip = {
  id: string;
  label: string;
};

function labelForFacetOption(
  options: { id: string; label: string }[],
  id: string
): string {
  return options.find((option) => option.id === id)?.label ?? id;
}

export function buildActiveFilterChips(input: {
  categoryId: string;
  priceTierId: string;
  ringSizeIds: string[];
  facets: {
    discounts: string[];
    weights: string[];
    materials: string[];
    metals: string[];
    shopFor: string[];
    occasions: string[];
    searchTags: string[];
  };
  searchTagOptions?: CollectionFilterOption[];
}): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (input.categoryId && input.categoryId !== "all") {
    const category = productContent.categories.find((c) => c.id === input.categoryId);
    chips.push({
      id: "category",
      label: category?.name ?? input.categoryId,
    });
  }

  for (const sizeId of input.ringSizeIds) {
    const option = ringSizeOptions.find((row) => row.size === sizeId);
    chips.push({
      id: `ring-size-${sizeId}`,
      label: option ? formatRingFilterSizeLabel(option) : `Size ${sizeId}`,
    });
  }

  if (input.priceTierId && input.priceTierId !== "any") {
    const tier = priceTiers.find((row) => row.id === input.priceTierId);
    chips.push({
      id: "price",
      label: tier?.label ?? input.priceTierId,
    });
  }

  for (const id of input.facets.discounts) {
    chips.push({
      id: `discount-${id}`,
      label: labelForFacetOption(collectionFilterConfig.discounts, id),
    });
  }

  for (const id of input.facets.weights) {
    chips.push({
      id: `weight-${id}`,
      label: labelForFacetOption(collectionFilterConfig.weightRanges, id),
    });
  }

  for (const id of input.facets.materials) {
    chips.push({
      id: `material-${id}`,
      label: labelForFacetOption(collectionFilterConfig.materials, id),
    });
  }

  for (const id of input.facets.metals) {
    chips.push({
      id: `metal-${id}`,
      label: labelForFacetOption(collectionFilterConfig.metals, id),
    });
  }

  for (const id of input.facets.shopFor) {
    chips.push({
      id: `shop-${id}`,
      label: labelForFacetOption(collectionFilterConfig.shopFor, id),
    });
  }

  for (const id of input.facets.occasions) {
    chips.push({
      id: `occasion-${id}`,
      label: labelForFacetOption(collectionFilterConfig.occasions, id),
    });
  }

  for (const id of input.facets.searchTags) {
    const label =
      input.searchTagOptions?.find((option) => option.id === id)?.label ??
      id.replace(/-/g, " ");
    chips.push({
      id: `search-tag-${id}`,
      label,
    });
  }

  return chips;
}

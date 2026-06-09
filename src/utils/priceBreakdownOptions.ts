import productContent, { formatProductCopy } from "@/lib/productContent";
import type { Product, ProductOption, ProductSizeOption } from "@/types/product";
import { resolveDiamondQualityOption } from "@/utils/diamondQualityOption";
import type { ClientCartLine } from "@/types/cart";
import {
  getSizeBreakdownTemplate,
  readSizeFromAttributes,
} from "@/utils/productCustomizationLabels";

export type PriceBreakdownOptionLine = {
  label: string;
  amount: number;
};

const copy = productContent.priceBreakdown;

function pushLine(
  lines: PriceBreakdownOptionLine[],
  template: string,
  placeholderKey: string,
  value: string,
  amount?: number
) {
  if (!amount || amount === 0) return;
  lines.push({
    label: formatProductCopy(template, { [placeholderKey]: value }),
    amount: Math.round(amount),
  });
}

export function buildPriceBreakdownOptionLines(input: {
  metal?: ProductOption | null;
  carat?: ProductOption | null;
  quality?: ProductOption | null;
  size?: ProductSizeOption | null;
  product?: Product;
}): PriceBreakdownOptionLine[] {
  const lines: PriceBreakdownOptionLine[] = [];
  const sizeLineTemplate = input.product
    ? getSizeBreakdownTemplate(input.product)
    : copy.sizeOption.replace("{sizeLabel}", "Size");

  pushLine(lines, copy.metalOption, "metal", input.metal?.label ?? "", input.metal?.priceAdjustment);
  pushLine(lines, copy.caratOption, "carat", input.carat?.label ?? "", input.carat?.priceAdjustment);
  pushLine(
    lines,
    copy.diamondQuality,
    "quality",
    input.quality?.label ?? "",
    input.quality?.priceAdjustment
  );
  pushLine(
    lines,
    sizeLineTemplate,
    "size",
    input.size?.size ?? "",
    input.size?.priceAdjustment
  );

  return lines;
}

function attrValue(
  attributes: { key: string; value: string }[],
  key: string
): string | undefined {
  return attributes.find((a) => a.key === key)?.value.trim();
}

export function buildPriceBreakdownOptionLinesFromCartLine(
  line: ClientCartLine,
  product: Product
): PriceBreakdownOptionLine[] {
  const metalLabel = attrValue(line.attributes, "Metal");
  const caratLabel = attrValue(line.attributes, "Carat");
  const qualityLabel = attrValue(line.attributes, "Diamond Quality");
  const sizeLabel = readSizeFromAttributes(line.attributes, product);

  return buildPriceBreakdownOptionLines({
    metal: product.metalOptions?.find((option) => option.label === metalLabel) ?? null,
    carat: product.caratOptions?.find((option) => option.label === caratLabel) ?? null,
    quality: qualityLabel
      ? resolveDiamondQualityOption(product, qualityLabel)
      : null,
    size: product.sizeOptions?.find((option) => option.size === sizeLabel) ?? null,
    product,
  });
}

export function sumOptionLineAmounts(lines: PriceBreakdownOptionLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

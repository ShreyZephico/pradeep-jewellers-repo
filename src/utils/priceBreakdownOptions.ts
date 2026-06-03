import productContent, { formatProductCopy } from "@/lib/productContent";
import type { ProductOption, ProductSizeOption } from "@/types/product";
import type { ClientCartLine } from "@/types/cart";

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
}): PriceBreakdownOptionLine[] {
  const lines: PriceBreakdownOptionLine[] = [];

  pushLine(lines, copy.metalOption, "metal", input.metal?.label ?? "", input.metal?.priceAdjustment);
  pushLine(lines, copy.caratOption, "carat", input.carat?.label ?? "", input.carat?.priceAdjustment);
  pushLine(
    lines,
    copy.diamondQuality,
    "quality",
    input.quality?.label ?? "",
    input.quality?.priceAdjustment
  );
  pushLine(lines, copy.ringSize, "size", input.size?.size ?? "", input.size?.priceAdjustment);

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
  product: {
    metalOptions?: ProductOption[];
    caratOptions?: ProductOption[];
    diamondQualities?: ProductOption[];
    sizeOptions?: ProductSizeOption[];
  }
): PriceBreakdownOptionLine[] {
  const metalLabel = attrValue(line.attributes, "Metal");
  const caratLabel = attrValue(line.attributes, "Carat");
  const qualityLabel = attrValue(line.attributes, "Diamond Quality");
  const sizeLabel = attrValue(line.attributes, "Ring Size");

  return buildPriceBreakdownOptionLines({
    metal: product.metalOptions?.find((option) => option.label === metalLabel) ?? null,
    carat: product.caratOptions?.find((option) => option.label === caratLabel) ?? null,
    quality: product.diamondQualities?.find((option) => option.label === qualityLabel) ?? null,
    size: product.sizeOptions?.find((option) => option.size === sizeLabel) ?? null,
  });
}

export function sumOptionLineAmounts(lines: PriceBreakdownOptionLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

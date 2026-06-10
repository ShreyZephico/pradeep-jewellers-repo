import contactData from "@/data/contactDatas.json";
import productContent, { formatProductCopy } from "@/lib/productContent";
import { getSiteOrigin } from "@/lib/siteUrl";
import type { Product } from "@/types/product";
import { formatProductPrice } from "@/utils/formatPrice";
import {
  getCustomizationSummarySegments,
  type CustomizationSelections,
} from "@/utils/productCustomization";
import { getProductHref } from "@/utils/productUrl";

const copy = productContent.detail;

function parseWhatsAppNumber(waUrl: string): string {
  const match = waUrl.match(/wa\.me\/(\d+)/);
  return match?.[1] ?? "";
}

export type ProductWhatsAppEnquireOptions = {
  origin?: string;
  selection?: CustomizationSelections;
  totalPrice?: number;
};

function buildCustomizationLines(
  product: Product,
  selection: CustomizationSelections | undefined
): string[] {
  if (!selection) {
    return [];
  }

  const segments = getCustomizationSummarySegments(product, selection, {
    size: copy.summarySizeLabel ?? "Size",
    metal: copy.summaryMetalLabel ?? "Metal",
    diamond: copy.summaryDiamondLabel ?? "Diamond",
  });

  return segments
    .filter((segment) => segment.value.trim() && segment.value !== "—")
    .map((segment) => `• ${segment.label}: ${segment.value}`);
}

export function buildProductWhatsAppEnquireMessage(
  product: Pick<Product, "id" | "slug" | "handle" | "name"> & Partial<Product>,
  options: ProductWhatsAppEnquireOptions = {}
): string {
  const siteOrigin = (options.origin ?? getSiteOrigin()).replace(/\/+$/, "");
  const productUrl = `${siteOrigin}${getProductHref(product)}`;
  const customizationLines = buildCustomizationLines(
    product as Product,
    options.selection
  );

  const customizationBlock =
    customizationLines.length > 0
      ? `\n\nMy selections:\n${customizationLines.join("\n")}`
      : "";

  const priceBlock =
    typeof options.totalPrice === "number" &&
    Number.isFinite(options.totalPrice) &&
    options.totalPrice > 0
      ? `\n\nEstimated price: ${formatProductPrice(options.totalPrice)}`
      : "";

  return formatProductCopy(copy.whatsappEnquireMessage, {
    productName: product.name,
    productUrl,
    customizationBlock,
    priceBlock,
  });
}

export function buildProductWhatsAppEnquireUrl(
  product: Pick<Product, "id" | "slug" | "handle" | "name"> & Partial<Product>,
  options: ProductWhatsAppEnquireOptions = {}
): string {
  const waNumber = parseWhatsAppNumber(contactData.social.whatsapp);
  if (!waNumber) {
    return "";
  }

  const message = buildProductWhatsAppEnquireMessage(product, options);
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

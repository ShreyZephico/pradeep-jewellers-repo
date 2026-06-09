import contactData from "@/data/contactDatas.json";
import productContent, { formatProductCopy } from "@/lib/productContent";
import { getSiteOrigin } from "@/lib/siteUrl";
import type { Product } from "@/types/product";
import { getProductHref } from "@/utils/productUrl";

function parseWhatsAppNumber(waUrl: string): string {
  const match = waUrl.match(/wa\.me\/(\d+)/);
  return match?.[1] ?? "";
}

export function buildProductWhatsAppEnquireUrl(
  product: Pick<Product, "id" | "slug" | "handle" | "name">,
  origin?: string
): string {
  const waNumber = parseWhatsAppNumber(contactData.social.whatsapp);
  if (!waNumber) {
    return "";
  }

  const siteOrigin = (origin ?? getSiteOrigin()).replace(/\/+$/, "");
  const productUrl = `${siteOrigin}${getProductHref(product)}`;
  const message = formatProductCopy(productContent.detail.whatsappEnquireMessage, {
    productName: product.name,
    productUrl,
  });

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

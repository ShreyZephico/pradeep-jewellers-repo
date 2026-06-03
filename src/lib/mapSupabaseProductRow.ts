import type { Product, ProductSizeOption } from "@/types/product";
import calculateVariantPrice from "@/utils/calculateVariantPrice";

/** Supabase nested select for products + variants (shared by list and detail APIs). */
export const SUPABASE_PRODUCT_WITH_VARIANTS = `
  *,

  variants (
    *,

    sizes (
      id,
      label,
      mm_value
    ),

    metals (
      id,
      name
    ),

    diamond_qualities (
      id,
      name
    ),

    gold_carats!variants_gold_carat_id_fkey (
      id,
      name
    ),

    colors (
      id,
      name
    )
  )
`;

/**
 * Maps a Supabase `products` row (with nested `variants`) to the frontend `Product` shape.
 */
export async function mapSupabaseProductRowToProduct(product: any): Promise<Product> {
  const variantRows = product.variants ?? [];
  const catalogMaking = Number(product.making_charge);
  const makingChargePercent =
    Number.isFinite(catalogMaking) && catalogMaking >= 0
      ? catalogMaking
      : undefined;

  const variants = await Promise.all(
    variantRows.map(async (variant: any) => {
      const pricing = await calculateVariantPrice({
        weight: Number(variant.weight || 0),
        carat: variant.gold_carats?.name,
        makingChargePercent,
      });

      const catalogVariantId = String(variant.id);

      const gidFromDb = [
        variant.shopify_variant_id,
        variant.shopify_variant_gid,
        variant.storefront_variant_id,
      ].find(
        (x: unknown) =>
          typeof x === "string" &&
          x.startsWith("gid://shopify/ProductVariant/")
      ) as string | undefined;

      return {
        id: gidFromDb ?? catalogVariantId,
        catalogVariantId,

        title:
          variant.variant_name ||
          `${variant.metals?.name || ""} ${variant.sizes?.label || ""}`.trim(),

        price: pricing.finalPrice,
        actualGoldPrice: pricing.actualGoldPrice,
        makingCharge: pricing.makingCharge,
        gst: pricing.gst,
        perGramRate: pricing.perGramRate,
        purity: pricing.purity,

        stockQty: variant.stock_qty || 0,
        availableForSale: variant.stock_qty > 0,

        image: variant.image_url || product.default_image_url,

        weight: variant.weight || 0,

        size: variant.sizes?.label || null,
        mm: variant.sizes?.mm_value || null,

        metal: variant.metals?.name || null,

        diamondQuality:
          variant.diamond_qualities?.name || null,

        carat:
          variant.gold_carats?.name || null,

        color:
          variant.colors?.name || null,

        selectedOptions: [
          {
            name: "Metal",
            value: variant.metals?.name || "",
          },
          {
            name: "Size",
            value: variant.sizes?.label || "",
          },
          {
            name: "Diamond Quality",
            value: variant.diamond_qualities?.name || "",
          },
          {
            name: "Carat",
            value: variant.gold_carats?.name || "",
          },
          {
            name: "Color",
            value: variant.colors?.name || "",
          },
        ].filter((option) => option.value),
      };
    })
  );

  const defaultVariant = variants[0];

  const listPriceRaw =
    (product as { compare_at_price?: number }).compare_at_price;

  const compareAtPrice =
    typeof listPriceRaw === "number" && listPriceRaw > 0
      ? listPriceRaw
      : null;

  const imageUrls = new Set<string>();

  const main =
    product.default_image_url || "/placeholder.jpg";

  imageUrls.add(main);

  for (const v of variants) {
    if (v.image && typeof v.image === "string") {
      imageUrls.add(v.image);
    }
  }

  return {
    id: product.id,

    name: product.name,

    slug: product.slug,

    description: product.description || "",

    shortDescription:
      product.short_description || "",

    vendor: product.vendor || "",

    price: defaultVariant?.price || 0,

    compareAtPrice,

    image: main,

    images: Array.from(imageUrls),

    variantId: defaultVariant?.id || null,

    variants,

    metalOptions: [
      ...new Set(
        variants
          .map((v: any) => v.metal)
          .filter(Boolean)
      ),
    ].map((label) => ({
      label: String(label),
    })),

    diamondQualities: [
      ...new Set(
        variants
          .map((v: any) => v.diamondQuality)
          .filter(Boolean)
      ),
    ].map((label) => ({
      label: String(label),
    })),

    sizeOptions: Array.from(
      new Map(
        variants
          .filter((v: any) => v.size)
          .map((v: any) => [
            v.size,
            {
              size: String(v.size),
              mm:
                v.mm != null
                  ? String(v.mm)
                  : undefined,
            },
          ])
      ).values()
    ) as ProductSizeOption[],

    colorOptions: [
      ...new Set(
        variants
          .map((v: any) => v.color)
          .filter(Boolean)
      ),
    ].map((label) => ({
      label: String(label),
    })),

    caratOptions: [
      ...new Set(
        variants
          .map((v: any) => v.carat)
          .filter(Boolean)
      ),
    ].map((label) => ({
      label: String(label),
    })),

    customizable:
      product.customizable || false,

    makingChargePercent,

    handle:
      product.shopify_handle,
  };
}
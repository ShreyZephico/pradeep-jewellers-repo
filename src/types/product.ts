export type ProductOption = {
  label: string;
  note?: string;
  priceAdjustment?: number;
};

export type ProductSizeOption = {
  size: string;
  mm?: string;
  note?: string;
  priceAdjustment?: number;
};

export type ProductVariant = {
  id: string;
  /** Original Supabase variant UUID (stable) when `id` is overlayed with a Shopify GID. */
  catalogVariantId?: string;
  title?: string;
  image?: string;
  price: number;
  compareAtPrice?: number | null;
  availableForSale?: boolean;
  quantityAvailable?: number;
  sku?: string;
  /** Supabase / admin-only fields (optional) */
  stockQty?: number;
  weight?: number;
  size?: string | null;
  mm?: string | null;
  metal?: string | null;
  diamondQuality?: string | null;
  carat?: string | null;
  color?: string | null;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  actualGoldPrice?: number;
  makingCharge?: number;
  gst?: number;
  perGramRate?: number;
  purity?: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  /** URL slug from catalog (Supabase) */
  slug?: string;
  shortDescription?: string;
  vendor?: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  images?: string[];
  variantId?: string;
  /** Total Shopify variants (listing pages may omit full variant payloads). */
  variantCount?: number;
  variants?: ProductVariant[];
  badge?: string;
  /** Approximate making charge % vs gold value (from price breakdown). */
  makingChargePercent?: number;
  customizable: boolean;
  handle?: string;
  productType?: string;
  tags?: string[];
  metalOptionName?: string;
  caratOptionName?: string;
  diamondOptionName?: string;
  sizeOptionName?: string;
  metalOptions?: ProductOption[];
  caratOptions?: ProductOption[];
  diamondQualities?: ProductOption[];
  sizeOptions?: ProductSizeOption[];
  colorOptions?: ProductOption[];
};
import { Pool } from "pg";
import type { Product, ProductOption, ProductSizeOption } from "@/types/product";

import { getPgPoolConfig } from "@/lib/pgConnection";

const connectionString =
  process.env.DATABASE_URL?.trim() ??
  "postgresql://zephico:zephico_password@localhost:5435/zephico_jewels";

const globalForPg = globalThis as unknown as {
  zephicoPgPool?: Pool;
};

const pool =
  globalForPg.zephicoPgPool ?? new Pool(getPgPoolConfig(connectionString));
if (process.env.NODE_ENV !== "production") {
  globalForPg.zephicoPgPool = pool;
}

type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number;
  image: string;
  variant_id: string | null;
  badge: string | null;
  customizable: boolean;
};

type ProductOptionRow = {
  product_id: string;
  option_type: "metal" | "carat" | "diamond_quality" | "ring_size";
  option_label: string;
  option_note: string;
  size_mm: string | null;
  price_adjustment: number;
};

function mapProductRow(
  row: ProductRow,
  options: ProductOptionRow[] = []
): Product {
  const productOptions = options.filter((option) => option.product_id === row.id);
  const mapStandardOptions = (optionType: ProductOptionRow["option_type"]) =>
    productOptions
      .filter((option) => option.option_type === optionType)
      .map<ProductOption>((option) => ({
        label: option.option_label,
        note: option.option_note,
        priceAdjustment: option.price_adjustment,
      }));
  const sizeOptions = productOptions
    .filter((option) => option.option_type === "ring_size")
    .map<ProductSizeOption>((option) => ({
      size: option.option_label,
      mm: option.size_mm ?? "",
      note: option.option_note,
      priceAdjustment: option.price_adjustment,
    }));
  const metalOptions = mapStandardOptions("metal");
  const caratOptions = mapStandardOptions("carat");
  const diamondQualities = mapStandardOptions("diamond_quality");

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compare_at_price > 0 ? row.compare_at_price : null,
    image: row.image,
    variantId: row.variant_id ?? undefined,
    badge: row.badge ?? undefined,
    customizable: row.customizable,
    metalOptions: metalOptions.length > 0 ? metalOptions : undefined,
    caratOptions: caratOptions.length > 0 ? caratOptions : undefined,
    diamondQualities:
      diamondQualities.length > 0 ? diamondQualities : undefined,
    sizeOptions: sizeOptions.length > 0 ? sizeOptions : undefined,
  };
}

export async function getDatabaseProducts(): Promise<Product[]> {
  const result = await pool.query<ProductRow>(
    `SELECT
      id,
      name,
      description,
      price,
      compare_at_price,
      image,
      variant_id,
      badge,
      customizable
    FROM products
    ORDER BY
      CASE WHEN customizable THEN 0 ELSE 1 END,
      name ASC`
  );

  if (result.rows.length === 0) {
    return [];
  }

  const optionResult = await pool.query<ProductOptionRow>(
    `SELECT
      product_id,
      option_type,
      option_label,
      option_note,
      size_mm,
      price_adjustment
    FROM product_options
    WHERE product_id = ANY($1)
    ORDER BY product_id, display_order ASC`,
    [result.rows.map((row) => row.id)]
  );

  return result.rows.map((row) => mapProductRow(row, optionResult.rows));
}

export default pool;
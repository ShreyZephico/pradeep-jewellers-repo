import productContent from "@/data/product.json";

export type ProductContent = typeof productContent;

export default productContent as ProductContent;

/** Replace `{key}` placeholders in copy strings. */
export function formatProductCopy(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

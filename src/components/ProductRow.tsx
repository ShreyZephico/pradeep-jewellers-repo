import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";

type ProductRowProps = {
  products: Product[];
};

export default function ProductRow({ products }: ProductRowProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[#d8bd8a] bg-[#fffdf8] px-6 py-16 text-center">
        <p className="text-lg font-black text-[#2f1c12]">
          No jewellery found
        </p>
        <p className="mt-2 text-sm text-[#9d8a76]">
          Try searching for rings, bands, gold, or diamonds.
        </p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}

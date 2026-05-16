import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { getProductHref } from "@/utils/productUrl";

type ProductCardProps = {
  product: Product;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

export default function ProductCard({ product }: ProductCardProps) {
  const list = product.compareAtPrice ?? 0;
  return (
    <Link
      href={getProductHref(product)}
      className="group block overflow-hidden rounded-[2rem] border border-[#e9d7bd] bg-[#fffdf8] shadow-[0_18px_50px_rgba(70,45,21,0.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#d6a850] hover:shadow-[0_28px_70px_rgba(70,45,21,0.16)]"
    >
      <div className="relative flex h-60 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#fff7df_0%,#fbf4ea_48%,#f4e7d7_100%)] p-6">
        <Image
          src={product.image}
          alt={product.name}
          width={260}
          height={220}
          className="relative max-h-48 w-auto object-contain drop-shadow-[0_18px_18px_rgba(78,48,20,0.12)] transition duration-500 group-hover:scale-110 group-hover:rotate-[-2deg]"
        />
      </div>

      <div className="space-y-3 p-4">
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-black text-[#2f1c12]">
              {formatPrice(product.price)}
            </p>

            {list > product.price ? (
              <p className="text-sm font-semibold text-[#b39d86] line-through">
                {formatPrice(list)}
              </p>
            ) : null}
          </div>

          <span
            className="mt-1 block text-sm font-bold text-[#b47723] transition group-hover:text-[#6e3d18]"
          >
            Check delivery date
          </span>
        </div>

        <div>
          <h3 className="line-clamp-1 text-sm font-black text-[#4b3527]">
            {product.name}
          </h3>

          <p className="mt-1 text-xs font-medium text-[#9d8a76]">
            {product.description}
          </p>
        </div>

        <span
          className="flex w-full items-center justify-center rounded-full border border-[#d8bd8a] bg-[#fffaf2] px-4 py-2 text-sm font-black text-[#3c2415] transition group-hover:border-[#9F2B68] group-hover:bg-[#9F2B68] group-hover:text-[#f7d58b]"
        >
          {product.customizable ? "Customize" : "View details"}
        </span>
      </div>
    </Link>
  );
}

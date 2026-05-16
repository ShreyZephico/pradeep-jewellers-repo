"use client";

import { useMemo, useState } from "react";
import ProductRow from "@/components/ProductRow";
import SearchBar from "@/components/SearchBar";
import type { Product } from "@/types/product";

type HomePageClientProps = {
  products: Product[];
};

export default function HomePageClient({ products }: HomePageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }, [products, searchTerm]);

  return (
    <div className="min-h-full overflow-hidden bg-[#f7efe3] text-[#2f1c12]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(244,199,107,0.42),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(117,66,37,0.18),transparent_26%),linear-gradient(135deg,#fffaf2_0%,#f7efe3_46%,#efe0cf_100%)]" />

      <section className="mx-auto max-w-[1440px] px-5 py-10">
        <div className="relative mb-10 overflow-hidden rounded-[2.5rem] border border-[#eadcc8] bg-[#fffaf2]/75 px-6 py-10 shadow-[0_30px_90px_rgba(70,45,21,0.12)] backdrop-blur md:px-10">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#f4c76b]/35 blur-3xl" />

          <div className="relative max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.34em] text-[#b47723]">
              Fine Jewellery Studio
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.04em] text-[#2f1c12] sm:text-6xl">
              Jewellery with a quieter kind of luxury.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#765f4a]">
              Discover sculptural rings, warm gold finishes, and custom details
              that feel collected rather than mass produced.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-[#d8bd8a] bg-white/65 px-4 py-2 text-sm font-bold text-[#4a2b17]">
                Certified diamonds
              </span>
              <span className="rounded-full border border-[#d8bd8a] bg-white/65 px-4 py-2 text-sm font-bold text-[#4a2b17]">
                Made-to-order sizing
              </span>
              <span className="rounded-full bg-[#9F2B68] px-4 py-2 text-sm font-bold text-[#f7d58b]">
                {products.length} curated designs
              </span>
            </div>

            <div className="mt-8 max-w-xl">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
            </div>
          </div>
        </div>

        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b47723]">
              Signature Selection
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#2f1c12]">
              Rings Worth Pausing For
            </h2>
            <p className="mt-1 text-sm font-medium text-[#765f4a]">
              Search, compare, and customise your favourite design.
            </p>
          </div>

          <p className="hidden rounded-full border border-[#d8bd8a] bg-[#fffaf2]/70 px-4 py-2 text-sm font-bold text-[#765f4a] sm:block">
            {filteredProducts.length} designs shown
          </p>
        </div>

        <ProductRow products={filteredProducts} />
      </section>
    </div>
  );
}

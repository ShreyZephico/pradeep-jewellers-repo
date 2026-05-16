"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import ProductPurchasePanel, { formatProductPrice } from "@/components/ProductPurchasePanel";

type ProductDetailClientProps = {
  slug: string;
};

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 45_000);

        const response = await fetch(
          `/api/product/${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );
        window.clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok || !data.success || !data.product) {
          throw new Error(data.error || "Product not found");
        }

        if (!cancelled) {
          setProduct(data.product as Product);
          const imgs = (data.product as Product).images?.length
            ? (data.product as Product).images!
            : [(data.product as Product).image];
          setActiveImage(imgs[0] ?? "/placeholder.jpg");
        }
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error && e.name === "AbortError"
              ? "Product took too long to load. Please refresh or try again."
              : e instanceof Error
                ? e.message
                : "Something went wrong";
          setError(message);
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const gallery =
    product?.images?.filter(Boolean).length && product.images!.length > 0
      ? product.images!
      : product
        ? [product.image]
        : [];

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#eadcc8] border-t-[#9F2B68]" />
        <p className="text-sm font-medium text-[#765f4a]">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="max-w-md rounded-3xl border border-[#eadcc8] bg-white p-10 text-center shadow-lg">
          <h1 className="text-xl font-black text-[#2f1c12]">Product unavailable</h1>
          <p className="mt-2 text-sm text-[#765f4a]">{error || "We could not load this item."}</p>
          <Link
            href="/products"
            className="mt-8 inline-block rounded-full bg-[#9F2B68] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#7a1f4f]"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const specRows =
    product.variants?.[0]?.selectedOptions?.map((o) => ({
      label: o.name,
      value: o.value,
    })) ?? [];

  return (
    <div className="min-h-full bg-[#f7efe3] pb-16 text-[#2f1c12]">
      <div className="border-b border-[#eadcc8]/90 bg-[#fffaf2]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-sm text-[#765f4a]">
          <Link href="/landing#home" className="transition hover:text-[#9F2B68]">
            Home
          </Link>
          <span className="text-[#d8bd8a]">/</span>
          <Link href="/products" className="transition hover:text-[#9F2B68]">
            Shop
          </Link>
          <span className="text-[#d8bd8a]">/</span>
          <span className="line-clamp-1 font-semibold text-[#2f1c12]">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="overflow-hidden rounded-3xl border border-[#eadcc8] bg-white shadow-[0_24px_80px_rgba(70,45,21,0.08)]">
              <div className="relative aspect-square bg-gradient-to-br from-[#fbf4ea] to-[#f0e3d4]">
                {activeImage && activeImage !== "/placeholder.jpg" ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    className="object-contain p-8"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl text-[#d8bd8a]">
                    ✦
                  </div>
                )}
              </div>
            </div>

            {gallery.length > 1 ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {gallery.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(src)}
                    className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 bg-white p-1 transition ${
                      activeImage === src
                        ? "border-[#9F2B68] ring-2 ring-[#9F2B68]/30"
                        : "border-[#eadcc8] hover:border-[#d8bd8a]"
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            ) : null}

            <section className="mt-10 rounded-3xl border border-[#eadcc8] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-[#2f1c12]">About this piece</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#4a2b17]">
                {product.description}
              </p>
              {product.shortDescription ? (
                <p className="mt-4 text-sm leading-relaxed text-[#765f4a]">
                  {product.shortDescription}
                </p>
              ) : null}
            </section>

            {specRows.length > 0 ? (
              <section className="mt-6 rounded-3xl border border-[#eadcc8] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-black text-[#2f1c12]">Specifications</h2>
                <table className="mt-4 w-full text-sm">
                  <tbody>
                    {specRows.map((row) => (
                      <tr
                        key={`${row.label}-${row.value}`}
                        className="border-b border-[#f4e7d7] last:border-0"
                      >
                        <th className="py-3 pr-4 text-left font-semibold text-[#765f4a]">
                          {row.label}
                        </th>
                        <td className="py-3 font-medium text-[#2f1c12]">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-[#eadcc8] bg-white shadow-[0_24px_80px_rgba(70,45,21,0.1)]">
              <div className="border-b border-[#f4e7d7] p-5 sm:p-6">
                {product.vendor ? (
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9d8a76]">
                    {product.vendor}
                  </p>
                ) : (
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9d8a76]">
                    Pradeep Jewellers
                  </p>
                )}
                <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-[#2f1c12] sm:text-3xl">
                  {product.name}
                </h1>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-amber-500" aria-hidden>
                    ★★★★★
                  </span>
                  <span className="text-sm font-semibold text-[#765f4a]">4.8 (studio rated)</span>
                </div>

                <ul className="mt-6 space-y-2 text-sm text-[#4a2b17]">
                  <li className="flex gap-2">
                    <span className="text-[#9F2B68]" aria-hidden>
                      ✓
                    </span>
                    BIS hallmarked gold where applicable; certified diamonds on request.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#9F2B68]" aria-hidden>
                      ✓
                    </span>
                    Secure packaging & insured shipping options at checkout.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#9F2B68]" aria-hidden>
                      ✓
                    </span>
                    Need sizing help? Book a private appointment from the header.
                  </li>
                </ul>
              </div>

              <ProductPurchasePanel
                product={product}
                showDesignSummary={false}
                priceHeaderVariant="page"
                checkoutButtonLabel="Buy now"
                checkoutFlow="storefront-cart"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

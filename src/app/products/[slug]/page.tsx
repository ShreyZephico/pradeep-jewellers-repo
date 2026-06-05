import ProductDetailClient from "@/components/productComponent/ProductDetailClient";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Client shows cached list data instantly; API refresh runs in background. */
export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}

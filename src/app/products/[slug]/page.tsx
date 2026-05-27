import ProductDetailClient from "@/components/productComponent/ProductDetailClient";

// Force Next.js to always treat this as a fresh page —
// prevents the router cache from serving a frozen shell on back-navigation
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailClient key={slug} slug={slug} />;
}
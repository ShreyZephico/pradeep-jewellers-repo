import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MetalPricesAccessDenied from "@/components/metal-prices/MetalPricesAccessDenied";
import { getMetalPricesAccess } from "@/lib/accessUsers";

import "./metal-prices.css";

export const metadata: Metadata = {
  title: "Metal Prices | Pradeep Jewellers",
  robots: { index: false, follow: false },
};

export default async function MetalPricesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getMetalPricesAccess();

  if (!access.authenticated) {
    return <MetalPricesAccessDenied />;
  }

  if (!access.authorized) {
    notFound();
  }

  return children;
}

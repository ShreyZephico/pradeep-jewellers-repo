import type { Metadata } from "next";

import NotFoundPage from "@/components/not-found/NotFoundPage";
import notFoundData from "@/data/notFound.json";

export const metadata: Metadata = {
  title: `${notFoundData.meta.title} | ${notFoundData.brandName}`,
  description: notFoundData.meta.description,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundPage />;
}

import type { Metadata } from "next";

import AboutPage from "@/components/about/AboutPage";
import aboutData from "@/data/about.json";

export const metadata: Metadata = {
  title: `${aboutData.meta.title} | Pradeep Jewellers`,
  description: aboutData.meta.description,
};

export default function AboutRoutePage() {
  return <AboutPage />;
}

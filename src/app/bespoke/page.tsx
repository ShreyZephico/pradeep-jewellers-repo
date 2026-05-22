import type { Metadata } from "next";

import "@/components/bespoke-page/css/bespoke-page.css";

import BespokePage from "@/components/bespoke-page/BespokePage";

export const metadata: Metadata = {
  title: "Bespoke & Custom Orders | Pradeep Jewellers",
  description:
    "Design your dream jewellery with expert craftsmen. Get a custom quote for rings, necklaces, redesigns, and more.",
};

export default function BespokeRoutePage() {
  return <BespokePage />;
}

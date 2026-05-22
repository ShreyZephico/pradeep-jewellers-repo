"use client";

import { useCallback } from "react";

import { useRevealOnScroll } from "./useRevealOnScroll";
import BespokeFaqSection from "./sections/BespokeFaqSection";
import BespokeFinalCtaSection from "./sections/BespokeFinalCtaSection";
import BespokeGallerySection from "./sections/BespokeGallerySection";
import BespokeHeroSection from "./sections/BespokeHeroSection";
import BespokeProcessSection from "./sections/BespokeProcessSection";
import BespokeQuoteFormSection from "./sections/BespokeQuoteFormSection";
import BespokeStickyBar from "./sections/BespokeStickyBar";

export default function BespokePage() {
  useRevealOnScroll();

  const scrollToForm = useCallback(() => {
    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <main className="bespoke-page">
      <BespokeHeroSection onStart={scrollToForm} />
      <BespokeGallerySection />
      <BespokeProcessSection />
      <BespokeQuoteFormSection />
      <BespokeFaqSection />
      <BespokeFinalCtaSection onQuote={scrollToForm} />
      <BespokeStickyBar onQuote={scrollToForm} />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { HOME_REFETCH_EVENT } from "@/lib/homeRefetch";

import HeroSection from "@/components/home/HeroSection";
import CollectionsSection from "@/components/home/CollectionsSection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";

const CallbackLeadSection = dynamic(
  () => import("@/components/home/CallbackLeadSection"),
  {
    loading: () => (
      <section
        className="callback-lead-section"
        aria-hidden
        style={{ minHeight: "14rem" }}
      />
    ),
  }
);

const CuratedSection = dynamic(
  () => import("@/components/home/CuratedSection")
);

const BespokeSection = dynamic(
  () => import("@/components/home/BespokeSection")
);

const GiftingSection = dynamic(
  () => import("@/components/home/GiftingSection")
);

const PricingSection = dynamic(
  () => import("@/components/home/PricingSection")
);

const GoldSchemeSection = dynamic(
  () => import("@/components/home/GoldSchemeSection")
);

const LearnSection = dynamic(
  () => import("@/components/home/LearnSection")
);

const TestimonialsSection = dynamic(
  () => import("@/components/home/TestimonialsSection"),
  {
    loading: () => (
      <section
        className="testimonials-section"
        aria-hidden
        style={{ minHeight: "12rem" }}
      />
    ),
  }
);

const SocialSection = dynamic(
  () => import("@/components/home/SocialSection")
);

export default function HomePageClient() {
  const [sectionKey, setSectionKey] = useState(0);

  useEffect(() => {
    const bump = () => setSectionKey((k) => k + 1);

    window.addEventListener(HOME_REFETCH_EVENT, bump);

    return () => window.removeEventListener(HOME_REFETCH_EVENT, bump);
  }, []);

  const k = sectionKey;

  return (
    <>
      <HeroSection />

      <CollectionsSection />

      <FeaturedProductsSection key={`featured-${k}`} />

      <CuratedSection key={`curated-${k}`} />

      <BespokeSection key={`bespoke-${k}`} />

      <GiftingSection key={`gifting-${k}`} />

      <PricingSection key={`pricing-${k}`} />

      <GoldSchemeSection />

      <CallbackLeadSection key={`callback-${k}`} />

      <LearnSection key={`learn-${k}`} />

      <TestimonialsSection key={`testimonials-${k}`} />

      <SocialSection key={`social-${k}`} />
    </>
  );
}

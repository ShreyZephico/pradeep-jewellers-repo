"use client";

import dynamic from "next/dynamic";

import HeroSection from "@/components/home/HeroSection";
import LegacySection from "@/components/home/LegacySection";
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
    ssr: false,
  }
);

const CuratedSection = dynamic(
  () => import("@/components/home/CuratedSection"),
  { loading: () => null }
);
const BespokeSection = dynamic(
  () => import("@/components/home/BespokeSection"),
  { loading: () => null }
);
const GiftingSection = dynamic(
  () => import("@/components/home/GiftingSection"),
  { loading: () => null }
);
const PricingSection = dynamic(
  () => import("@/components/home/PricingSection"),
  { loading: () => null }
);
const GoldSchemeSection = dynamic(
  () => import("@/components/home/GoldSchemeSection"),
  { loading: () => null }
);
const LearnSection = dynamic(
  () => import("@/components/home/LearnSection"),
  { loading: () => null }
);
const FounderSection = dynamic(
  () => import("@/components/home/FounderSection"),
  { loading: () => null }
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
    ssr: false,
  }
);
const SocialSection = dynamic(
  () => import("@/components/home/SocialSection"),
  { loading: () => null }
);

export default function HomePageClient() {
  return (
    <>
      <HeroSection />

      {/* <LegacySection /> */}

      <CollectionsSection />

      <FeaturedProductsSection />

      <CuratedSection />

      <BespokeSection />

      <GiftingSection />

      <PricingSection />

      <GoldSchemeSection />

      <CallbackLeadSection />

      <LearnSection />

      {/* <FounderSection /> */}

      <TestimonialsSection />

      <SocialSection />
    </>
  );
}

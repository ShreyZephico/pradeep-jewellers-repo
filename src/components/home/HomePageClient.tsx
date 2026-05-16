"use client";

import dynamic from "next/dynamic";
import { GoldRatesProvider } from "@/contexts/GoldRatesContext";


import HeroSection from "@/components/home/HeroSection";
import LegacySection from "@/components/home/LegacySection";
import CollectionsSection from "@/components/home/CollectionsSection";

import data from "@/data/contactDatas.json";

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
  { loading: () => null }
);
const SocialSection = dynamic(
  () => import("@/components/home/SocialSection"),
  { loading: () => null }
);


export default function HomePageClient() {
  const refreshMs =
    (data.heroSection.rates.refreshIntervalMinutes ?? 10) * 60 * 1000;

  return (
    <GoldRatesProvider refreshMs={refreshMs}>
      
      <HeroSection />
      <LegacySection />
      <CollectionsSection />
      <CuratedSection />
      <BespokeSection />
      <GiftingSection />
      <PricingSection />
      <GoldSchemeSection />
      <LearnSection />
      <FounderSection />
      <TestimonialsSection />
      <SocialSection />
      
    </GoldRatesProvider>
  );
}

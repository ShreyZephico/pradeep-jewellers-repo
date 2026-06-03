"use client";

import CalculatorSection from "@/components/scheme/CalculatorSection";
import FaqSection from "@/components/scheme/FaqSection";
import Hero from "@/components/scheme/Hero";
import Mechanism from "@/components/scheme/Mechanism";
import SchemePageShell from "@/components/scheme/SchemePageShell";
import VisitUsSection from "@/components/scheme/VisitUsSection";
import { useSchemeContent } from "@/contexts/SchemeContentContext";

export default function SchemeLandingPage() {
  const { content } = useSchemeContent();

  return (
    <SchemePageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: content.meta.brandFullName,
            url: "/scheme",
            telephone: content.home?.visitUs?.phoneTel,
            address: {
              "@type": "PostalAddress",
              streetAddress: content.home?.visitUs?.address,
              addressRegion: "Gujarat",
              addressCountry: "IN",
            },
          }),
        }}
      />
      <Hero hero={content.home.hero} />
      <Mechanism mechanism={{ ...content.mechanism, id: "plans" }} />
      <CalculatorSection
        calculator={content.home.calculator}
        plans={content.plans.items}
      />
      <VisitUsSection visitUs={content.home.visitUs} />
      <FaqSection faq={content.home.faq} />
    </SchemePageShell>
  );
}

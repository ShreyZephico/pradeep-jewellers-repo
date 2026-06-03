import AboutBespokeSection from "@/components/about/sections/AboutBespokeSection";
import AboutBrandIntroSection from "@/components/about/sections/AboutBrandIntroSection";
import AboutBrandStatsSection from "@/components/about/sections/AboutBrandStatsSection";
import AboutCallbackSection from "@/components/about/sections/AboutCallbackSection";
import AboutCertificationsSection from "@/components/about/sections/AboutCertificationsSection";
import AboutCraftsmanshipSection from "@/components/about/sections/AboutCraftsmanshipSection";
import AboutFinalCtaSection from "@/components/about/sections/AboutFinalCtaSection";
import AboutFounderSection from "@/components/about/sections/AboutFounderSection";
import AboutHeritageTimelineSection from "@/components/about/sections/AboutHeritageTimelineSection";
import AboutHeroSection from "@/components/about/sections/AboutHeroSection";
import AboutOurStorySection from "@/components/about/sections/AboutOurStorySection";
import AboutShowroomSection from "@/components/about/sections/AboutShowroomSection";
import AboutSocialSection from "@/components/about/sections/AboutSocialSection";
import AboutTeamSection from "@/components/about/sections/AboutTeamSection";
import AboutTestimonialsSection from "@/components/about/sections/AboutTestimonialsSection";
import AboutWhyChooseSection from "@/components/about/sections/AboutWhyChooseSection";

import "./css/about-page.css";

export default function AboutPage() {
  return (
    <main className="about-page">
      <AboutHeroSection />
      <AboutBrandIntroSection />
      <AboutOurStorySection />
      <AboutFounderSection />
      <AboutHeritageTimelineSection />
      <AboutBrandStatsSection />
      <AboutCraftsmanshipSection />
      <AboutTeamSection />
      <AboutWhyChooseSection />
      <AboutCertificationsSection />
      <AboutBespokeSection />
      <AboutShowroomSection />
      <AboutTestimonialsSection />
      <AboutSocialSection />
      <AboutCallbackSection />
      <AboutFinalCtaSection />
    </main>
  );
}

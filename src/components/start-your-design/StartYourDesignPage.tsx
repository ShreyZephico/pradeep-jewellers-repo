"use client";

import { useRef, useState } from "react";

import { useRevealOnScroll } from "./useRevealOnScroll";
import StartDesignCategoriesSection from "./StartDesignCategoriesSection";
import StartDesignFaqSection from "./StartDesignFaqSection";
import StartDesignHeroSection from "./StartDesignHeroSection";
import StartDesignQuoteFormSection from "./StartDesignQuoteFormSection";
import StartDesignStepsSection from "./StartDesignStepsSection";

export default function StartYourDesignPage() {
  const heroRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const catsRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  const heroVisible = useRevealOnScroll(heroRef, { threshold: 0.08 });
  const stepsVisible = useRevealOnScroll(stepsRef);
  const catsVisible = useRevealOnScroll(catsRef);
  const formVisible = useRevealOnScroll(formRef);
  const faqVisible = useRevealOnScroll(faqRef);

  const [categoryId, setCategoryId] = useState("ring");

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="start-design">
      <section
        ref={heroRef}
        className="start-design__section start-design-hero"
        data-visible={heroVisible ? "true" : "false"}
        aria-labelledby="start-design-hero-title"
      >
        <div className="start-design-hero__bg" aria-hidden />
        <div className="start-design__container start-design__reveal">
          <StartDesignHeroSection
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            onScrollToForm={scrollToForm}
          />
        </div>
      </section>

      <section
        ref={stepsRef}
        className="start-design__section"
        data-visible={stepsVisible ? "true" : "false"}
        aria-labelledby="start-design-steps-title"
      >
        <div className="start-design__container start-design__reveal">
          <StartDesignStepsSection />
        </div>
      </section>

      <section
        ref={catsRef}
        className="start-design__section"
        data-visible={catsVisible ? "true" : "false"}
        aria-labelledby="start-design-cats-title"
      >
        <div className="start-design__container start-design__reveal">
          <StartDesignCategoriesSection
            categoryId={categoryId}
            setCategoryId={setCategoryId}
          />
        </div>
      </section>

      <section
        ref={formRef}
        className="start-design__section"
        data-visible={formVisible ? "true" : "false"}
        aria-labelledby="start-design-form-title"
      >
        <div className="start-design__container start-design__reveal">
          <StartDesignQuoteFormSection categoryId={categoryId} />
        </div>
      </section>

      <section
        ref={faqRef}
        className="start-design__section"
        data-visible={faqVisible ? "true" : "false"}
        aria-labelledby="start-design-faq-title"
      >
        <div className="start-design__container start-design__reveal">
          <StartDesignFaqSection />
        </div>
      </section>
    </main>
  );
}


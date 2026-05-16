"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./css/FAQSection.module.css";

const faqs = [
  {
    question: "Do you offer customization or resizing?",
    answer:
      "Yes, we offer complete customization services including resizing, engraving, stone changes, and made-to-order bridal or gifting requests. Our expert artisans work closely with you to bring your vision to life.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Ready-to-ship pieces are dispatched within 3-5 business days. Customized pieces typically require 2-4 weeks depending on design complexity and stone availability. International shipping may take additional time.",
  },
  {
    question: "Can I book a consultation before ordering?",
    answer:
      "Absolutely! We offer complimentary private consultations via video call or in-store. Our jewellery experts will guide you through our collections, help with customization, and answer all your questions.",
  },
  {
    question: "What is your return and exchange policy?",
    answer:
      "We offer a 15-day exchange policy on all ready-to-ship pieces. Customized and engraved pieces are final sale. Each piece comes with a certificate of authenticity and lifetime maintenance support.",
  },
  {
    question: "Are your diamonds and gold certified?",
    answer:
      "Yes, all our diamonds are GIA certified and our gold is BIS Hallmarked. We provide full certification with every purchase, ensuring authenticity and quality.",
  },
];

export default function FAQSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Animated Background Elements */}
      <div className={styles.bgAnimation}>
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />
        <div className={styles.glowOrb3} />
        <div className={styles.goldParticles} />
        <div className={styles.geometricPattern} />
      </div>

      <div className={styles.container}>
        <div className={`${styles.header} ${isVisible ? styles.visible : ""}`}>
          <div className={styles.eyebrowWrapper}>
            <span className={styles.eyebrowLine}></span>
            <p className={styles.eyebrow}>Frequently Asked Questions</p>
            <span className={styles.eyebrowLine}></span>
          </div>
          <h2 className={styles.title}>
            Helpful Answers <span className={styles.goldText}>Before the Purchase</span>
          </h2>
          <p className={styles.subtitle}>
            Everything you need to know about our jewellery, services, and policies
          </p>
          <div className={styles.headerAccent} />
        </div>

        <div className={`${styles.list} ${isVisible ? styles.visible : ""}`}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`${styles.item} ${openIndex === index ? styles.open : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button
                className={styles.question}
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className={styles.questionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6v12M6 12h12" />
                  </svg>
                </span>
                <span className={styles.questionText}>{faq.question}</span>
                <span className={`${styles.arrow} ${openIndex === index ? styles.rotated : ""}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>
              <div className={`${styles.answer} ${openIndex === index ? styles.show : ""}`}>
                <div className={styles.answerInner}>
                  <div className={styles.answerIcon}>💎</div>
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`${styles.contactPrompt} ${isVisible ? styles.visible : ""}`}>
          <p>Still have questions? <a href="#contact">Contact our jewellery experts →</a></p>
        </div>
      </div>
    </section>
  );
}
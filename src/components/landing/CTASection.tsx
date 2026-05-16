"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./css/CTASection.module.css";

export default function CTASection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Animated Background Elements */}
      <div className={styles.bgElements}>
        <div className={styles.goldDust} />
        <div className={styles.sparkles} />
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />
        <div className={styles.diamondPattern} />
      </div>

      <div className={styles.container}>
        <div className={`${styles.card} ${isVisible ? styles.visible : ""}`}>
          <div className={styles.cardInner}>
            <div className={styles.badgeWrapper}>
              <span className={styles.badgeDot} />
              <p className={styles.eyebrow}>Begin Your Journey</p>
              <span className={styles.badgeDot} />
            </div>
            
            <h2 className={styles.title}>
              Find the piece that marks 
              <span className={styles.goldText}> your next celebration</span> 
              beautifully.
            </h2>
            
            <div className={styles.titleAccent} />
            
            <p className={styles.description}>
              Discover timeless elegance crafted for life&apos;s most precious moments. 
              From engagements to anniversaries, find the perfect piece that tells your story.
            </p>
            
            <div className={styles.actions}>
              <a href="#featured-products" className={styles.primaryAction}>
                Shop Signature Pieces
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a href="#contact" className={styles.secondaryAction}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Talk to Our Team
              </a>
            </div>

            <div className={styles.trustSection}>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>✓</div>
                <span>Free Shipping</span>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>✓</div>
                <span>Lifetime Exchange</span>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>✓</div>
                <span>Certified Authentic</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

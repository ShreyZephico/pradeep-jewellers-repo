"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./css/CraftsmanshipSection.module.css";

export default function CraftsmanshipSection() {
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

  const highlights = [
    "Handcrafted by Experts",
    "Certified Gold & Diamonds",
    "Precision Finishing",
  ];

  return (
    <section ref={sectionRef} id="craftsmanship" className={styles.section}>
      {/* Premium Background Elements */}
      <div className={styles.bgElements}>
        <div className={styles.goldDust} />
        <div className={styles.luxuryPattern} />
      </div>

      <div className={styles.container}>
        <div className={`${styles.contentWrapper} ${isVisible ? styles.visible : ""}`}>
          {/* Left Side - Image */}
          <div className={styles.imageColumn}>
            <div className={styles.imageWrapper}>
              <div className={styles.imageOverlay} />
              <Image
                src="/images/placeholders/jewellery.svg"
                alt="Fine jewellery craftsmanship at Pradeep Jewellers"
                fill
                className={styles.craftsmanshipImage}
                priority
                unoptimized
              />
              <div className={styles.goldFrame} />
              <div className={styles.imageCaption}>
                <span>3rd Generation Artisans</span>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className={styles.contentColumn}>
            <div className={styles.contentInner}>
              <div className={styles.labelWrapper}>
                <span className={styles.labelLine}></span>
                <p className={styles.label}>Our Craftsmanship</p>
                <span className={styles.labelLine}></span>
              </div>
              
              <h2 className={styles.title}>
                Crafted with 
                <span className={styles.goldText}> Precision</span>
                <br />
                Designed with 
                <span className={styles.goldText}> Passion</span>
              </h2>
              
              <div className={styles.titleAccent} />
              
              <p className={styles.description}>
                At Pradeep Jewellers, every piece is handcrafted by skilled artisans 
                using the finest materials. From design to final polish, each creation 
                reflects unmatched quality and elegance.
              </p>

              <div className={styles.highlightsList}>
                {highlights.map((highlight, index) => (
                  <div 
                    key={highlight} 
                    className={styles.highlightItem}
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <div className={styles.checkmark} />
                    <span className={styles.highlightText}>{highlight}</span>
                  </div>
                ))}
              </div>

              <div className={styles.ctaWrapper}>
                <a href="#collections" className={styles.ctaButton}>
                  Explore Collection
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>

              <div className={styles.signature}>
                <div className={styles.signatureLine} />
                <span>Made in Nadiad</span>
                <div className={styles.signatureLine} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
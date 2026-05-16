"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./css/FeaturedCollectionSection.module.css";

const featuredCollections = [
  {
    title: "Bridal Royale",
    text: "Engage with the timeless beauty of bridal jewelry. Adorned with heritage and elegance.",
    image: "/image.png",
    link: "/collections/bridal-royale",
  },
  {
    title: "Diamond Luxe",
    text: "Luminous brilliance that captures light and heart. Pure elegance redefined.",
    image: "/dimg.png",
    link: "/collections/diamond-luxe",
  },
  {
    title: "Everyday Elegance",
    text: "Minimalist sophistication for the modern woman. Effortless luxury for daily wear.",
    image: "/3img.png",
    link: "/collections/everyday-elegance",
  },
];

const trustBadges = [
  { label: "Certified Gold" },
  { label: "Hallmarked" },
  { label: "Lifetime Exchange" },
];

export default function FeaturedCollectionSection() {
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={`${styles.header} ${isVisible ? styles.visible : ""}`}>
          <div className={styles.headerContent}>
            <p className={styles.eyebrow}>Featured Collection</p>
            <h2 className={styles.title}>
              Where <span className={styles.goldText}>Craftsmanship</span> Meets <span className={styles.goldText}>Elegance</span>
            </h2>
            <p className={styles.subtitle}>
              Discover our curated collection of high-end quality pieces
            </p>
            <div className={styles.headerLine} />
          </div>
        </div>

        {/* Main Layout */}
        <div className={`${styles.layout} ${isVisible ? styles.visible : ""}`}>
          {/* Main Feature Card */}
          <div className={styles.mainFeature}>
            <div className={styles.featureBadge}>
              <span className={styles.badgeDot} />
              SEASON HIGHLIGHT 2024
            </div>
            
            <h3 className={styles.featureHeading}>
              Jewellery That Transitions <br />
              <span className={styles.goldText}>From Ritual to Celebration</span>
            </h3>
            
            <p className={styles.featureDescription}>
              Discover pieces that honor tradition while embracing contemporary elegance. 
              From sacred ceremonies to festive celebrations, find your perfect companion 
              in our exclusive collection.
            </p>
            
            <a href="#collections" className={styles.primaryButton}>
              Explore Collection
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            
            <div className={styles.trustSection}>
              {trustBadges.map((badge, idx) => (
                <div key={badge.label} className={styles.trustItem}>
                  <div className={styles.goldDot} />
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Collections */}
          <div className={styles.collectionsGrid}>
            {featuredCollections.map((collection, idx) => (
              <div key={collection.title} className={styles.collectionItem}>
                <div className={styles.collectionImageContainer}>
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    className={styles.collectionImage}
                  />
                  <div className={styles.imageGradient} />
                </div>
                <div className={styles.collectionInfo}>
                  <h4 className={styles.collectionTitle}>{collection.title}</h4>
                  <p className={styles.collectionDescription}>{collection.text}</p>
                  <a href={collection.link} className={styles.secondaryButton}>
                    Explore Collection
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
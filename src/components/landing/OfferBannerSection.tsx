"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./css/OfferBannerSection.module.css";

const bannerImages = [
  { id: 1, src: "/add/add1.png", alt: "Luxury jewellery offer banner 1" },
  { id: 2, src: "/add/add2.png", alt: "Luxury jewellery offer banner 2" },
  { id: 3, src: "/add/add3.png", alt: "Luxury jewellery offer banner 3" },
  { id: 4, src: "/add/add4.png", alt: "Luxury jewellery offer banner 4" },
  { id: 5, src: "/add/add5.png", alt: "Luxury jewellery offer banner 5" },
  { id: 6, src: "/add/add6.png", alt: "Luxury jewellery offer banner 6" },
];

// Set target date for the offer (5 days, 12 hours, 45 minutes from now)
const getTargetDate = () => {
  if (typeof window !== 'undefined') {
    const savedDate = localStorage.getItem('offerTargetDate');
    if (savedDate) {
      return new Date(savedDate);
    }
  }
  const target = new Date();
  target.setDate(target.getDate() + 5);
  target.setHours(target.getHours() + 12);
  target.setMinutes(target.getMinutes() + 45);
  target.setSeconds(0);
  return target;
};

export default function OfferBannerSection() {
  const [currentImage, setCurrentImage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 12,
    minutes: 45,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = getTargetDate();
    
    if (typeof window !== 'undefined' && !localStorage.getItem('offerTargetDate')) {
      localStorage.setItem('offerTargetDate', targetDate.toISOString());
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentImage((prev) => (prev + 1) % bannerImages.length);
        setIsAnimating(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.bannerWrapper}>
          {/* Background Image */}
          <div className={styles.imageContainer}>
            {bannerImages.map((image, index) => (
              <div
                key={image.id}
                className={`${styles.bannerImage} 
                  ${index === currentImage ? styles.active : styles.inactive}
                  ${isAnimating && index === currentImage ? styles.animating : ''}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className={styles.image}
                  priority={index === 0}
                />
                <div className={styles.overlay} />
              </div>
            ))}
          </div>

          {/* Limited Time Offer Badge - Top Left */}
          

          {/* Timer - Bottom Left */}
          <div className={styles.timerContainer}>
            <div className={styles.timerWrapper}>
              <div className={styles.timerUnit}>
                <span className={styles.timerNumber}>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className={styles.timerLabel}>Days</span>
              </div>
              <span className={styles.timerSeparator}>:</span>
              <div className={styles.timerUnit}>
                <span className={styles.timerNumber}>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className={styles.timerLabel}>Hours</span>
              </div>
              <span className={styles.timerSeparator}>:</span>
              <div className={styles.timerUnit}>
                <span className={styles.timerNumber}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className={styles.timerLabel}>Mins</span>
              </div>
              <span className={styles.timerSeparator}>:</span>
              <div className={styles.timerUnit}>
                <span className={styles.timerNumber}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className={styles.timerLabel}>Secs</span>
              </div>
            </div>
          </div>

          {/* Reserve Button - Bottom Right */}
          <a href="#contact" className={styles.reserveButton}>
            Reserve the Offer
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>

          {/* Navigation Dots - Bottom Center */}
          <div className={styles.dotsContainer}>
            {bannerImages.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentImage ? styles.activeDot : ''}`}
                onClick={() => {
                  setIsAnimating(true);
                  setTimeout(() => {
                    setCurrentImage(index);
                    setIsAnimating(false);
                  }, 300);
                }}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
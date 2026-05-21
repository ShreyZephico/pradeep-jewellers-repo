"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";

import data from "@/data/contactDatas.json";

import "./css/gifting.css";

function GiftRibbonOverlay() {
  return (
    <div className="gifting-section__ribbon" aria-hidden>
      <span className="gifting-section__ribbon-v" />
      <span className="gifting-section__ribbon-h" />
    </div>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 8v13" />
      <path d="M3 10h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
      <path d="M3 10V9a2 2 0 0 1 2-2h4c1.5 0 3 1 3 3s1.5-3 3-3h4a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function GiftingSection() {
  const s = data.giftingSection;
  const slides = s.featuredSlides;
  const [activeBudget, setActiveBudget] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);

  const slide = slides[slideIndex] ?? slides[0];
  const slideCount = slides.length;

  const nextSlide = () =>
    setSlideIndex((i) => (slideCount ? (i + 1) % slideCount : 0));
  const prevSlide = () =>
    setSlideIndex((i) =>
      slideCount ? (i - 1 + slideCount) % slideCount : 0
    );

  return (
    <section className="gifting-section" aria-labelledby="gifting-section-heading">
      <div className="gifting-section__inner">
        <div className="gifting-section__layout">
          <div className="gifting-section__main">
            <header className="gifting-section__header">
              <div className="gifting-section__header-text">
                <div className="gifting-section__badge-row">
                  <span className="gifting-section__badge-line" aria-hidden />
                  <p className="gifting-section__badge">{s.badge}</p>
                </div>
                <h2
                  id="gifting-section-heading"
                  className="gifting-section__title"
                >
                  {s.title}
                </h2>
                <p className="gifting-section__subheading">{s.subheading}</p>
              </div>
              <Link
                href={s.personalStylistLink.href}
                className="gifting-section__stylist-link"
              >
                {s.personalStylistLink.label}{" "}
                <span aria-hidden>↗</span>
              </Link>
            </header>

            <div className="gifting-section__cards">
              {s.budgetCards.map((card, index) => {
                const isActive = index === activeBudget;
                return (
                  <div
                    key={card.id}
                    role="button"
                    tabIndex={0}
                    suppressHydrationWarning
                    aria-pressed={isActive}
                    style={
                      { "--card-index": index } as CSSProperties
                    }
                    onClick={() => setActiveBudget(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveBudget(index);
                      }
                    }}
                    className={`gifting-section__card${
                      isActive ? " gifting-section__card--active" : ""
                    }`}
                  >
                    <div className="gifting-section__card-top">
                      <span className="gifting-section__card-id">
                        {card.id}
                      </span>
                      <span className="gifting-section__card-icon-wrap">
                        <GiftIcon />
                      </span>
                    </div>
                    <div className="gifting-section__card-media">
                      <Image
                        src={card.image}
                        alt=""
                        fill
                        className="gifting-section__card-image"
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
                      />
                      <GiftRibbonOverlay />
                    </div>
                    <p className="gifting-section__card-label">{card.label}</p>
                    <p className="gifting-section__card-price">
                      {card.priceDisplay}
                    </p>
                    <p className="gifting-section__card-desc">
                      {card.description}
                    </p>
                    <Link
                      href={card.exploreHref}
                      onClick={(e) => e.stopPropagation()}
                      className="gifting-section__card-explore"
                    >
                      EXPLORE <span aria-hidden>↗</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="gifting-section__occasions">
              <p className="gifting-section__occasions-label">
                {s.occasionLabel}
              </p>
              <div className="gifting-section__occasions-list">
                {s.occasions.map((occ) => (
                  <Link
                    key={occ.label}
                    href={occ.href}
                    className="gifting-section__occasion-tag"
                  >
                    {occ.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="gifting-section__feature">
            <div className="gifting-section__feature-inner">
              <Image
                key={slide.image}
                src={slide.image}
                alt=""
                fill
                className="gifting-section__feature-image"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div
                className="gifting-section__feature-overlay"
                aria-hidden
              />

              <div className="gifting-section__feature-content">
                <p className="gifting-section__feature-eyebrow-gold">
                  {slide.eyebrowGold}
                </p>
                <p className="gifting-section__feature-eyebrow-white">
                  {slide.eyebrowWhite}
                </p>
                <h3 className="gifting-section__feature-title">
                  {slide.headline}
                </h3>
                <p className="gifting-section__feature-desc">
                  {slide.description}
                </p>
                <div className="gifting-section__feature-actions">
                  <Link
                    href={slide.primaryCta.href}
                    className="gifting-section__feature-cta gifting-section__feature-cta--primary"
                  >
                    {slide.primaryCta.text}
                  </Link>
                  <Link
                    href={slide.secondaryCta.href}
                    className="gifting-section__feature-cta gifting-section__feature-cta--secondary"
                  >
                    <ChatIcon />
                    {slide.secondaryCta.text}
                  </Link>
                </div>
              </div>

              {slideCount > 1 ? (
                <div className="gifting-section__feature-nav">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={prevSlide}
                    aria-label="Previous feature"
                    className="gifting-section__feature-nav-btn"
                  >
                    <span aria-hidden>←</span>
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={nextSlide}
                    aria-label="Next feature"
                    className="gifting-section__feature-nav-btn"
                  >
                    <span aria-hidden>→</span>
                  </button>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

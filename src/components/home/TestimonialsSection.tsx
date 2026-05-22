"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import data from "@/data/contactDatas.json";

import "./css/testimonials.css";

function StarRow({ count }: { count: number }) {
  return (
    <div className="testimonials-section__stars" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="testimonials-section__star"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.9 1.18 6.88L12 17.77l-6.18 3.28L7 14.17 2 9.27l7.1-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const s = data.testimonialsSection;
  const r = s.rating;
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const initialCount = s.initialVisibleCount ?? 3;
  const hasMore = s.items.length > initialCount;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reveal = () => setVisible(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal();
    }

    return () => observer.disconnect();
  }, []);

  const displayedItems = useMemo(
    () => (expanded ? s.items : s.items.slice(0, initialCount)),
    [expanded, initialCount, s.items]
  );

  const sectionClass = `testimonials-section${
    visible ? " testimonials-section--visible" : ""
  }`;

  const gridClass = `testimonials-section__grid${
    expanded ? " testimonials-section__grid--expanded" : ""
  }`;

  return (
    <section
      ref={sectionRef}
      className={sectionClass}
      aria-labelledby="testimonials-section-heading"
    >
      <div className="testimonials-section__inner">
        <header className="testimonials-section__header">
          <div className="testimonials-section__intro">
            <div className="testimonials-section__badge-row">
              <span className="testimonials-section__badge-line" aria-hidden />
              <p className="testimonials-section__badge">{s.badge}</p>
            </div>
            <h2
              id="testimonials-section-heading"
              className="testimonials-section__title"
            >
              {s.title}
            </h2>
          </div>

          <div className="testimonials-section__rating-card">
            <StarRow count={r.starCount} />
            <div>
              <p className="testimonials-section__rating-score">
                {r.score}{" "}
                <span className="testimonials-section__rating-out-of">
                  / {r.outOf}
                </span>
              </p>
              <p className="testimonials-section__rating-label">
                {r.reviewsLabel}
              </p>
            </div>
          </div>
        </header>

        <div className={gridClass}>
          {displayedItems.map((item, index) => (
            <article
              key={item.author}
              className="testimonials-section__card"
              style={{ "--card-index": index } as CSSProperties}
            >
              <span className="testimonials-section__quote-mark" aria-hidden>
                &ldquo;
              </span>
              <blockquote className="testimonials-section__quote">
                {item.quote}
              </blockquote>

              <hr className="testimonials-section__divider" />

              <div className="testimonials-section__author-row">
                <div className="testimonials-section__avatar">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    className="testimonials-section__avatar-image"
                    sizes="48px"
                  />
                </div>
                <div className="testimonials-section__author-meta">
                  <p className="testimonials-section__author-name">
                    {item.author}
                  </p>
                  <p className="testimonials-section__author-tags">
                    {item.tags.join(" · ")}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {hasMore ? (
          <div
            className="testimonials-section__actions"
            suppressHydrationWarning
          >
            <button
              type="button"
              className="testimonials-section__toggle"
              aria-expanded={expanded}
              suppressHydrationWarning
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? s.viewLessLabel : s.viewMoreLabel}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import data from "@/data/contactDatas.json";

import "./css/founder.css";

export default function FounderSection() {
  const s = data.founderSection;
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

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
      { threshold: 0.15, rootMargin: "0px 0px -48px 0px" }
    );

    observer.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal();
    }

    return () => observer.disconnect();
  }, []);

  const sectionClass = `founder-section${
    visible ? " founder-section--visible" : ""
  }`;

  return (
    <section
      ref={sectionRef}
      className={sectionClass}
      aria-labelledby="founder-section-heading"
    >
      <div className="founder-section__inner">
        <div className="founder-section__layout">
          <div className="founder-section__media-card">
            <div className="founder-section__media-frame">
              <Image
                src={s.image}
                alt={s.imageAlt}
                fill
                className="founder-section__image"
                sizes="(max-width: 1024px) 360px, 416px"
                priority={false}
              />
              <aside className="founder-section__year-badge">
                <p className="founder-section__year">{s.establishedYear}</p>
                <p className="founder-section__year-label">
                  {s.establishedText}
                </p>
              </aside>
            </div>
          </div>

          <div className="founder-section__content-card">
            <div className="founder-section__label-row">
              <span className="founder-section__label-line" aria-hidden />
              <p className="founder-section__label">{s.sectionLabel}</p>
            </div>

            <h2
              id="founder-section-heading"
              className="founder-section__heading"
            >
              {s.heading}
            </h2>

            <div className="founder-section__quote-block">
              <span className="founder-section__quote-mark" aria-hidden>
                &ldquo;
              </span>
              <blockquote className="founder-section__blockquote">
                <p className="founder-section__quote">{s.quote}</p>
              </blockquote>
            </div>

            <p className="founder-section__description">{s.description}</p>

            <Link href={s.linkHref} className="founder-section__link">
              {s.linkText}
              <span className="founder-section__link-arrow" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

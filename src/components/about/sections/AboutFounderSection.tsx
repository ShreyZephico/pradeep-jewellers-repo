/** Founder block for /about — enable from AboutPage.tsx when ready. */
import Image from "next/image";

import aboutData from "@/data/about.json";
import "../css/founder.css";

export default function AboutFounderSection() {
  const s = aboutData.founder;

  return (
    <section
      id={s.id}
      className="about-founder"
      aria-labelledby="about-founder-title"
    >
      <div className="about-page__container">
        <div className="about-founder__grid">
          <div className="about-founder__media" data-reveal>
            <div className="about-media-frame about-media-frame--portrait">
              <Image
                src={s.image}
                alt={s.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 26rem"
                className="about-media-img about-media-img--sepia"
                unoptimized={s.image.endsWith(".svg")}
              />
              <aside className="about-founder__year">
                <p className="about-founder__year-num">{s.establishedYear}</p>
                <p className="about-founder__year-label">{s.establishedText}</p>
              </aside>
            </div>
          </div>
          <div className="about-founder__content" data-reveal data-stagger="2">
            <div className="about-label-row">
              <span className="about-label-line" aria-hidden />
              <p className="about-eyebrow about-eyebrow--flush">{s.sectionLabel}</p>
            </div>
            <h2 id="about-founder-title" className="about-heading">
              {s.heading}
            </h2>
            <blockquote className="about-founder__quote">
              <span className="about-founder__quote-mark" aria-hidden>
                &ldquo;
              </span>
              <p>{s.quote}</p>
            </blockquote>
            <p className="about-body">{s.description}</p>
            <p className="about-founder__meta">
              <strong>{s.name}</strong>
              <span>{s.role}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

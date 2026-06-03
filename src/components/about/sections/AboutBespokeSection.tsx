import Image from "next/image";
import Link from "next/link";

import aboutData from "@/data/about.json";
import "../css/bespoke.css";

export default function AboutBespokeSection() {
  const s = aboutData.bespoke;

  return (
    <section className="about-bespoke" aria-labelledby="about-bespoke-title">
      <div className="about-page__container">
        <div className="about-split">
          <div className="about-split__content" data-reveal>
            <p className="about-eyebrow">{s.badge}</p>
            <h2 id="about-bespoke-title" className="about-heading">
              {s.title}
            </h2>
            <p className="about-lead">{s.description}</p>
            <ul className="about-bespoke__features">
              {s.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="about-bespoke__actions">
              <Link href={s.ctaHref} className="about-btn about-btn--primary">
                {s.ctaLabel}
              </Link>
              {s.secondaryCtaHref ? (
                <Link
                  href={s.secondaryCtaHref}
                  className="about-btn about-btn--outline"
                >
                  {s.secondaryCtaLabel}
                </Link>
              ) : null}
            </div>
          </div>
          <div className="about-split__media" data-reveal data-stagger="2">
            <div className="about-media-frame">
              <Image
                src={s.image}
                alt={s.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="about-media-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";

import guide from "@/data/diamondGuide.json";

import "@/styles/diamond-guide.css";

function DiamondColourIcon({ tint }: { tint: string }) {
  return (
    <span
      className={`diamond-guide-colour-gem diamond-guide-colour-gem--${tint}`}
      aria-hidden
    >
      <span className="diamond-guide-colour-gem-inner" />
    </span>
  );
}

function DiamondClarityIcon({ inclusions }: { inclusions: number }) {
  return (
    <span className="diamond-guide-clarity-gem" aria-hidden>
      <svg viewBox="0 0 64 64" className="diamond-guide-clarity-svg">
        <polygon
          points="32,4 58,32 32,60 6,32"
          className="diamond-guide-clarity-outline"
        />
        {Array.from({ length: inclusions }).map((_, i) => {
          const angle = (i / Math.max(inclusions, 1)) * Math.PI * 2;
          const cx = 32 + Math.cos(angle) * (8 + (i % 3) * 4);
          const cy = 32 + Math.sin(angle) * (6 + (i % 2) * 5);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={inclusions >= 5 ? 2.2 : 1.6}
              className="diamond-guide-clarity-inclusion"
            />
          );
        })}
      </svg>
    </span>
  );
}

function GuideHint({ label, text }: { label: string; text: string }) {
  return (
    <aside className="diamond-guide-hint">
      <p className="diamond-guide-hint-label">{label}</p>
      <p className="diamond-guide-hint-text">{text}</p>
    </aside>
  );
}

export default function DiamondGuidePage() {
  const { hero, colour, clarity, cta } = guide;

  return (
    <article className="diamond-guide">
      <div className="diamond-guide-bg" aria-hidden />

      <div className="diamond-guide-container">
        <p className="diamond-guide-page-kicker">{hero.pageTitle}</p>

        <header className="diamond-guide-hero">
          <div className="diamond-guide-hero-copy">
            <p className="diamond-guide-eyebrow">{hero.eyebrow}</p>
            <h1 className="diamond-guide-title">{hero.title}</h1>
            <p className="diamond-guide-intro">{hero.intro}</p>
          </div>

          <div className="diamond-guide-hero-media">
            <Image
              src={hero.image}
              alt={hero.imageAlt}
              width={520}
              height={420}
              className="diamond-guide-hero-img"
              priority
            />
          </div>
        </header>

        <section className="diamond-guide-section" aria-labelledby="diamond-colour-heading">
          <div className="diamond-guide-section-head">
            <span className="diamond-guide-section-num">{colour.number}</span>
            <h2 id="diamond-colour-heading" className="diamond-guide-section-title">
              {colour.title}
            </h2>
          </div>

          <p className="diamond-guide-section-desc">{colour.description}</p>

          <GuideHint label={colour.hintLabel} text={colour.hint} />

          <div className="diamond-guide-colour-scale diamond-guide-colour-scale--letters">
            {colour.grades.map((grade) => (
              <div key={grade.id} className="diamond-guide-scale-item">
                <DiamondColourIcon tint={grade.tint} />
                <p className="diamond-guide-scale-label">{grade.label}</p>
                {grade.name ? (
                  <p className="diamond-guide-scale-name">{grade.name}</p>
                ) : (
                  <p
                    className="diamond-guide-scale-name diamond-guide-scale-name--empty"
                    aria-hidden
                  >
                    &nbsp;
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="diamond-guide-section" aria-labelledby="diamond-clarity-heading">
          <div className="diamond-guide-section-head">
            <span className="diamond-guide-section-num">{clarity.number}</span>
            <h2 id="diamond-clarity-heading" className="diamond-guide-section-title">
              {clarity.title}
            </h2>
          </div>

          <p className="diamond-guide-section-desc">{clarity.description}</p>

          <GuideHint label={clarity.hintLabel} text={clarity.hint} />

          <div className="diamond-guide-clarity-scale">
            {clarity.grades.map((grade) => (
              <div key={grade.id} className="diamond-guide-scale-item">
                <DiamondClarityIcon inclusions={grade.inclusions} />
                <p className="diamond-guide-scale-label">{grade.code}</p>
                <p className="diamond-guide-scale-name">{grade.name}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="diamond-guide-cta">
          <p>{cta.text}</p>
          <Link href={cta.shopHref} className="diamond-guide-cta-btn">
            {cta.shopLink}
          </Link>
        </footer>
      </div>
    </article>
  );
}

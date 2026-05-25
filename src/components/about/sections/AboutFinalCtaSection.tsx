import Link from "next/link";

import aboutData from "@/data/about.json";
import "../css/final-cta.css";

export default function AboutFinalCtaSection() {
  const s = aboutData.finalCta;

  return (
    <section className="about-final-cta" aria-labelledby="about-final-cta-title">
      <div className="about-page__container">
        <div className="about-final-cta__inner" data-reveal>
          <h2 id="about-final-cta-title" className="about-final-cta__title">
            {s.title}
          </h2>
          <p className="about-final-cta__desc">{s.description}</p>
          <div className="about-final-cta__actions">
            {s.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.variant === "primary"
                    ? "about-btn about-btn--primary about-btn--on-dark"
                    : "about-btn about-btn--outline about-btn--on-dark"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

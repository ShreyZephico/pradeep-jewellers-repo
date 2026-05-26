import Image from "next/image";

import aboutData from "@/data/about.json";
import "../css/brand-intro.css";

export default function AboutBrandIntroSection() {
  const s = aboutData.brandIntro;

  return (
    <section className="about-brand" aria-labelledby="about-brand-title">
      <div className="about-page__container">
        <div className="about-brand__grid">
          <div className="about-brand__content" data-reveal>
            <p className="about-eyebrow">{s.badge}</p>
            <h2 id="about-brand-title" className="about-heading">
              {s.title}
            </h2>
            <p className="about-lead">{s.description}</p>
            <ul className="about-brand__points">
              {s.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="about-brand__media" data-reveal data-stagger="2">
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

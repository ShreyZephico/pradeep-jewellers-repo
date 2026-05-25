import Image from "next/image";

import aboutData from "@/data/about.json";
import "../css/craftsmanship.css";

export default function AboutCraftsmanshipSection() {
  const s = aboutData.craftsmanship;

  return (
    <section className="about-craft" aria-labelledby="about-craft-title">
      <div className="about-page__container">
        <div className="about-split about-split--reverse">
          <div className="about-split__content" data-reveal>
            <p className="about-eyebrow">{s.badge}</p>
            <h2 id="about-craft-title" className="about-heading">
              {s.title}
            </h2>
            <p className="about-lead">{s.description}</p>
            <ol className="about-craft__steps">
              {s.steps.map((step) => (
                <li key={step.step} className="about-craft__step">
                  <span className="about-craft__num">{step.step}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
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

import Image from "next/image";

import aboutData from "@/data/about.json";
import "../css/our-story.css";

export default function AboutOurStorySection() {
  const s = aboutData.ourStory;

  return (
    <section className="about-story about-page__section--cream" aria-labelledby="about-story-title">
      <div className="about-page__container">
        <div className="about-split">
          <div className="about-split__content" data-reveal>
            <p className="about-eyebrow">{s.badge}</p>
            <h2 id="about-story-title" className="about-heading">
              {s.title}
            </h2>
            {s.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="about-body">
                {p}
              </p>
            ))}
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

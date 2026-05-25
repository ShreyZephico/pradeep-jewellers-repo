import aboutData from "@/data/about.json";

import "../css/heritage-timeline.css";

export default function AboutHeritageTimelineSection() {
  const s = aboutData.heritageTimeline;

  return (
    <section className="about-heritage" aria-labelledby="about-heritage-title">
      <div className="about-page__container">
        <div className="about-section-head" data-reveal>
          <p className="about-eyebrow">{s.badge}</p>
          <h2 id="about-heritage-title" className="about-heading">
            {s.title}
          </h2>
          <p className="about-lead">{s.description}</p>
        </div>
        <ol className="about-heritage__timeline">
          {s.items.map((item, i) => (
            <li
              key={item.year + item.title}
              className="about-heritage__item"
              data-reveal
              data-stagger={String(Math.min(i + 1, 5))}
            >
              <span className="about-heritage__year">{item.year}</span>
              <div>
                <h3 className="about-heritage__item-title">{item.title}</h3>
                <p className="about-heritage__item-text">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

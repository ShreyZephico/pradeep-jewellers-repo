import aboutData from "@/data/about.json";

import "../css/brand-stats.css";

export default function AboutBrandStatsSection() {
  const s = aboutData.brandStats;

  return (
    <section className="about-stats about-page__section--cream" aria-labelledby="about-stats-title">
      <div className="about-page__container">
        <div className="about-section-head about-section-head--center" data-reveal>
          <p className="about-eyebrow">{s.badge}</p>
          <h2 id="about-stats-title" className="about-heading">
            {s.title}
          </h2>
        </div>
        <ul className="about-stats__grid">
          {s.stats.map((stat, i) => (
            <li
              key={stat.label}
              className="about-stats__card"
              data-reveal
              data-stagger={String(Math.min(i + 1, 5))}
            >
              <p className="about-stats__value">
                {stat.number >= 1000
                  ? stat.number.toLocaleString("en-IN")
                  : stat.number}
                {stat.suffix}
              </p>
              <p className="about-stats__label">{stat.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

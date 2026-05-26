import aboutData from "@/data/about.json";

import "../css/why-choose.css";

function CardIcon({ icon }: { icon: string }) {
  if (icon === "scale") {
    return (
      <span className="about-icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v18M5 8h14M7 12h10" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (icon === "shield") {
    return (
      <span className="about-icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="about-icon" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          d="M12 20.5s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function AboutWhyChooseSection() {
  const s = aboutData.whyChoose;

  return (
    <section className="about-why" aria-labelledby="about-why-title">
      <div className="about-page__container">
        <div className="about-section-head" data-reveal>
          <p className="about-eyebrow">{s.badge}</p>
          <h2 id="about-why-title" className="about-heading">
            {s.title}
          </h2>
        </div>
        <ul className="about-why__grid">
          {s.items.map((item, i) => (
            <li
              key={item.title}
              className="about-why__card"
              data-reveal
              data-stagger={String(Math.min(i + 1, 5))}
            >
              <CardIcon icon={item.icon} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

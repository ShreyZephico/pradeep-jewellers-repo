import aboutData from "@/data/about.json";

import "../css/certifications.css";

function CertIcon({ icon }: { icon: string }) {
  if (icon === "hallmark") {
    return (
      <span className="about-icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (icon === "document") {
    return (
      <span className="about-icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 4h8l4 4v12H8V4z" strokeLinejoin="round" />
          <path d="M16 4v4h4M10 12h6M10 16h4" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="about-icon" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l8 7-8 13L4 9l8-7z" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function AboutCertificationsSection() {
  const s = aboutData.certifications;

  return (
    <section className="about-certs about-page__section--cream" aria-labelledby="about-certs-title">
      <div className="about-page__container">
        <div className="about-section-head" data-reveal>
          <p className="about-eyebrow">{s.badge}</p>
          <h2 id="about-certs-title" className="about-heading">
            {s.title}
          </h2>
          <p className="about-lead">{s.description}</p>
        </div>
        <ul className="about-certs__grid">
          {s.items.map((item, i) => (
            <li
              key={item.title}
              className="about-certs__card"
              data-reveal
              data-stagger={String(Math.min(i + 1, 5))}
            >
              <CertIcon icon={item.icon} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
        <p className="about-certs__compliance" data-reveal>
          {s.complianceLine}
        </p>
      </div>
    </section>
  );
}

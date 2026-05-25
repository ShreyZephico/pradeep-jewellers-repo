import Image from "next/image";

import aboutData from "@/data/about.json";

import "../css/team.css";

export default function AboutTeamSection() {
  const s = aboutData.team;

  return (
    <section className="about-team about-page__section--cream" aria-labelledby="about-team-title">
      <div className="about-page__container">
        <div className="about-section-head" data-reveal>
          <p className="about-eyebrow">{s.badge}</p>
          <h2 id="about-team-title" className="about-heading">
            {s.title}
          </h2>
          <p className="about-lead">{s.description}</p>
        </div>
        <ul className="about-team__grid">
          {s.members.map((member, i) => (
            <li
              key={member.name}
              className="about-team__card"
              data-reveal
              data-stagger={String(Math.min(i + 1, 5))}
            >
              <div className="about-team__photo">
                <Image
                  src={member.image}
                  alt={member.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="about-media-img"
                />
              </div>
              <h3 className="about-team__name">{member.name}</h3>
              <p className="about-team__role">{member.role}</p>
              <p className="about-team__exp">{member.experience}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

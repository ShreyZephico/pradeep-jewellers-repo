import Image from "next/image";
import Link from "next/link";

import aboutData from "@/data/about.json";
import "../css/showroom.css";

export default function AboutShowroomSection() {
  const s = aboutData.showroom;

  return (
    <section className="about-showroom about-page__section--cream" aria-labelledby="about-showroom-title">
      <div className="about-page__container">
        <div className="about-split about-split--reverse">
          <div className="about-split__content" data-reveal>
            <p className="about-eyebrow">{s.badge}</p>
            <h2 id="about-showroom-title" className="about-heading">
              {s.title}
            </h2>
            <p className="about-lead">{s.description}</p>
            <ul className="about-showroom__highlights">
              {s.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <address className="about-showroom__address">
              <p>{s.address}</p>
              <p>
                <a href={s.phoneHref}>{s.phone}</a>
              </p>
              <p>
                <a
                  href={s.whatsappHref}
                  className="about-showroom__whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.whatsappLabel}
                </a>
              </p>
              <p className="about-showroom__hours">{s.hours}</p>
            </address>
            <div className="about-showroom__links">
              <a
                href={s.mapHref}
                className="about-showroom__map"
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.mapLabel}
                <span aria-hidden> →</span>
              </a>
              <Link href="/scheme" className="about-showroom__scheme">
                Suvarna Vriddhi Yojna
                <span aria-hidden> →</span>
              </Link>
            </div>
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

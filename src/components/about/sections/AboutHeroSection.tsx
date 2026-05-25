import Image from "next/image";
import Link from "next/link";

import aboutData from "@/data/about.json";

import "../css/hero.css";

export default function AboutHeroSection() {
  const s = aboutData.hero;
  const hi = s.highlightText;
  const idx = s.title.indexOf(hi);

  return (
    <header className="about-hero">
      <div className="about-hero__media" aria-hidden>
        <Image
          src={s.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="about-hero__img"
        />
      </div>
      <div className="about-hero__overlay" aria-hidden />
      <div className="about-page__container about-hero__inner">
        <nav className="about-hero__breadcrumb" data-reveal>
          <Link href={s.backHref}>{s.backLabel}</Link>
        </nav>
        <p className="about-hero__badge" data-reveal data-stagger="1">
          {s.badge}
        </p>
        <h1 className="about-hero__title" data-reveal data-stagger="2">
          {idx === -1 ? (
            s.title
          ) : (
            <>
              {s.title.slice(0, idx)}
              <span className="about-highlight">{hi}</span>
              {s.title.slice(idx + hi.length)}
            </>
          )}
        </h1>
        <p className="about-hero__desc" data-reveal data-stagger="3">
          {s.description}
        </p>
      </div>
    </header>
  );
}

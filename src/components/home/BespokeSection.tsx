import Image from "next/image";
import Link from "next/link";

import data from "@/data/contactDatas.json";

import "./css/bespoke.css";

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10 8.5v7l5.5-3.5L10 8.5Z" fill="currentColor" />
    </svg>
  );
}

export default function BespokeSection() {
  const s = data.bespokeSection;

  return (
    <section className="bespoke-section" aria-labelledby="bespoke-section-heading">
      <div className="bespoke-section__backdrop">
        <Image
          src={s.backgroundImage}
          alt=""
          fill
          priority={false}
          sizes="100vw"
          className="bespoke-section__image"
        />
        <div
          className="bespoke-section__overlay bespoke-section__overlay--dim"
          aria-hidden
        />
        <div
          className="bespoke-section__overlay bespoke-section__overlay--gradient"
          aria-hidden
        />
      </div>

      <div className="bespoke-section__inner">
        <div className="bespoke-section__badge-row">
          <span className="bespoke-section__badge-line" aria-hidden />
          <p className="bespoke-section__subtitle">{s.subtitle}</p>
          <span className="bespoke-section__badge-line" aria-hidden />
        </div>

        <h2 id="bespoke-section-heading" className="bespoke-section__title">
          {s.titleLine1}
          <br />
          <span className="bespoke-section__title-accent">{s.titleLine2}</span>
        </h2>

        <p className="bespoke-section__description">{s.description}</p>

        <div className="bespoke-section__actions">
          <Link
            href={s.ctaPrimary.link}
            className="bespoke-section__cta bespoke-section__cta--primary"
          >
            {s.ctaPrimary.text}
            <span className="bespoke-section__cta-arrow" aria-hidden>
              →
            </span>
          </Link>

          <a
            href={s.ctaSecondary.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bespoke-section__cta bespoke-section__cta--secondary"
          >
            <ChatIcon className="bespoke-section__cta-icon" />
            {s.ctaSecondary.text}
          </a>

          <Link
            href={s.ctaTertiary.link}
            className="bespoke-section__cta bespoke-section__cta--tertiary"
          >
            <span className="bespoke-section__cta-play" aria-hidden>
              <PlayIcon className="bespoke-section__cta-icon" />
            </span>
            {s.ctaTertiary.text}
          </Link>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { CSSProperties } from "react";

import data from "@/data/contactDatas.json";

import "./css/learn.css";

function ArticleIcon({ name }: { name: string }) {
  const wrapClass = "learn-section__icon-wrap";
  const svgClass = "learn-section__icon-svg";

  switch (name) {
    case "gem":
      return (
        <div className={wrapClass} aria-hidden>
          <svg className={svgClass} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l2.5 4h5L12 22 4.5 6h5L12 2Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M6 6h12M9.5 6 12 2l2.5 4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    case "diamond":
      return (
        <div className={wrapClass} aria-hidden>
          <svg className={svgClass} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3 4 9l8 12 8-12-8-6Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M8 9h8M12 3v18"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      );
    case "ruler":
      return (
        <div className={wrapClass} aria-hidden>
          <svg className={svgClass} viewBox="0 0 24 24" fill="none">
            <path
              d="M4 16 16 4l4 4-12 12-4-4Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M9 11h2M11 9v2M13 7h2M15 5v2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    case "sparkles":
      return (
        <div className={wrapClass} aria-hidden>
          <svg className={svgClass} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v3M12 18v3M3 12h3M18 12h3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          </svg>
        </div>
      );
    default:
      return <div className={wrapClass} aria-hidden />;
  }
}

export default function LearnSection() {
  const s = data.learnSection;

  return (
    <section className="learn-section" aria-labelledby="learn-section-heading">
      <div className="learn-section__inner">
        <header className="learn-section__header">
          <div className="learn-section__badge-row">
            <span className="learn-section__badge-line" aria-hidden />
            <p className="learn-section__badge">{s.badge}</p>
            <span className="learn-section__badge-line" aria-hidden />
          </div>
          <h2 id="learn-section-heading" className="learn-section__title">
            {s.title}
          </h2>
        </header>

        <div className="learn-section__grid">
          {s.articles.map((article, index) => (
            <Link
              key={article.href}
              href={article.href}
              className="learn-section__card"
              style={{ "--card-index": index } as CSSProperties}
            >
              <ArticleIcon name={article.icon} />
              <p className="learn-section__category">{article.category}</p>
              <h3 className="learn-section__card-title">{article.title}</h3>
              <p className="learn-section__summary">{article.summary}</p>
              <div className="learn-section__footer">
                <span className="learn-section__read-time">
                  {s.readPrefix} {article.readTime}
                </span>
                <span className="learn-section__cta">
                  <span>{s.learnMoreLabel}</span>
                  <span className="learn-section__cta-arrow" aria-hidden>
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

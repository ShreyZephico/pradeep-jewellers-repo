import Link from "next/link";
import type { CSSProperties } from "react";

import data from "@/data/contactDatas.json";
import LearnArticleIcon from "@/components/learn-page/LearnArticleIcon";

import "./css/learn.css";

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
              <LearnArticleIcon name={article.icon} />
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

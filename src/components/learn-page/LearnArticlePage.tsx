import Image from "next/image";
import Link from "next/link";

import LearnArticleIcon from "@/components/learn-page/LearnArticleIcon";
import {
  LEARN_SHARED,
  getRelatedArticles,
  type LearnArticle,
} from "@/components/learn-page/content";

import "./css/learn-page.css";

type Props = {
  article: LearnArticle;
};

export default function LearnArticlePage({ article }: Props) {
  const related = getRelatedArticles(article.slug);

  return (
    <article className="learn-page">
      <header className="learn-page__hero">
        <div className="learn-page__hero-media">
          <Image
            src={article.heroImage}
            alt={article.heroImageAlt}
            fill
            priority
            className="learn-page__hero-image"
            sizes="100vw"
          />
          <div className="learn-page__hero-overlay" aria-hidden />
        </div>

        <div className="learn-page__hero-content">
          <nav className="learn-page__breadcrumb" aria-label="Breadcrumb">
            <Link href={LEARN_SHARED.backHref}>{LEARN_SHARED.backLabel}</Link>
            <span aria-hidden>/</span>
            <Link href={LEARN_SHARED.hubHref}>{LEARN_SHARED.hubLabel}</Link>
          </nav>

          <div className="learn-page__hero-meta">
            <LearnArticleIcon name={article.icon} />
            <p className="learn-page__category">{article.category}</p>
          </div>

          <h1 className="learn-page__title">{article.title}</h1>
          <p className="learn-page__read-time">
            {LEARN_SHARED.readPrefix} {article.readTime}
          </p>
        </div>
      </header>

      <div className="learn-page__body">
        <div className="learn-page__content">
          <p className="learn-page__intro">{article.intro}</p>

          {article.sections.map((section) => (
            <section key={section.heading} className="learn-page__section">
              <h2 className="learn-page__section-title">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="learn-page__paragraph">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <aside className="learn-page__takeaways">
            <h2 className="learn-page__takeaways-title">
              {LEARN_SHARED.takeawaysTitle}
            </h2>
            <ul className="learn-page__takeaways-list">
              {article.takeaways.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>

          <div className="learn-page__cta-row">
            <Link href={LEARN_SHARED.cta.href} className="learn-page__cta-primary">
              {LEARN_SHARED.cta.text}
            </Link>
            <Link href={LEARN_SHARED.hubHref} className="learn-page__cta-secondary">
              {LEARN_SHARED.hubLabel}
            </Link>
          </div>
        </div>

        <aside className="learn-page__sidebar" aria-labelledby="learn-related-heading">
          <h2 id="learn-related-heading" className="learn-page__related-title">
            {LEARN_SHARED.relatedTitle}
          </h2>
          <ul className="learn-page__related-list">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={item.href} className="learn-page__related-card">
                  <LearnArticleIcon name={item.icon} />
                  <div>
                    <p className="learn-page__related-category">{item.category}</p>
                    <p className="learn-page__related-card-title">{item.title}</p>
                    <p className="learn-page__related-time">
                      {LEARN_SHARED.readPrefix} {item.readTime}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </article>
  );
}

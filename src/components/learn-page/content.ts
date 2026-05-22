import learnRaw from "@/data/learndata.json";
import contactRaw from "@/data/contactDatas.json";

const learnData = learnRaw as typeof learnRaw;

export type LearnArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type LearnArticle = {
  slug: string;
  href: string;
  icon: string;
  category: string;
  title: string;
  readTime: string;
  metaDescription: string;
  heroImage: string;
  heroImageAlt: string;
  intro: string;
  sections: LearnArticleSection[];
  takeaways: string[];
};

export const LEARN_SHARED = learnData.shared;

export const LEARN_ARTICLES: LearnArticle[] = learnData.articles;

export const LEARN_ARTICLE_SLUGS = LEARN_ARTICLES.map((a) => a.slug);

export function getLearnArticle(slug: string): LearnArticle | undefined {
  return LEARN_ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(slug: string, limit = 3): LearnArticle[] {
  return LEARN_ARTICLES.filter((a) => a.slug !== slug).slice(0, limit);
}

/** Home section cards — hrefs stay in sync with learndata. */
export const LEARN_HOME_CARDS = contactRaw.learnSection.articles;

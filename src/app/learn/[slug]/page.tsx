import type { Metadata } from "next";
import { notFound } from "next/navigation";

import LearnArticlePage from "@/components/learn-page/LearnArticlePage";
import {
  LEARN_ARTICLE_SLUGS,
  getLearnArticle,
} from "@/components/learn-page/content";

import "@/components/learn-page/css/learn-page.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return LEARN_ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearnArticle(slug);
  if (!article) {
    return { title: "Guide not found | Pradeep Jewellers" };
  }
  return {
    title: `${article.title} | Pradeep Jewellers`,
    description: article.metaDescription,
  };
}

export default async function LearnArticleRoute({ params }: PageProps) {
  const { slug } = await params;
  const article = getLearnArticle(slug);
  if (!article) notFound();

  return <LearnArticlePage article={article} />;
}

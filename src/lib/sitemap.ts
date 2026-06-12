import type { MetadataRoute } from "next";

import { LEARN_ARTICLE_SLUGS } from "@/components/learn-page/content";
import { fetchShopifyProductNodes } from "@/lib/shopify";
import { getSiteOrigin } from "@/lib/siteUrl";

type SitemapRoute = {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

/** Public marketing & content pages (no login, cart, or account routes). */
const STATIC_ROUTES: SitemapRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/bespoke", changeFrequency: "monthly", priority: 0.8 },
  { path: "/rates", changeFrequency: "daily", priority: 0.8 },
  { path: "/metal-prices", changeFrequency: "daily", priority: 0.7 },
  { path: "/diamond-guide", changeFrequency: "monthly", priority: 0.6 },
  { path: "/scheme", changeFrequency: "weekly", priority: 0.8 },
  { path: "/scheme/plans", changeFrequency: "weekly", priority: 0.75 },
  { path: "/scheme/enquiry", changeFrequency: "monthly", priority: 0.7 },
  { path: "/scheme/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/scheme/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/returns", changeFrequency: "yearly", priority: 0.4 },
];

function absoluteUrl(base: string, path: string): string {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function staticEntries(base: string, lastModified: Date): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(base, path),
    lastModified,
    changeFrequency,
    priority,
  }));
}

async function productEntries(base: string, lastModified: Date): Promise<MetadataRoute.Sitemap> {
  try {
    const nodes = await fetchShopifyProductNodes({ maxProducts: 500 });
    const handles = new Set<string>();

    return nodes
      .map((node) => node.handle?.trim())
      .filter((handle): handle is string => Boolean(handle))
      .filter((handle) => {
        if (handles.has(handle)) return false;
        handles.add(handle);
        return true;
      })
      .map((handle) => ({
        url: absoluteUrl(base, `/products/${encodeURIComponent(handle)}`),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch (error) {
    console.warn("Sitemap: could not load Shopify products:", error);
    return [];
  }
}

function learnEntries(base: string, lastModified: Date): MetadataRoute.Sitemap {
  return LEARN_ARTICLE_SLUGS.map((slug) => ({
    url: absoluteUrl(base, `/learn/${encodeURIComponent(slug)}`),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteOrigin();
  const lastModified = new Date();

  const [products] = await Promise.all([productEntries(base, lastModified)]);

  return [...staticEntries(base, lastModified), ...products, ...learnEntries(base, lastModified)];
}

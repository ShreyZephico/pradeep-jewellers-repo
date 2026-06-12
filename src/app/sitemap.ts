import type { MetadataRoute } from "next";

import { buildSitemapEntries } from "@/lib/sitemap";

/** Regenerate sitemap at most once per hour (product URLs stay reasonably fresh). */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries();
}

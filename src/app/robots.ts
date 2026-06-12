import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/cart",
        "/checkout/",
        "/login",
        "/signup",
        "/profile",
        "/orders",
        "/sentry-example-page",
      ],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}

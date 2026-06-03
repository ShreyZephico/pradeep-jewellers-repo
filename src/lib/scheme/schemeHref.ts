/** Prefix internal scheme-app paths for Next.js routes under /scheme. */
export function schemeHref(href: string): string {
  if (!href || /^https?:\/\//i.test(href) || href.startsWith("mailto:")) {
    return href;
  }
  if (href.startsWith("#")) return `/scheme${href}`;

  const hashIndex = href.indexOf("#");
  if (hashIndex !== -1) {
    const path = href.slice(0, hashIndex) || "/";
    const hash = href.slice(hashIndex);
    return `${schemeHref(path)}${hash}`;
  }

  if (href === "/") return "/scheme";
  if (href.startsWith("/scheme")) return href;
  return `/scheme${href}`;
}

export const SCHEME_ROUTES = {
  home: "/scheme",
  plans: "/scheme/plans",
  enquiry: "/scheme/enquiry",
  terms: "/scheme/terms",
  privacy: "/scheme/privacy",
  calculator: "/scheme#calculator",
} as const;

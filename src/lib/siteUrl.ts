/**
 * Public site origin for checkout return links, OAuth callbacks, and webhooks.
 */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}

export function getGoogleOAuthRedirectUri(): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit;
  }
  return `${getSiteOrigin()}/api/auth/google/callback`;
}

export function getShopifyWebhookEndpoint(): string {
  return `${getSiteOrigin()}/api/webhooks/shopify`;
}

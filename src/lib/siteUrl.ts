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

/** Normalize dev hosts so Google Console localhost entries match. */
function normalizeOAuthOrigin(origin: string): string {
  return origin.replace(/^http:\/\/127\.0\.0\.1(?=:\d+$)/i, "http://localhost");
}

/**
 * Google OAuth redirect URI for the current request.
 * Uses the browser origin (localhost, ngrok, production) so .env.local ngrok
 * values cannot break login on http://localhost:3000.
 */
export function getGoogleOAuthRedirectUriFromRequest(request: Request): string {
  const origin = normalizeOAuthOrigin(new URL(request.url).origin.replace(/\/+$/, ""));
  return `${origin}/api/auth/google/callback`;
}

/** @deprecated Prefer getGoogleOAuthRedirectUriFromRequest for OAuth routes. */
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

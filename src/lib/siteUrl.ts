function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function isLocalhostOrigin(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/**
 * Public site origin for checkout return links, OAuth callbacks, and webhooks.
 */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return stripTrailingSlash(fromEnv);
  }

  // Netlify sets URL / DEPLOY_PRIME_URL at runtime (preferred over SHOPIFY_APP_URL=localhost).
  const netlifyUrl =
    process.env.URL?.trim() || process.env.DEPLOY_PRIME_URL?.trim();
  if (netlifyUrl) {
    return stripTrailingSlash(netlifyUrl);
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${stripTrailingSlash(process.env.VERCEL_URL.trim())}`;
  }

  const shopifyAppUrl = process.env.SHOPIFY_APP_URL?.trim();
  if (shopifyAppUrl && !isLocalhostOrigin(shopifyAppUrl)) {
    return stripTrailingSlash(shopifyAppUrl);
  }

  if (shopifyAppUrl) {
    return stripTrailingSlash(shopifyAppUrl);
  }

  return "http://localhost:3000";
}

/** Shopify customer OAuth callback — uses live site origin on Netlify/Vercel. */
export function getShopifyOAuthRedirectUri(): string {
  const explicit = process.env.SHOPIFY_OAUTH_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit;
  }
  return `${getSiteOrigin()}/api/auth/shopify/callback`;
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

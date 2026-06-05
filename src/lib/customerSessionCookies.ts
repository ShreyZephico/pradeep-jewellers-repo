import type { NextResponse } from "next/server";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const CUSTOMER_SESSION_COOKIE_NAMES = [
  "customerAccessToken",
  "customerEmail",
  "customerPhone",
  "customerName",
  "loginMethod",
  "googleVerifiedEmail",
] as const;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function expiresDate(expiresAt?: string): Date {
  return expiresAt ? new Date(expiresAt) : new Date(Date.now() + WEEK_MS);
}

type SessionCookieOptions = {
  httpOnly?: boolean;
  expiresAt?: string;
};

function sessionCookieOptions({
  httpOnly = false,
  expiresAt,
}: SessionCookieOptions = {}) {
  return {
    httpOnly,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    expires: expiresDate(expiresAt),
  };
}

export type CustomerSessionPayload = {
  accessToken: string;
  expiresAt: string;
  email: string;
  loginMethod: string;
  name?: string | null;
  phone?: string | null;
};

/** Apply a full Shopify customer session to the response. */
export function applyCustomerSessionCookies(
  response: NextResponse,
  session: CustomerSessionPayload
): void {
  const tokenOpts = sessionCookieOptions({
    httpOnly: true,
    expiresAt: session.expiresAt,
  });
  const displayOpts = sessionCookieOptions({ expiresAt: session.expiresAt });

  response.cookies.set(
    "customerAccessToken",
    session.accessToken,
    tokenOpts
  );
  response.cookies.set("customerEmail", session.email, displayOpts);
  response.cookies.set("loginMethod", session.loginMethod, displayOpts);

  if (session.name?.trim()) {
    response.cookies.set("customerName", session.name.trim(), displayOpts);
  }
  if (session.phone?.trim()) {
    response.cookies.set("customerPhone", session.phone.trim(), displayOpts);
  }
}

/** Update only the httpOnly token (after renew or password change). */
export function applyCustomerAccessTokenCookie(
  response: NextResponse,
  accessToken: string,
  expiresAt: string
): void {
  response.cookies.set(
    "customerAccessToken",
    accessToken,
    sessionCookieOptions({ httpOnly: true, expiresAt })
  );
}

/** Remove all customer session cookies (logout / invalid session). */
export function clearCustomerSessionCookies(response: NextResponse): void {
  for (const name of CUSTOMER_SESSION_COOKIE_NAMES) {
    response.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      maxAge: 0,
      httpOnly: name === "customerAccessToken",
      secure: isProduction(),
      sameSite: "lax",
    });
  }
}

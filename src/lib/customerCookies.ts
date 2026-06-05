import type { NextResponse } from "next/server";

import {
  applyCustomerAccessTokenCookie,
  applyCustomerSessionCookies,
} from "@/lib/customerSessionCookies";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function expiresDate(expiresAt?: string): Date {
  return expiresAt ? new Date(expiresAt) : new Date(Date.now() + WEEK_MS);
}

function displayCookieOptions(expiresAt?: string) {
  return {
    httpOnly: false as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires: expiresDate(expiresAt),
    path: "/",
  };
}

export function displayNameFromParts(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null
): string {
  const full = [firstName, lastName].filter(Boolean).join(" ").trim();
  return full || fallback?.trim() || "";
}

export function syncCustomerDisplayCookies(
  response: NextResponse,
  profile: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    phone?: string | null;
  },
  expiresAt?: string
): void {
  const opts = displayCookieOptions(expiresAt);
  const name = displayNameFromParts(
    profile.firstName,
    profile.lastName,
    profile.displayName ?? profile.email?.split("@")[0]
  );

  if (profile.email?.trim()) {
    response.cookies.set("customerEmail", profile.email.trim(), opts);
  }
  if (name) {
    response.cookies.set("customerName", name, opts);
  }
  if (profile.phone?.trim()) {
    response.cookies.set("customerPhone", profile.phone.trim(), opts);
  }
}

/** Keep the Shopify session valid after a password change. */
export function syncCustomerAccessTokenCookie(
  response: NextResponse,
  accessToken: string,
  expiresAt?: string
): void {
  applyCustomerAccessTokenCookie(
    response,
    accessToken,
    expiresAt || new Date(Date.now() + WEEK_MS).toISOString()
  );
}

export function syncLoginMethodCookie(
  response: NextResponse,
  loginMethod: string,
  expiresAt?: string
): void {
  response.cookies.set("loginMethod", loginMethod, displayCookieOptions(expiresAt));
}

export { applyCustomerSessionCookies };

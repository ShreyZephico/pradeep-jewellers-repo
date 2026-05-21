import { NextResponse } from "next/server";

import { CART_COOKIE_MAX_AGE, CART_ID_COOKIE } from "@/lib/cartConstants";

export function getCartIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CART_ID_COOKIE}=`));

  if (!match) return null;

  try {
    return decodeURIComponent(match.slice(CART_ID_COOKIE.length + 1)).trim() || null;
  } catch {
    return match.slice(CART_ID_COOKIE.length + 1).trim() || null;
  }
}

export function setCartIdCookie(response: NextResponse, cartId: string) {
  response.cookies.set(CART_ID_COOKIE, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export function clearCartIdCookie(response: NextResponse) {
  response.cookies.delete(CART_ID_COOKIE);
}

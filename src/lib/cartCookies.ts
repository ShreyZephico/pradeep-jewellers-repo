import { NextResponse } from "next/server";

import {
  CART_COOKIE_MAX_AGE,
  CART_ID_COOKIE,
  PENDING_DRAFT_ORDER_COOKIE,
} from "@/lib/cartConstants";

function readCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return null;

  try {
    return decodeURIComponent(match.slice(name.length + 1)).trim() || null;
  } catch {
    return match.slice(name.length + 1).trim() || null;
  }
}

export function getCartIdFromRequest(request: Request): string | null {
  return readCookieValue(request.headers.get("cookie"), CART_ID_COOKIE);
}

export function getPendingDraftOrderIdFromRequest(request: Request): string | null {
  return readCookieValue(
    request.headers.get("cookie"),
    PENDING_DRAFT_ORDER_COOKIE
  );
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

export function setPendingDraftOrderCookie(
  response: NextResponse,
  draftOrderId: string
) {
  response.cookies.set(PENDING_DRAFT_ORDER_COOKIE, draftOrderId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export function clearPendingDraftOrderCookie(response: NextResponse) {
  response.cookies.delete(PENDING_DRAFT_ORDER_COOKIE);
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** APIs that require a logged-in customer. */
function requiresAuth(pathname: string): boolean {
  return (
    pathname === "/api/checkout" ||
    pathname.startsWith("/api/checkout/") ||
    pathname === "/api/cart" ||
    pathname.startsWith("/api/cart/")
  );
}

const PUBLIC_PAGE_PREFIXES = [
  "/",
  "/landing",
  "/home",
  "/products",
  "/diamond-guide",
  "/cart",
  "/privacy",
  "/terms",
  "/returns",
  "/start-your-design",
  "/login",
  "/signup",
];

const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/login",
  "/api/signup",
  "/api/check-user",
  "/api/send-otp",
  "/api/verify-otp",
  "/api/products",
  "/api/product",
  "/api/price",
  "/api/variants",
  "/api/gold-rate",
  "/api/callback-lead",
  "/api/test",
  "/api/cart"
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PAGE_PREFIXES.includes(pathname)) {
    return true;
  }
  if (pathname.startsWith("/products/")) {
    return true;
  }
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("customerAccessToken");
  const { pathname } = request.nextUrl;

  if (!token && requiresAuth(pathname)) {
    return NextResponse.json(
      { error: "Please login before continuing." },
      { status: 401 }
    );
  }

  if (!token && !isPublicPath(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Please login before continuing." },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && (pathname === "/login" || pathname === "/signup")) {
    const returnTo = request.nextUrl.searchParams.get("returnTo");
    const safeReturn =
      returnTo &&
      returnTo.startsWith("/") &&
      !returnTo.startsWith("//") &&
      !returnTo.startsWith("/login") &&
      !returnTo.startsWith("/signup");

    if (safeReturn) {
      return NextResponse.redirect(new URL(returnTo, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

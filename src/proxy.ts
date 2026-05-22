import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Only checkout APIs require login — all pages and other APIs are public. */
function requiresCheckoutAuth(pathname: string): boolean {
  return (
    pathname === "/api/checkout" ||
    pathname.startsWith("/api/checkout/") ||
    pathname === "/api/cart/checkout"
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("customerAccessToken")?.value;

  if (requiresCheckoutAuth(pathname) && !token) {
    return NextResponse.json(
      { error: "Please login before continuing." },
      { status: 401 }
    );
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/checkout/:path*", "/api/checkout", "/api/cart/checkout", "/login"],
};

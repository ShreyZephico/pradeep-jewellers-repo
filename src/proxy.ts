import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Legacy checkout APIs require login; primary cart checkout is guest-friendly. */
function requiresAuth(pathname: string): boolean {
  return pathname === "/api/checkout" || pathname.startsWith("/api/checkout/");
}

function blockDebugApiInProduction(pathname: string): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (pathname === "/api/test" || pathname === "/api/variants") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const debugBlock = blockDebugApiInProduction(pathname);
  if (debugBlock) return debugBlock;

  const token = request.cookies.get("customerAccessToken");

  if (!token && requiresAuth(pathname)) {
    return NextResponse.json(
      { error: "Please login before continuing." },
      { status: 401 }
    );
  }

  // Login/signup redirect when a cookie exists is handled client-side via
  // /api/auth/check so expired or stale tokens do not block the login page.

  return NextResponse.next({ request });
}

export const config = {
  // Skip /api so App Router route handlers are reachable in `next dev` (see Next.js 16 proxy).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

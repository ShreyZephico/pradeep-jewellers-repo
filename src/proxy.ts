import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Legacy Shopify checkout APIs — cart checkout is guest-friendly via /api/cart/checkout. */
function requiresAuth(pathname: string): boolean {
  return (
    pathname === '/api/checkout' ||
    pathname.startsWith('/api/checkout/')
  );
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get('customerAccessToken');
  const { pathname } = request.nextUrl;

  if (!token && requiresAuth(pathname)) {
    return NextResponse.json(
      { error: 'Please login before continuing.' },
      { status: 401 }
    );
  }

  if (token && (pathname === '/login' || pathname === '/signup')) {
    const returnTo = request.nextUrl.searchParams.get('returnTo');
    const safeReturn =
      returnTo &&
      returnTo.startsWith('/') &&
      !returnTo.startsWith('//') &&
      !returnTo.startsWith('/login') &&
      !returnTo.startsWith('/signup');

    if (safeReturn) {
      return NextResponse.redirect(new URL(returnTo, request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

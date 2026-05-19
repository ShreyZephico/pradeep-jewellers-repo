import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('customerAccessToken');
  const { pathname } = request.nextUrl;

  // Public paths (no login required)
  const publicPaths = [
    '/login',
    '/signup',
    '/api/auth',
    '/api/login',
    '/api/signup',
    '/api/check-user',
    '/api/send-otp',
    '/api/verify-otp',
    '/api/products',
    '/api/product',
    
    '/api/price',
    '/api/variants',
    '/api/test',
    '/api/gold-rate',
    '/api/callback-lead',
  ];
  const publicPages = [
    '/',
    '/landing',
    '/products',
    '/home',
    '/cart',
    '/about',
    '/learn',
    '/rates',
    '/privacy',
    '/terms',
    '/returns',
  ];
  const isPublicPath =
    publicPages.includes(pathname) ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/collections/') ||
    publicPaths.some(path => pathname.startsWith(path));

  // If no token and trying to access private page → redirect to login
  if (!token && !isPublicPath) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Please login before continuing.' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    const returnTo = `${pathname}${request.nextUrl.search}`;
    if (returnTo && returnTo !== '/login') {
      loginUrl.searchParams.set('returnTo', returnTo);
    }
    return NextResponse.redirect(loginUrl);
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

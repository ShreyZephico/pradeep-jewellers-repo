import { NextResponse } from 'next/server';

export async function GET() {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_API_KEY;
  const redirectUri =
    process.env.SHOPIFY_OAUTH_REDIRECT_URI ||
    'http://localhost:3000/api/auth/shopify/callback';
  const scopes = 'write_customers,read_customers';
  const state = Math.random().toString(36).substring(2, 15);

  if (!shopDomain || !clientId) {
    return NextResponse.json(
      { error: 'Missing Shopify OAuth configuration' },
      { status: 500 }
    );
  }

  const authUrl =
    `https://${shopDomain}/admin/oauth/authorize?` +
    `client_id=${clientId}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}&` +
    `response_type=code`;

  const response = NextResponse.redirect(authUrl);

  response.cookies.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}

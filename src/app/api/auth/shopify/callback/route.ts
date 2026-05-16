import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const shop = url.searchParams.get('shop');
  const state = url.searchParams.get('state');

  console.log('📞 Callback received:', { code: !!code, shop, state });

  // Get stored state from cookie
  const cookieHeader = request.headers.get('cookie');
  const storedState = cookieHeader?.match(/shopify_oauth_state=([^;]+)/)?.[1];

  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  if (!code || !shop) {
    return NextResponse.redirect(new URL('/login?error=missing_params', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token received');
    }

    console.log('✅ OAuth successful!');

    // Create session token for frontend
    const sessionToken = Buffer.from(JSON.stringify({
      accessToken,
      shop,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    })).toString('base64');

    const response = NextResponse.redirect(new URL('/landing', request.url));
    
    response.cookies.set('customerAccessToken', sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('loginMethod', 'shopify', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.delete('shopify_oauth_state');
    
    return response;

  } catch (error) {
    console.error('❌ OAuth Error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }
}
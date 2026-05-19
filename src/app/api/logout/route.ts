import { NextResponse } from 'next/server';

import { CART_ID_COOKIE } from '@/lib/cartConstants';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.delete('customerAccessToken');
  response.cookies.delete(CART_ID_COOKIE);
  response.cookies.delete('googleVerifiedEmail');
  response.cookies.delete('customerEmail');
  response.cookies.delete('customerName');
  response.cookies.delete('loginMethod');
  response.cookies.delete('shopify_oauth_state');
  
  return response;
}

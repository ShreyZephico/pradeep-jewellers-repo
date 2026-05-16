import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.delete('customerAccessToken');
  response.cookies.delete('googleVerifiedEmail');
  response.cookies.delete('customerEmail');
  response.cookies.delete('customerName');
  response.cookies.delete('loginMethod');
  response.cookies.delete('shopify_oauth_state');
  
  return response;
}

import { handleGoogleShopifyAuth } from '@/lib/googleShopifyAuth';

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google';

export async function GET(request: Request) {
  return handleGoogleShopifyAuth(request, REDIRECT_URI);
}

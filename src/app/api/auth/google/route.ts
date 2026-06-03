import { handleGoogleShopifyAuth } from '@/lib/googleShopifyAuth';
import { getGoogleOAuthRedirectUri } from '@/lib/siteUrl';

const REDIRECT_URI = getGoogleOAuthRedirectUri();

export async function GET(request: Request) {
  return handleGoogleShopifyAuth(request, REDIRECT_URI);
}

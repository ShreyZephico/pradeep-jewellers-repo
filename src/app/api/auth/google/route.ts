import { handleGoogleShopifyAuth } from '@/lib/googleShopifyAuth';
import { getGoogleOAuthRedirectUriFromRequest } from '@/lib/siteUrl';

export async function GET(request: Request) {
  return handleGoogleShopifyAuth(
    request,
    getGoogleOAuthRedirectUriFromRequest(request)
  );
}

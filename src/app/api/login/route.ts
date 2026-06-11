import { NextResponse } from 'next/server';
import {
  customerDisplayName,
  verifyCheckoutCustomer,
} from '@/lib/checkoutAuth';
import { attachGuestCartToCustomer } from '@/lib/cartCustomerLink';
import { applyCustomerSessionCookies } from '@/lib/customerSessionCookies';
import {
  getShopifyStoreDomain,
  getShopifyStorefrontToken,
} from '@/lib/checkoutAuth';
import { getShopifyStorefrontGraphqlUrl } from '@/lib/shopifyApiVersion';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Shopify Storefront API login mutation
    const mutation = `
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            code
            message
          }
        }
      }
    `;

    const storeDomain = getShopifyStoreDomain() ?? '';
    const storefrontToken = getShopifyStorefrontToken();
    if (!storeDomain || !storefrontToken) {
      return NextResponse.json(
        { error: 'Shopify login is not configured.' },
        { status: 503 }
      );
    }

    const response = await fetch(
      getShopifyStorefrontGraphqlUrl(storeDomain),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontToken,
        },
        body: JSON.stringify({
          query: mutation,
          variables: { 
            input: { email, password } 
          }
        }),
      }
    );

    const data = await response.json();

    // GraphQL errors
    if (data.errors) {
      console.error('GraphQL Error:', data.errors);
      return NextResponse.json(
        { error: 'Login service unavailable. Please try again.' },
        { status: 500 }
      );
    }

    // Customer user errors (invalid credentials)
    if (data.data?.customerAccessTokenCreate?.customerUserErrors?.length > 0) {
      const error = data.data.customerAccessTokenCreate.customerUserErrors[0];
      
      if (error.code === 'UNIDENTIFIED_CUSTOMER') {
        return NextResponse.json(
          { error: 'Invalid email or password. Please try again.' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Account has been disabled') {
        return NextResponse.json(
          { error: 'Your account has been disabled. Please contact support.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: `${error.message}` },
        { status: 401 }
      );
    }

    // Get access token and expiry
    const accessToken = data.data?.customerAccessTokenCreate?.customerAccessToken?.accessToken;
    const expiresAt = data.data?.customerAccessTokenCreate?.customerAccessToken?.expiresAt;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Login failed. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Login successful:', email);

    const responseData = NextResponse.json({
      success: true,
      message: 'Login successful',
      email,
      loginMethod: 'email',
    });

    const profile = await verifyCheckoutCustomer(accessToken);
    const tokenExpires =
      expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    applyCustomerSessionCookies(responseData, {
      accessToken,
      expiresAt: tokenExpires,
      email,
      loginMethod: 'email',
      name: profile ? customerDisplayName(profile) : email.split('@')[0],
    });

    await attachGuestCartToCustomer(request, accessToken);

    return responseData;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

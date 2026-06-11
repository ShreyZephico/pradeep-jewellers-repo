import { NextResponse } from 'next/server';

import {
  getCheckoutAuthFromRequest,
  getShopifyStoreDomain,
  getShopifyStorefrontToken,
  verifyCheckoutCustomer,
} from '@/lib/checkoutAuth';
import { getShopifyStorefrontApiVersion } from '@/lib/shopifyApiVersion';

export async function POST(request: Request) {
  try {
    const { variantId, attributes, productName, customPrice } = await request.json();

    console.log('Checkout request received:', { variantId, productName, customPrice });

    if (!variantId) {
      return NextResponse.json(
        { error: 'Missing product variant.' },
        { status: 400 }
      );
    }

    const auth = getCheckoutAuthFromRequest(request);
    if (!auth?.customerAccessToken) {
      return NextResponse.json(
        { error: 'Please login before checkout.' },
        { status: 401 }
      );
    }

    const customer = await verifyCheckoutCustomer(auth.customerAccessToken);
    if (!customer) {
      console.log('Invalid or expired Shopify customer token');
      return NextResponse.json(
        { error: 'Your login expired. Please login again.' },
        { status: 401 }
      );
    }

    const storeDomain = getShopifyStoreDomain();
    const storefrontToken = getShopifyStorefrontToken();
    if (!storeDomain || !storefrontToken) {
      return NextResponse.json(
        { error: 'Shopify Storefront is not configured.' },
        { status: 503 }
      );
    }

    const apiVersion = getShopifyStorefrontApiVersion();
    const storefrontUrl = `https://${storeDomain}/api/${apiVersion}/graphql.json`;
    const shopifyHeaders = {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontToken,
    };

    const cartMutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const cartResponse = await fetch(storefrontUrl, {
      method: 'POST',
      headers: shopifyHeaders,
      body: JSON.stringify({
        query: cartMutation,
        variables: {
          input: {
            buyerIdentity: {
              customerAccessToken: auth.customerAccessToken,
            },
            lines: [
              {
                merchandiseId: variantId,
                quantity: 1,
                attributes: attributes || [],
              },
            ],
          },
        },
      }),
    });

    const cartData = await cartResponse.json();

    if (cartData.errors) {
      console.error('Cart creation errors:', cartData.errors);
      return NextResponse.json(
        { error: 'Failed to create cart' },
        { status: 500 }
      );
    }

    const cartError = cartData.data?.cartCreate?.userErrors?.[0];

    if (cartError) {
      console.error('Cart user error:', cartError);
      return NextResponse.json(
        { error: cartError.message },
        { status: 400 }
      );
    }

    const checkoutUrl = cartData.data?.cartCreate?.cart?.checkoutUrl;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Failed to create checkout URL' },
        { status: 500 }
      );
    }

    console.log('Checkout created for customer:', customer.email);

    return NextResponse.json({
      success: true,
      checkoutUrl,
      customerEmail: customer.email,
      authenticated: true,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

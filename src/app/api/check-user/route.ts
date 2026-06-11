import { NextResponse } from 'next/server';

import {
  getShopifyAdminToken,
  getShopifyStoreDomain,
} from '@/lib/shopifyEnv';

export async function POST(request: Request) {
  try {
    const { email, phone } = await request.json();

    console.log('🔍 Check user request:', { email, phone });

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      );
    }

    // Build query condition
    let queryCondition = '';
    if (email && phone) {
      queryCondition = `email:'${email}' OR phone:'${phone}'`;
    } else if (email) {
      queryCondition = `email:'${email}'`;
    } else {
      queryCondition = `phone:'${phone}'`;
    }

    // ✅ Admin API GraphQL query
    const checkQuery = `
      {
        customers(first: 1, query: "${queryCondition}") {
          edges {
            node {
              id
              email
              phone
              displayName
            }
          }
        }
      }
    `;

    // ✅ Using ADMIN API (not Storefront API)
    const storeDomain = getShopifyStoreDomain();
    const adminToken = getShopifyAdminToken();
    if (!storeDomain || !adminToken) {
      return NextResponse.json(
        { error: 'Shopify Admin API is not configured.' },
        { status: 503 }
      );
    }

    const response = await fetch(
      `https://${storeDomain}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify({ query: checkQuery }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Admin API HTTP Error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to connect to Shopify Admin API' },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('📥 Admin API Response:', JSON.stringify(data, null, 2));

    // Handle GraphQL errors
    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: data.errors[0]?.message || 'GraphQL error' },
        { status: 500 }
      );
    }

    const customer = data.data?.customers?.edges?.[0]?.node || null;

    console.log('✅ Check result:', { exists: !!customer, email: customer?.email });

    return NextResponse.json({
      exists: !!customer,
      customer: customer
        ? {
            id: customer.id,
            email: customer.email,
            phone: customer.phone,
            name: customer.displayName,
          }
        : null,
    });

  } catch (error) {
    console.error('❌ Check user error:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}
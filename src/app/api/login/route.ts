import { NextResponse } from 'next/server';
import { verifyCheckoutCustomer } from '@/lib/checkoutAuth';

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

    const response = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
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

    // ⭐ CRITICAL FIX: Set HTTP-only cookie
    const responseData = NextResponse.json({
      success: true,
      message: 'Login successful',
      email,
      loginMethod: 'email',
    });

    // Set the access token as an HTTP-only cookie
    responseData.cookies.set('customerAccessToken', accessToken, {
      httpOnly: true,           // Can't be accessed by JavaScript (more secure)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      path: '/',
    });

    // Set email for client-side display (not HTTP-only so JS can read it)
    responseData.cookies.set('customerEmail', email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: '/',
    });

    // Set login method
    responseData.cookies.set('loginMethod', 'email', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: '/',
    });

    const profile = await verifyCheckoutCustomer(accessToken);
    const displayName = profile?.displayName?.trim();
    if (displayName) {
      responseData.cookies.set('customerName', displayName, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        path: '/',
      });
    }

    return responseData;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

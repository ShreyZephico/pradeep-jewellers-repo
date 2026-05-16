import { NextResponse } from 'next/server';
import {
  createCustomer,
  createCustomerAccessToken,
  findCustomerByEmailOrPhone,
  splitCustomerName,
} from '@/lib/shopifyCustomer';

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\s/g, '');
    const existingCustomer = await findCustomerByEmailOrPhone(cleanEmail, cleanPhone);

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Email or phone already registered. Please login instead.' },
        { status: 409 }
      );
    }

    const { firstName, lastName } = splitCustomerName(name);
    const input = {
      firstName,
      ...(lastName ? { lastName } : {}),
      email: cleanEmail,
      phone: cleanPhone,
      password,
      acceptsMarketing: false,
    };
    const createResult = await createCustomer(input);
    const createError = createResult.customerUserErrors[0];

    if (createError) {
      const status = createError.code === 'TAKEN' ? 409 : 400;

      return NextResponse.json(
        {
          error:
            createError.code === 'TAKEN'
              ? 'Email or phone already registered. Please login instead.'
              : createError.message,
        },
        { status }
      );
    }

    if (!createResult.customer) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    const tokenResult = await createCustomerAccessToken(cleanEmail, password);

    if (!tokenResult.customerAccessToken) {
      return NextResponse.json(
        { error: tokenResult.customerUserErrors[0]?.message ?? 'Account created, but automatic login failed. Please sign in.' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      email: cleanEmail,
      loginMethod: 'email',
      customer: {
        id: createResult.customer.id,
        email: createResult.customer.email,
        name: createResult.customer.displayName,
      },
    });
    const expires = new Date(tokenResult.customerAccessToken.expiresAt);

    response.cookies.set('customerAccessToken', tokenResult.customerAccessToken.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });
    response.cookies.set('customerEmail', cleanEmail, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });
    response.cookies.set('loginMethod', 'email', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });

    const displayName = createResult.customer.displayName?.trim();
    if (displayName) {
      response.cookies.set('customerName', displayName, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

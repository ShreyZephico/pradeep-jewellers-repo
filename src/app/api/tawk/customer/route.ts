import { NextResponse } from 'next/server';
import {
  findCustomerByEmailOrPhone,
  getCustomerByAccessToken,
} from '@/lib/shopifyCustomer';

function getCookieValue(cookieHeader: string | null, name: string) {
  return cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function displayNameFromCustomer(customer: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) {
  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    fullName ||
    customer.displayName ||
    customer.email?.split('@')[0] ||
    ''
  );
}

export async function GET(request: Request) {
  const token = getCookieValue(
    request.headers.get('cookie'),
    'customerAccessToken'
  );

  if (!token) {
    return NextResponse.json({ isAuthenticated: false });
  }

  try {
    const customer = await getCustomerByAccessToken(decodeURIComponent(token));

    if (!customer) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const adminCustomer = customer.email
      ? await findCustomerByEmailOrPhone(customer.email)
      : null;

    return NextResponse.json({
      isAuthenticated: true,
      customer: {
        name: displayNameFromCustomer(adminCustomer ?? customer),
        email: customer.email,
        phone: adminCustomer?.phone ?? customer.phone,
      },
    });
  } catch (error) {
    console.error('Unable to load Tawk customer details:', error);
    return NextResponse.json({ isAuthenticated: false });
  }
}

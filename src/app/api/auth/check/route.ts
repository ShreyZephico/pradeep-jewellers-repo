import { NextResponse } from "next/server";

import {
  getCheckoutAuthFromRequest,
  verifyCheckoutCustomer,
} from "@/lib/checkoutAuth";

export async function GET(request: Request) {
  const auth = getCheckoutAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ isAuthenticated: false });
  }

  const customer = await verifyCheckoutCustomer(auth.customerAccessToken);
  if (!customer) {
    return NextResponse.json({ isAuthenticated: false });
  }

  return NextResponse.json({
    isAuthenticated: true,
    email: customer.email ?? auth.email,
    name: auth.name,
    loginMethod: auth.loginMethod,
  });
}

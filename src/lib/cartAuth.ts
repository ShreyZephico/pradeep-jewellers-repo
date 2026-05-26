import { NextResponse } from "next/server";

import {
  getCheckoutAuthFromRequest,
  verifyCheckoutCustomer,
} from "@/lib/checkoutAuth";

export type VerifiedCartAuth = {
  customerAccessToken: string;
  customerEmail: string | null;
};

export async function requireCartAuth(
  request: Request
): Promise<VerifiedCartAuth | NextResponse> {
  const auth = getCheckoutAuthFromRequest(request);
  if (!auth?.customerAccessToken) {
    return NextResponse.json(
      { error: "Please login to use your cart." },
      { status: 401 }
    );
  }

  const customer = await verifyCheckoutCustomer(auth.customerAccessToken);
  if (!customer) {
    return NextResponse.json(
      { error: "Your login expired. Please login again." },
      { status: 401 }
    );
  }

  return {
    customerAccessToken: auth.customerAccessToken,
    customerEmail: customer.email ?? auth.email ?? null,
  };
}

export function isAuthError(
  result: VerifiedCartAuth | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

import { NextResponse } from "next/server";

import {
  applyResolvedSessionToResponse,
  getCheckoutAuthFromRequest,
  resolveCustomerSession,
  type ResolvedCustomerSession,
} from "@/lib/checkoutAuth";
import { clearCustomerSessionCookies } from "@/lib/customerSessionCookies";

export function getCustomerAccessToken(request: Request): string | null {
  return getCheckoutAuthFromRequest(request)?.customerAccessToken ?? null;
}

export function unauthorizedResponse(): NextResponse {
  const response = NextResponse.json(
    { success: false, error: "Please sign in to continue." },
    { status: 401 }
  );
  clearCustomerSessionCookies(response);
  return response;
}

export function requireCustomerAccessToken(
  request: Request
): string | NextResponse {
  const token = getCustomerAccessToken(request);
  if (!token) return unauthorizedResponse();
  return token;
}

export async function requireCustomerSession(
  request: Request
): Promise<ResolvedCustomerSession | NextResponse> {
  const session = await resolveCustomerSession(request);
  if (!session) return unauthorizedResponse();
  return session;
}

export function finalizeCustomerResponse(
  response: NextResponse,
  session: ResolvedCustomerSession
): NextResponse {
  applyResolvedSessionToResponse(response, session);
  return response;
}

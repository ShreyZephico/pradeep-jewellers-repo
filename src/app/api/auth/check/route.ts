import { NextResponse } from "next/server";

import {
  applyResolvedSessionToResponse,
  resolveCustomerSession,
} from "@/lib/checkoutAuth";
import { clearCustomerSessionCookies } from "@/lib/customerSessionCookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await resolveCustomerSession(request);

  if (!session) {
    const response = NextResponse.json({ isAuthenticated: false });
    clearCustomerSessionCookies(response);
    return response;
  }

  const response = NextResponse.json({
    isAuthenticated: true,
    email: session.email,
    name: session.name,
    loginMethod: session.loginMethod,
  });

  applyResolvedSessionToResponse(response, session);
  return response;
}

import { NextResponse } from "next/server";

import { clearCustomerSessionCookies } from "@/lib/customerSessionCookies";
import { clearCartIdCookie, clearPendingDraftOrderCookie } from "@/lib/cartCookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true });

  clearCustomerSessionCookies(response);
  clearCartIdCookie(response);
  clearPendingDraftOrderCookie(response);

  response.cookies.set("shopify_oauth_state", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
  response.cookies.set("pj_checkout_draft", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}

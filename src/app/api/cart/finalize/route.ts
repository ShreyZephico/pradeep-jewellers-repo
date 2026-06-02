import { NextResponse } from "next/server";

import {
  applyFinalizeCookieClears,
  CheckoutAdminUnavailableError,
  finalizePendingCheckout,
} from "@/lib/cartFinalize";
import {
  getCartIdFromRequest,
  getPendingDraftOrderIdFromRequest,
} from "@/lib/cartCookies";

export async function POST(request: Request) {
  const draftOrderId = getPendingDraftOrderIdFromRequest(request);
  const cartId = getCartIdFromRequest(request);

  try {
    const status = await finalizePendingCheckout({ draftOrderId, cartId });
    const response = NextResponse.json({ status });

    if (status === "cleared") {
      applyFinalizeCookieClears(response);
    }

    return response;
  } catch (error) {
    if (error instanceof CheckoutAdminUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message =
      error instanceof Error ? error.message : "Unable to finalize checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

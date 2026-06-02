import { NextResponse } from "next/server";

import {
  clearCartIdCookie,
  clearPendingDraftOrderCookie,
  getCartIdFromRequest,
  getPendingDraftOrderIdFromRequest,
} from "@/lib/cartCookies";
import { isDraftOrderPaid } from "@/lib/shopify";
import { emptyShopifyCart } from "@/lib/shopifyCart";

export async function POST(request: Request) {
  const draftOrderId = getPendingDraftOrderIdFromRequest(request);
  if (!draftOrderId) {
    return NextResponse.json({ status: "idle" });
  }

  try {
    const paid = await isDraftOrderPaid(draftOrderId);
    if (!paid) {
      return NextResponse.json({ status: "pending" });
    }

    const cartId = getCartIdFromRequest(request);
    if (cartId) {
      try {
        await emptyShopifyCart(cartId);
      } catch {
        /* Shopify cart may already be gone after payment */
      }
    }

    const response = NextResponse.json({ status: "cleared" });
    clearCartIdCookie(response);
    clearPendingDraftOrderCookie(response);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to finalize checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

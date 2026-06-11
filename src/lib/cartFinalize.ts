import {
  clearCartIdCookie,
  clearPendingDraftOrderCookie,
} from "@/lib/cartCookies";
import { isDraftOrderPaid } from "@/lib/shopify";
import { emptyShopifyCart } from "@/lib/shopifyCart";
import { NextResponse } from "next/server";

export class CheckoutAdminUnavailableError extends Error {
  constructor() {
    super("Checkout verification is temporarily unavailable.");
    this.name = "CheckoutAdminUnavailableError";
  }
}

export type FinalizeStatus = "idle" | "pending" | "cleared";

function adminConfigured(): boolean {
  return Boolean(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim());
}

export async function finalizePendingCheckout(input: {
  draftOrderId: string | null;
  cartId: string | null;
}): Promise<FinalizeStatus> {
  if (!input.draftOrderId) {
    return "idle";
  }

  if (!adminConfigured()) {
    throw new CheckoutAdminUnavailableError();
  }

  const paid = await isDraftOrderPaid(input.draftOrderId);
  if (!paid) {
    return "pending";
  }

  if (input.cartId) {
    try {
      await emptyShopifyCart(input.cartId);
    } catch {
      /* cart may already be empty */
    }
  }

  return "cleared";
}

export function applyFinalizeCookieClears(response: NextResponse): void {
  clearCartIdCookie(response);
  clearPendingDraftOrderCookie(response);
}

import { NextResponse } from "next/server";

import { isAuthError, requireCartAuth } from "@/lib/cartAuth";
import { clearCartIdCookie, getCartIdFromRequest } from "@/lib/cartCookies";
import { buildLineAttributesForCart, type CartItemBody } from "@/lib/cartLinePayload";
import { resolveMerchandiseId } from "@/lib/cartResolve";
import {
  createDraftCheckoutFromLines,
  type DraftCheckoutLineItem,
} from "@/lib/shopify";
import { fetchCart, parseCustomPriceInr } from "@/lib/shopifyCart";

type CheckoutBody = CartItemBody & { buyNow?: boolean };

function cartLinesToDraftItems(
  lines: NonNullable<Awaited<ReturnType<typeof fetchCart>>>["lines"]
): DraftCheckoutLineItem[] {
  return lines.map((line) => {
    const price = line.customPriceInr;
    if (price <= 0) {
      throw new Error(
        `Missing custom price for "${line.title}". Remove it and add again.`
      );
    }
    return {
      variantId: line.merchandiseId,
      productName: line.title,
      price,
      quantity: line.quantity,
      attributes: line.attributes,
    };
  });
}

export async function POST(request: Request) {
  const authResult = await requireCartAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = (await request.json()) as CheckoutBody;
    let draftLines: DraftCheckoutLineItem[];

    if (body.buyNow) {
      const merchandiseId = await resolveMerchandiseId(body);
      const attributes = buildLineAttributesForCart(body);
      const rawPrice = body.customPrice;
      const price =
        typeof rawPrice === "number" && Number.isFinite(rawPrice)
          ? Math.max(0, Math.round(rawPrice))
          : parseCustomPriceInr(attributes);

      if (price <= 0) {
        return NextResponse.json(
          { error: "Invalid price for checkout." },
          { status: 400 }
        );
      }

      draftLines = [
        {
          variantId: merchandiseId,
          productName:
            typeof body.productName === "string" && body.productName.trim()
              ? body.productName.trim()
              : "Product",
          price,
          quantity:
            typeof body.quantity === "number" && body.quantity > 0
              ? Math.floor(body.quantity)
              : 1,
          attributes,
        },
      ];
    } else {
      const cartId = getCartIdFromRequest(request);
      if (!cartId) {
        return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
      }
      const cart = await fetchCart(cartId);
      if (!cart?.lines.length) {
        return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
      }
      draftLines = cartLinesToDraftItems(cart.lines);
    }

    const checkoutUrl = await createDraftCheckoutFromLines({
      lines: draftLines,
      customerEmail: authResult.customerEmail ?? undefined,
    });

    const response = NextResponse.json({
      success: true,
      checkoutUrl,
      customerEmail: authResult.customerEmail,
    });

    if (!body.buyNow) {
      clearCartIdCookie(response);
    }
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

import { optionalCartAuth } from "@/lib/cartAuth";
import {
  getCartIdFromRequest,
  setPendingDraftOrderCookie,
} from "@/lib/cartCookies";
import { buildLineAttributesForCart, type CartItemBody } from "@/lib/cartLinePayload";
import {
  PriceMismatchError,
  revalidateCartLineUnitPrice,
  resolveCartLinePricing,
  sanitizePublicCartAttributes,
} from "@/lib/serverCartPricing";
import {
  InsufficientStockError,
  assertVariantCanBePurchased,
} from "@/lib/variantInventory";
import {
  createDraftCheckoutFromLines,
  type DraftCheckoutLineItem,
} from "@/lib/shopify";
import { fetchCart } from "@/lib/shopifyCart";

type CheckoutBody = CartItemBody & { buyNow?: boolean };

function cartLinesToDraftItems(
  lines: NonNullable<Awaited<ReturnType<typeof fetchCart>>>["lines"]
): Promise<DraftCheckoutLineItem[]> {
  return Promise.all(
    lines.map(async (line) => {
      const price = await revalidateCartLineUnitPrice(line);
      await assertVariantCanBePurchased(line.merchandiseId, line.quantity);
      return {
        variantId: line.merchandiseId,
        productName: line.title,
        price,
        quantity: line.quantity,
        attributes: line.attributes,
      };
    })
  );
}

export async function POST(request: Request) {
  const authResult = await optionalCartAuth(request);

  try {
    const body = (await request.json()) as CheckoutBody;
    let draftLines: DraftCheckoutLineItem[];

    if (body.buyNow) {
      const quantity =
        typeof body.quantity === "number" && body.quantity > 0
          ? Math.floor(body.quantity)
          : 1;

      const { merchandiseId, trustedPrice, pricing } =
        await resolveCartLinePricing(body);
      await assertVariantCanBePurchased(merchandiseId, quantity);
      const attributes = buildLineAttributesForCart({
        variantId: merchandiseId,
        productSlug: body.productSlug,
        productName: body.productName,
        productImage: body.productImage,
        quantity,
        customPrice: trustedPrice,
        attributes: sanitizePublicCartAttributes(body.attributes),
        priceBreakdown: pricing.breakdown,
        weightGrams: pricing.weightGrams,
        karatLabel: pricing.karatLabel,
        optionAdjustments: pricing.optionAdjustments,
        optionLines: pricing.optionLines,
      });

      draftLines = [
        {
          variantId: merchandiseId,
          productName:
            typeof body.productName === "string" && body.productName.trim()
              ? body.productName.trim()
              : "Product",
          price: trustedPrice,
          quantity,
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
      draftLines = await cartLinesToDraftItems(cart.lines);
    }

    const { invoiceUrl: checkoutUrl, draftOrderId } =
      await createDraftCheckoutFromLines({
        lines: draftLines,
        customerEmail: authResult.customerEmail ?? undefined,
      });

    const response = NextResponse.json({
      success: true,
      checkoutUrl,
      customerEmail: authResult.customerEmail,
    });

    setPendingDraftOrderCookie(response, draftOrderId);
    return response;
  } catch (error) {
    if (error instanceof PriceMismatchError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message =
      error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

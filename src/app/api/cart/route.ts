import { NextResponse } from "next/server";

import { isAuthError, requireCartAuth } from "@/lib/cartAuth";
import {
  clearCartIdCookie,
  getCartIdFromRequest,
  setCartIdCookie,
} from "@/lib/cartCookies";
import { enrichCartImages } from "@/lib/cartEnrich";
import { buildLineAttributesForCart, type CartItemBody } from "@/lib/cartLinePayload";
import { resolveMerchandiseId } from "@/lib/cartResolve";
import {
  addCartLines,
  createCartWithLine,
  fetchCart,
  removeCartLines,
  updateCartLineQuantity,
} from "@/lib/shopifyCart";

function serializeCart(cart: Awaited<ReturnType<typeof fetchCart>>) {
  if (!cart) {
    return { id: null, totalQuantity: 0, lines: [], subtotalInr: 0 };
  }
  return {
    id: cart.id,
    totalQuantity: cart.totalQuantity,
    subtotalInr: cart.subtotalInr,
    lines: cart.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      merchandiseId: line.merchandiseId,
      title: line.title,
      productHandle: line.productHandle,
      imageUrl: line.imageUrl,
      customPriceInr: line.customPriceInr,
      lineTotalInr: line.customPriceInr * line.quantity,
      attributes: line.attributes.filter((a) => !a.key.startsWith("_pj_")),
    })),
  };
}

export async function GET(request: Request) {
  const authResult = await requireCartAuth(request);
  if (isAuthError(authResult)) return authResult;

  const cartId = getCartIdFromRequest(request);
  if (!cartId) {
    return NextResponse.json({ cart: serializeCart(null) });
  }

  try {
    const cart = await fetchCart(cartId);
    if (!cart) {
      const response = NextResponse.json({ cart: serializeCart(null) });
      clearCartIdCookie(response);
      return response;
    }
    const enriched = await enrichCartImages(cart);
    return NextResponse.json({ cart: serializeCart(enriched) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireCartAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = (await request.json()) as CartItemBody;
    const merchandiseId = await resolveMerchandiseId(body);
    const attributes = buildLineAttributesForCart(body);
    const quantity =
      typeof body.quantity === "number" && body.quantity > 0
        ? Math.floor(body.quantity)
        : 1;

    const existingCartId = getCartIdFromRequest(request);
    const cart =
      existingCartId && (await fetchCart(existingCartId))
        ? await addCartLines(existingCartId, [
            { merchandiseId, quantity, attributes },
          ])
        : await createCartWithLine({
            merchandiseId,
            quantity,
            attributes,
            customerAccessToken: authResult.customerAccessToken,
          });

    const enriched = await enrichCartImages(cart);
    const response = NextResponse.json({
      success: true,
      cart: serializeCart(enriched),
    });
    setCartIdCookie(response, enriched.id);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to add to cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireCartAuth(request);
  if (isAuthError(authResult)) return authResult;

  const cartId = getCartIdFromRequest(request);
  if (!cartId) {
    return NextResponse.json({ error: "Cart not found." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { lineId?: string; quantity?: number };
    const lineId = typeof body.lineId === "string" ? body.lineId.trim() : "";
    const quantity =
      typeof body.quantity === "number" ? Math.floor(body.quantity) : NaN;

    if (!lineId || !Number.isFinite(quantity)) {
      return NextResponse.json(
        { error: "Missing line id or quantity." },
        { status: 400 }
      );
    }

    const cart =
      quantity <= 0
        ? await removeCartLines(cartId, [lineId])
        : await updateCartLineQuantity(cartId, lineId, quantity);

    const enriched = await enrichCartImages(cart);
    const response = NextResponse.json({
      success: true,
      cart: serializeCart(enriched),
    });
    setCartIdCookie(response, enriched.id);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireCartAuth(request);
  if (isAuthError(authResult)) return authResult;

  const cartId = getCartIdFromRequest(request);
  if (!cartId) {
    return NextResponse.json({ success: true, cart: serializeCart(null) });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { lineId?: string };
    const lineId = typeof body.lineId === "string" ? body.lineId.trim() : "";

    if (!lineId) {
      const response = NextResponse.json({
        success: true,
        cart: serializeCart(null),
      });
      clearCartIdCookie(response);
      return response;
    }

    const cart = await removeCartLines(cartId, [lineId]);
    const enriched = await enrichCartImages(cart);
    const response = NextResponse.json({
      success: true,
      cart: serializeCart(enriched),
    });

    if (enriched.totalQuantity === 0) {
      clearCartIdCookie(response);
    } else {
      setCartIdCookie(response, enriched.id);
    }
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

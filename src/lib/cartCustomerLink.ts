import { getCartIdFromRequest } from "@/lib/cartCookies";
import { updateCartBuyerIdentity } from "@/lib/shopifyCart";

/** Attach an existing guest cart to the logged-in Shopify customer. */
export async function attachGuestCartToCustomer(
  request: Request,
  customerAccessToken: string
): Promise<void> {
  const cartId = getCartIdFromRequest(request);
  if (!cartId || !customerAccessToken.trim()) return;

  try {
    await updateCartBuyerIdentity(cartId, customerAccessToken.trim());
  } catch (error) {
    console.warn("Could not link guest cart to customer:", error);
  }
}

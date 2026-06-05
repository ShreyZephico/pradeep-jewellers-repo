import { NextResponse } from "next/server";

import {
  finalizeCustomerResponse,
  requireCustomerSession,
} from "@/lib/customerSession";
import { getCustomerOrders } from "@/lib/shopifyCustomer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireCustomerSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");
    const limitRaw = Number.parseInt(searchParams.get("limit") ?? "10", 10);
    const first = Number.isFinite(limitRaw) ? limitRaw : 10;

    const result = await getCustomerOrders(session.accessToken, { first, after });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Could not load orders." },
        { status: 500 }
      );
    }

    return finalizeCustomerResponse(
      NextResponse.json({
        success: true,
        orders: result.orders,
        pageInfo: {
          hasNextPage: result.hasNextPage,
          endCursor: result.endCursor,
        },
      }),
      session
    );
  } catch (error) {
    console.error("customer orders GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not load your orders. Please try again.",
      },
      { status: 500 }
    );
  }
}

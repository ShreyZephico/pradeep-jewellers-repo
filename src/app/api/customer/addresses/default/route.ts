import { NextResponse } from "next/server";

import { requireCustomerAccessToken } from "@/lib/customerSession";
import {
  getCustomerProfile,
  setDefaultCustomerAddress,
} from "@/lib/shopifyCustomer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = requireCustomerAccessToken(request);
  if (token instanceof NextResponse) return token;

  try {
    const body = (await request.json()) as { addressId?: string };
    const addressId = body.addressId?.trim();

    if (!addressId) {
      return NextResponse.json(
        { success: false, error: "Address id is required." },
        { status: 400 }
      );
    }

    await setDefaultCustomerAddress(token, addressId);
    const profile = await getCustomerProfile(token);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not set default address.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

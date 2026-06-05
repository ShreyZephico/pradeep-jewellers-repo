import { NextResponse } from "next/server";

import { requireCustomerAccessToken } from "@/lib/customerSession";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerProfile,
  updateCustomerAddress,
  type MailingAddressInput,
} from "@/lib/shopifyCustomer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AddressBody = {
  id?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
};

function normalizeText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function toAddressInput(body: AddressBody): MailingAddressInput | null {
  const address1 = normalizeText(body.address1, 200);
  const city = normalizeText(body.city, 120);
  const country = normalizeText(body.country, 80) || "IN";
  const zip = normalizeText(body.zip, 32);

  if (!address1 || !city || !zip) {
    return null;
  }

  return {
    firstName: normalizeText(body.firstName, 80) || undefined,
    lastName: normalizeText(body.lastName, 80) || undefined,
    company: normalizeText(body.company, 120) || undefined,
    address1,
    address2: normalizeText(body.address2, 200) || undefined,
    city,
    province: normalizeText(body.province, 120) || undefined,
    country,
    zip,
    phone: normalizeText(body.phone, 32) || undefined,
  };
}

export async function POST(request: Request) {
  const token = requireCustomerAccessToken(request);
  if (token instanceof NextResponse) return token;

  try {
    const body = (await request.json()) as AddressBody;
    const address = toAddressInput(body);

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Address line, city, and PIN code are required.",
        },
        { status: 400 }
      );
    }

    const created = await createCustomerAddress(token, address);
    const profile = await getCustomerProfile(token);

    return NextResponse.json({
      success: true,
      address: created,
      profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save address.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const token = requireCustomerAccessToken(request);
  if (token instanceof NextResponse) return token;

  try {
    const body = (await request.json()) as AddressBody;
    const id = normalizeText(body.id, 256);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Address id is required." },
        { status: 400 }
      );
    }

    const address = toAddressInput(body);
    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Address line, city, and PIN code are required.",
        },
        { status: 400 }
      );
    }

    const updated = await updateCustomerAddress(token, id, address);
    const profile = await getCustomerProfile(token);

    return NextResponse.json({
      success: true,
      address: updated,
      profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update address.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const token = requireCustomerAccessToken(request);
  if (token instanceof NextResponse) return token;

  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Address id is required." },
        { status: 400 }
      );
    }

    await deleteCustomerAddress(token, id);
    const profile = await getCustomerProfile(token);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete address.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

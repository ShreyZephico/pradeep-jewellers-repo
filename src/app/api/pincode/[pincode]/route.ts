import { NextResponse } from "next/server";

import {
  isValidPincodeFormat,
  normalizePincodeInput,
  parsePostalPincodeResponse,
} from "@/lib/pincodeDelivery";

const UPSTREAM_BASE = "https://api.postalpincode.in/pincode";
const FETCH_TIMEOUT_MS = 12_000;

type RouteContext = {
  params: Promise<{ pincode: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { pincode: raw } = await context.params;
  const pincode = normalizePincodeInput(raw ?? "");

  if (!isValidPincodeFormat(pincode)) {
    return NextResponse.json(
      {
        success: false,
        error: "Enter a valid 6-digit Indian pincode.",
        code: "invalid",
      },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${UPSTREAM_BASE}/${pincode}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Pincode service is temporarily unavailable.",
          code: "upstream",
        },
        { status: 502 }
      );
    }

    const payload = await upstream.json();
    const parsed = parsePostalPincodeResponse(pincode, payload);

    if ("code" in parsed) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.message,
          code: parsed.code,
        },
        { status: parsed.code === "invalid" ? 400 : 404 }
      );
    }

    return NextResponse.json({
      success: true,
      result: parsed,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to reach pincode service. Please try again.",
        code: "network",
      },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

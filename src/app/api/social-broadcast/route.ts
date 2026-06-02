import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { clientIpFromRequest, rateLimit } from "@/lib/rateLimit";
import { normalizeIndianMobile, toIndianE164 } from "@/utils/indianPhone";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`social-broadcast:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) },
      }
    );
  }

  try {
    const body = (await request.json()) as { phone?: string };
    const raw = body.phone?.trim() ?? "";

    if (!raw) {
      return NextResponse.json(
        { error: "Please enter your mobile number." },
        { status: 400 }
      );
    }

    const national = normalizeIndianMobile(raw);
    if (!national) {
      return NextResponse.json(
        {
          error:
            "Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).",
        },
        { status: 400 }
      );
    }

    const phoneE164 = toIndianE164(national);

    const { error } = await getSupabaseServerClient()
      .schema("dev")
      .from("whatsapp_broadcast_subscribers")
      .insert({
        phone: national,
        phone_e164: phoneE164,
        source: "social_section",
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, duplicate: true });
      }
      console.error("social-broadcast insert:", error);
      return NextResponse.json(
        { error: "Could not save your number. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("social-broadcast:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

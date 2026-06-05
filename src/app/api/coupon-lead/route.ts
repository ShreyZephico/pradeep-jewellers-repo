import { NextResponse } from "next/server";

import { clientIpFromRequest, rateLimit } from "@/lib/rateLimit";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type CouponLeadBody = {
  email?: string;
  source_page?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeSourcePage(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "/";
  return trimmed.slice(0, 2048);
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`coupon-lead:${ip}`, 6, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many attempts. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as CouponLeadBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const sourcePage = normalizeSourcePage(body.source_page);

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Please enter your email address." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: existing, error: lookupError } = await supabase
      .schema("dev")
      .from("coupon_leads")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("coupon-lead lookup:", lookupError);
      return NextResponse.json(
        { success: false, error: "Could not verify your email. Please try again." },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json({
        success: false,
        duplicate: true,
        message:
          "You have already claimed this offer. New coupon codes will be available soon.",
      });
    }

    const { error: insertError } = await supabase
      .schema("dev")
      .from("coupon_leads")
      .insert({ email, source_page: sourcePage });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({
          success: false,
          duplicate: true,
          message:
            "You have already claimed this offer. New coupon codes will be available soon.",
        });
      }
      console.error("coupon-lead insert:", insertError);
      return NextResponse.json(
        { success: false, error: "Could not save your email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Your coupon code will reach you by email shortly! Check your inbox (and spam folder) within a few minutes.",
    });
  } catch (error) {
    console.error("coupon-lead error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

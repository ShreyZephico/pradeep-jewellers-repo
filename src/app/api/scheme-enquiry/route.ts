import { NextResponse } from "next/server";

import { clientIpFromRequest, rateLimit } from "@/lib/rateLimit";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type SchemeEnquiryBody = {
  fullName?: string;
  contactNumber?: string;
  monthlyAmount?: number;
  plan?: string;
  consent?: boolean;
};

const MIN_MONTHLY_INSTALLMENT = 2000;
const STEP_MONTHLY_INSTALLMENT = 1000;

function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

function isValidPlan(plan: string): boolean {
  return plan.length > 0 && plan.toLowerCase() !== "select";
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`scheme-enquiry:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as SchemeEnquiryBody;

    const fullName = body.fullName?.trim() ?? "";
    const phoneRaw = body.contactNumber?.trim() ?? "";
    const monthlyAmount = body.monthlyAmount;
    const plan = body.plan?.trim() ?? "";
    const consent = body.consent ?? true;

    if (!fullName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!phoneRaw) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const phoneDigits = normalizeIndianPhone(phoneRaw);
    if (!phoneDigits || !/^[6-9]\d{9}$/.test(phoneDigits)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    if (!isValidPlan(plan)) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    if (
      typeof monthlyAmount !== "number" ||
      !Number.isFinite(monthlyAmount) ||
      monthlyAmount <= 0 ||
      !Number.isInteger(monthlyAmount) ||
      monthlyAmount < MIN_MONTHLY_INSTALLMENT ||
      monthlyAmount % STEP_MONTHLY_INSTALLMENT !== 0
    ) {
      return NextResponse.json(
        { error: "Valid monthly amount is required" },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }

    const phone = `+91 ${phoneDigits}`;
    const supabase = getSupabaseServerClient();

    const { error: insertError } = await supabase
      .schema("dev")
      .from("vridhhi_enquiries")
      .insert({
        full_name: fullName,
        contact_number: phone,
        monthly_installment: monthlyAmount,
        plan,
        consent_agreed: consent,
      });

    if (insertError) {
      console.error("scheme-enquiry insert:", insertError);
      return NextResponse.json(
        { error: "Failed to save enquiry. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("scheme-enquiry", err);
    return NextResponse.json(
      { error: "Failed to submit enquiry" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import contactData from "@/data/contactDatas.json";
import { getMailFrom, getMailTransporter, getOwnerEmail } from "@/lib/mail";

type SchemeEnquiryBody = {
  fullName?: string;
  contactNumber?: string;
  monthlyAmount?: number;
  plan?: string;
};

function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SchemeEnquiryBody;

    const fullName = body.fullName?.trim() ?? "";
    const phoneRaw = body.contactNumber?.trim() ?? "";
    const monthlyAmount = body.monthlyAmount;
    const plan = body.plan?.trim() ?? "";

    if (!fullName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!phoneRaw) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const phoneDigits = normalizeIndianPhone(phoneRaw);
    if (!phoneDigits) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    if (
      typeof monthlyAmount !== "number" ||
      !Number.isFinite(monthlyAmount) ||
      monthlyAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Valid monthly amount is required" },
        { status: 400 }
      );
    }

    const transporter = getMailTransporter();
    const ownerEmail = getOwnerEmail();

    if (!transporter || !ownerEmail) {
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 503 }
      );
    }

    const phone = `+91 ${phoneDigits}`;
    const from = getMailFrom();
    const brand = contactData.brand.name;

    const text = [
      `Suvarna Vriddhi enquiry — ${brand}`,
      "",
      `Name: ${fullName}`,
      `Phone: ${phone}`,
      `Plan: ${plan}`,
      `Monthly amount: ₹${monthlyAmount.toLocaleString("en-IN")}`,
    ].join("\n");

    await transporter.sendMail({
      from,
      to: ownerEmail,
      replyTo: contactData.contact.email || undefined,
      subject: `[${brand}] Suvarna Vriddhi scheme enquiry`,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("scheme-enquiry", err);
    return NextResponse.json(
      { error: "Failed to submit enquiry" },
      { status: 500 }
    );
  }
}

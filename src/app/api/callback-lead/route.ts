import { NextResponse } from "next/server";

import {
  ownerLeadEmail,
  userConfirmationEmail,
  type CallbackLeadEmailData,
} from "@/lib/callbackEmailTemplates";
import { getMailFrom, getMailTransporter, getOwnerEmail } from "@/lib/mail";
import contactData from "@/data/contactDatas.json";

type CallbackBody = {
  name?: string;
  email?: string;
  phone?: string;
  preferredTime?: string;
  message?: string;
};

function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CallbackBody;

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const phoneRaw = body.phone?.trim() ?? "";
    const preferredTime = body.preferredTime?.trim() || "Not specified";
    const message = body.message?.trim() || "—";

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
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
    const section = contactData.callbackLeadSection;

    const emailData: CallbackLeadEmailData = {
      name,
      email,
      phone,
      preferredTime,
      message,
      brandName: contactData.brand.name,
      brandTagline: contactData.brand.tagline,
      brandDescription: section.description,
      contactPhone: contactData.contact.phone,
      contactEmail: contactData.contact.email,
    };

    const owner = ownerLeadEmail(emailData);
    const userMail = userConfirmationEmail(emailData);

    await Promise.all([
      transporter.sendMail({
        from,
        to: ownerEmail,
        replyTo: email,
        subject: owner.subject,
        text: owner.text,
        html: owner.html,
      }),
      transporter.sendMail({
        from,
        to: email,
        subject: userMail.subject,
        text: userMail.text,
        html: userMail.html,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("callback-lead error:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}

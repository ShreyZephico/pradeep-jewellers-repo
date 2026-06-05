import { NextResponse } from "next/server";

import { resolveCustomerSession } from "@/lib/checkoutAuth";
import {
  syncCustomerAccessTokenCookie,
  syncCustomerDisplayCookies,
  syncLoginMethodCookie,
} from "@/lib/customerCookies";
import {
  finalizeCustomerResponse,
  requireCustomerSession,
  unauthorizedResponse,
} from "@/lib/customerSession";
import {
  createCustomerAccessToken,
  getCustomerProfile,
  updateCustomerPassword,
  updateCustomerProfile,
  verifyCustomerPassword,
  type CustomerUpdateInput,
} from "@/lib/shopifyCustomer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileUpdateBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  acceptsMarketing?: boolean;
  currentPassword?: string;
  password?: string;
};

function normalizeText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function buildProfileInput(body: ProfileUpdateBody): CustomerUpdateInput {
  const input: CustomerUpdateInput = {};

  const firstName = normalizeText(body.firstName, 80);
  const lastName = normalizeText(body.lastName, 80);
  const email = normalizeText(body.email, 320);
  const phone = normalizeText(body.phone, 32);

  if (firstName !== undefined) input.firstName = firstName;
  if (lastName !== undefined) input.lastName = lastName;
  if (email !== undefined) input.email = email;
  if (phone !== undefined) input.phone = phone;
  if (typeof body.acceptsMarketing === "boolean") {
    input.acceptsMarketing = body.acceptsMarketing;
  }

  return input;
}

function userHasKnownPassword(loginMethod: string | null | undefined): boolean {
  return loginMethod === "email";
}

async function applyPasswordChange(options: {
  customerAccessToken: string;
  customerId: string;
  email: string;
  loginMethod: string | null;
  currentPassword?: string;
  newPassword: string;
}): Promise<{ accessToken: string; expiresAt: string; loginMethod: string }> {
  const hasPassword = userHasKnownPassword(options.loginMethod);

  if (hasPassword) {
    const current = options.currentPassword?.trim();
    if (!current) {
      throw new Error("Enter your current password to set a new one.");
    }

    const valid = await verifyCustomerPassword(options.email, current);
    if (!valid) {
      throw new Error("Current password is incorrect.");
    }

    await updateCustomerProfile(options.customerAccessToken, {
      password: options.newPassword,
    });
  } else {
    await updateCustomerPassword(options.customerId, options.newPassword);
  }

  const tokenResult = await createCustomerAccessToken(
    options.email,
    options.newPassword
  );

  if (!tokenResult.customerAccessToken) {
    throw new Error(
      tokenResult.customerUserErrors[0]?.message ||
        "Password updated but sign-in could not be refreshed. Please log in again."
    );
  }

  return {
    accessToken: tokenResult.customerAccessToken.accessToken,
    expiresAt: tokenResult.customerAccessToken.expiresAt,
    loginMethod: "email",
  };
}

export async function GET(request: Request) {
  const session = await resolveCustomerSession(request);
  if (!session) return unauthorizedResponse();

  try {
    const profile = await getCustomerProfile(session.accessToken);
    if (!profile) return unauthorizedResponse();

    const loginMethod = session.loginMethod ?? null;

    const response = NextResponse.json({
      success: true,
      profile,
      loginMethod,
      hasPassword: userHasKnownPassword(loginMethod),
    });
    return finalizeCustomerResponse(response, session);
  } catch (error) {
    console.error("customer profile GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not load your profile. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await requireCustomerSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const loginMethod = session.loginMethod ?? null;
    const token = session.accessToken;

    const existing = await getCustomerProfile(token);
    if (!existing) return unauthorizedResponse();

    const body = (await request.json()) as ProfileUpdateBody;
    const input = buildProfileInput(body);
    const newPassword = normalizeText(body.password, 128);
    const currentPassword = normalizeText(body.currentPassword, 128);

    if (Object.keys(input).length === 0 && !newPassword) {
      return NextResponse.json(
        { success: false, error: "No changes to save." },
        { status: 400 }
      );
    }

    if (input.email && (!input.email.includes("@") || !input.email.includes("."))) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    let passwordSession:
      | { accessToken: string; expiresAt: string; loginMethod: string }
      | null = null;
    let activeToken = token;
    let sessionExpires: string | undefined;

    if (newPassword) {
      passwordSession = await applyPasswordChange({
        customerAccessToken: token,
        customerId: existing.id,
        email: existing.email,
        loginMethod,
        currentPassword,
        newPassword,
      });
      activeToken = passwordSession.accessToken;
      sessionExpires = passwordSession.expiresAt;
    }

    if (Object.keys(input).length > 0) {
      await updateCustomerProfile(activeToken, input);
    }

    const finalEmail = input.email ?? existing.email;
    if (
      newPassword &&
      input.email &&
      input.email !== existing.email &&
      passwordSession
    ) {
      const tokenResult = await createCustomerAccessToken(finalEmail, newPassword);
      if (!tokenResult.customerAccessToken) {
        throw new Error(
          tokenResult.customerUserErrors[0]?.message ||
            "Email updated but sign-in could not be refreshed."
        );
      }
      activeToken = tokenResult.customerAccessToken.accessToken;
      sessionExpires = tokenResult.customerAccessToken.expiresAt;
      passwordSession = {
        accessToken: activeToken,
        expiresAt: sessionExpires,
        loginMethod: "email",
      };
    }

    const profile = await getCustomerProfile(activeToken);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile updated but could not reload." },
        { status: 500 }
      );
    }

    const expiresAt = sessionExpires ?? passwordSession?.expiresAt;

    const response = NextResponse.json({
      success: true,
      profile,
      loginMethod: passwordSession?.loginMethod ?? loginMethod,
      hasPassword: userHasKnownPassword(
        passwordSession?.loginMethod ?? loginMethod
      ),
    });

    syncCustomerDisplayCookies(response, profile, expiresAt);

    if (passwordSession) {
      syncCustomerAccessTokenCookie(
        response,
        passwordSession.accessToken,
        expiresAt
      );
      syncLoginMethodCookie(response, passwordSession.loginMethod, expiresAt);
    }

    return finalizeCustomerResponse(response, {
      ...session,
      accessToken: passwordSession?.accessToken ?? activeToken,
      expiresAt: expiresAt ?? session.expiresAt,
      email: profile.email ?? session.email,
      name: session.name,
      loginMethod: passwordSession?.loginMethod ?? session.loginMethod,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update profile.";
    console.error("customer profile PATCH:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

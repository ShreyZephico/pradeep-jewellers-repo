import type { NextResponse } from "next/server";

import {
  createCustomer,
  createCustomerTokenWithPasswords,
  findCustomerByEmailOrPhone,
  googleCustomerPassword,
  legacyGoogleCustomerPasswords,
  splitCustomerName,
  updateCustomerPassword,
} from "@/lib/shopifyCustomer";

export type GoogleAuthMode = "login" | "signup";

export type GoogleProfile = {
  email: string;
  name?: string;
};

export type GoogleAuthResult = {
  email: string;
  name: string;
  isNewUser: boolean;
  accessToken: string;
  expiresAt: string;
};

export function requiredGoogleEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function linkExistingCustomerToGoogle(
  customerId: string,
  email: string,
  password: string
) {
  try {
    await updateCustomerPassword(customerId, password);
  } catch (error) {
    console.error("Google link password update failed:", error);
    return null;
  }

  const linked = await createCustomerTokenWithPasswords(email, [password]);
  return "accessToken" in linked ? linked : null;
}

export async function authenticateGoogleProfile(
  profile: GoogleProfile,
  mode: GoogleAuthMode = "login"
): Promise<GoogleAuthResult> {
  const email = profile.email.trim().toLowerCase();
  const name = profile.name?.trim() || email.split("@")[0];
  const password = googleCustomerPassword(email);
  const existingCustomer = await findCustomerByEmailOrPhone(email);

  if (mode === "signup" && existingCustomer) {
    throw new Error("Email already exists. Please login with Google instead.");
  }

  const tokenAttempt = await createCustomerTokenWithPasswords(email, [
    password,
    ...legacyGoogleCustomerPasswords(email),
  ]);

  let customerAccessToken =
    "accessToken" in tokenAttempt ? tokenAttempt : null;
  let isNewUser = false;

  if (!customerAccessToken && existingCustomer) {
    customerAccessToken = await linkExistingCustomerToGoogle(
      existingCustomer.id,
      email,
      password
    );
    if (!customerAccessToken && mode === "login") {
      throw new Error("Could not sign in with Google.");
    }
  }

  if (!customerAccessToken) {
    const { firstName, lastName } = splitCustomerName(name);
    const createResult = await createCustomer({
      email,
      password,
      firstName,
      ...(lastName ? { lastName } : {}),
      acceptsMarketing: false,
    });
    const createError = createResult.customerUserErrors[0];

    if (createError?.code === "TAKEN") {
      const taken =
        existingCustomer ?? (await findCustomerByEmailOrPhone(email));
      if (!taken) {
        throw new Error("An account already exists with this email.");
      }
      customerAccessToken = await linkExistingCustomerToGoogle(
        taken.id,
        email,
        password
      );
    } else if (createError) {
      throw new Error(createError.message);
    } else {
      const newToken = await createCustomerTokenWithPasswords(email, [password]);
      customerAccessToken =
        "accessToken" in newToken ? newToken : null;
      isNewUser = true;
    }
  }

  if (!customerAccessToken) {
    throw new Error("Could not create a login session.");
  }

  return {
    email,
    name,
    isNewUser,
    accessToken: customerAccessToken.accessToken,
    expiresAt: customerAccessToken.expiresAt,
  };
}

export function applyGoogleAuthCookies(
  response: NextResponse,
  session: GoogleAuthResult
): void {
  const expires = new Date(session.expiresAt);

  response.cookies.set("customerAccessToken", session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
  response.cookies.set("customerEmail", session.email, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
  response.cookies.set("loginMethod", "google", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });

  if (session.name.trim()) {
    response.cookies.set("customerName", session.name.trim(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires,
      path: "/",
    });
  }
}

export async function verifyGoogleIdToken(
  credential: string
): Promise<GoogleProfile> {
  const clientId = requiredGoogleEnv("GOOGLE_CLIENT_ID");

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );

  if (!res.ok) {
    throw new Error("Invalid Google sign-in. Please try again.");
  }

  const data = (await res.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    exp?: string;
  };

  if (data.aud !== clientId) {
    throw new Error("Google sign-in could not be verified.");
  }

  if (data.exp && Number(data.exp) * 1000 < Date.now()) {
    throw new Error("Google sign-in expired. Please try again.");
  }

  const verified =
    data.email_verified === true || data.email_verified === "true";

  if (!verified || !data.email) {
    throw new Error("Google did not return a verified email.");
  }

  return { email: data.email, name: data.name };
}

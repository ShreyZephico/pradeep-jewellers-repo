import { NextResponse } from "next/server";

import {
  applyGoogleAuthCookies,
  authenticateGoogleProfile,
  verifyGoogleIdToken,
} from "@/lib/googleAuthSession";
import { attachGuestCartToCustomer } from "@/lib/cartCustomerLink";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { credential?: string };
    const credential = body.credential?.trim();

    if (!credential) {
      return NextResponse.json(
        { error: "Missing Google credential" },
        { status: 400 }
      );
    }

    const profile = await verifyGoogleIdToken(credential);
    const session = await authenticateGoogleProfile(profile, "login");

    const response = NextResponse.json({
      success: true,
      email: session.email,
      name: session.name,
      isNewUser: session.isNewUser,
    });

    applyGoogleAuthCookies(response, session);
    await attachGuestCartToCustomer(request, session.accessToken);
    return response;
  } catch (error) {
    console.error("Google One Tap error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Google sign-in failed",
      },
      { status: 400 }
    );
  }
}

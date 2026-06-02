import { cookies } from "next/headers";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type MetalPricesAccessResult = {
  authenticated: boolean;
  authorized: boolean;
  email: string | null;
};

function normalizeEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase();
  if (!value || !value.includes("@")) return null;
  return value;
}

async function isOnAllowlist(
  email: string | null
): Promise<boolean> {
  if (!email) return false;

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .schema("dev")
    .from("access_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    console.error("access_users email lookup failed:", error.message);
    return false;
  }
  return Boolean(data?.id);
}

/** Server Components / Route Handlers — read session from cookies. */
export async function getMetalPricesAccess(): Promise<MetalPricesAccessResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("customerAccessToken")?.value?.trim();
  const email = normalizeEmail(cookieStore.get("customerEmail")?.value);

  if (!token) {
    return { authenticated: false, authorized: false, email };
  }

  const authorized = await isOnAllowlist(email);
  return { authenticated: true, authorized, email };
}

/** API routes — pass Request cookie header. */
export async function getMetalPricesAccessFromRequest(
  request: Request
): Promise<MetalPricesAccessResult> {
  const cookieHeader = request.headers.get("cookie");
  const token = cookieHeader?.match(/customerAccessToken=([^;]+)/)?.[1]?.trim();
  const emailRaw = cookieHeader?.match(/customerEmail=([^;]+)/)?.[1];

  let email: string | null = null;

  try {
    email = normalizeEmail(emailRaw ? decodeURIComponent(emailRaw) : null);
  } catch {
    email = normalizeEmail(emailRaw ?? null);
  }

  if (!token) {
    return { authenticated: false, authorized: false, email };
  }

  const authorized = await isOnAllowlist(email);
  return { authenticated: true, authorized, email };
}

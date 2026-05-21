import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getSupabaseUrl(): string | undefined {
  return (
    process.env.NEXT_SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim()
  );
}

function getSupabaseServiceKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

/** Lazy Supabase client for server routes (reads env at request time). */
export function getSupabaseServerClient(): SupabaseClient {
  if (!client) {
    const url = getSupabaseUrl();
    const key = getSupabaseServiceKey();
    if (!url || !key) {
      throw new Error(
        "Supabase credentials are not configured. Set NEXT_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_KEY."
      );
    }
    client = createClient(url, key);
  }
  return client;
}

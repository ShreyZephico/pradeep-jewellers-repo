import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type VisitorLocationRow = {
  session_id: string;
  ip_address: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  source_page: string;
  referrer: string | null;
  user_agent: string | null;
};

export async function hasRecentVisitorSession(
  sessionId: string,
  sinceIso: string
): Promise<boolean> {
  const { data, error } = await getSupabaseServerClient()
    .schema("dev")
    .from("visitor_locations")
    .select("id")
    .eq("session_id", sessionId)
    .gte("created_at", sinceIso)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

export async function insertVisitorLocation(
  row: VisitorLocationRow
): Promise<void> {
  const { error } = await getSupabaseServerClient()
    .schema("dev")
    .from("visitor_locations")
    .insert(row);

  if (error) throw error;
}

import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type VisitorGeoRow = {
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  visits: number;
};

export type VisitorLocationAnalytics = {
  days: number;
  totalVisits: number;
  byCountry: VisitorGeoRow[];
  byRegion: VisitorGeoRow[];
  byCity: VisitorGeoRow[];
};

function sinceIso(days: number): string {
  const since = new Date();
  since.setDate(since.getDate() - Math.max(1, Math.floor(days)));
  return since.toISOString();
}

async function aggregateVisits(
  groupColumns: string[],
  days: number,
  limit = 50
): Promise<VisitorGeoRow[]> {
  const since = sinceIso(days);

  const { data, error } = await getSupabaseServerClient()
    .schema("dev")
    .from("visitor_locations")
    .select("country, country_code, region, city")
    .gte("created_at", since);

  if (error) throw error;

  const counts = new Map<string, VisitorGeoRow>();

  for (const row of data ?? []) {
    const keyParts = groupColumns.map((col) => {
      const value = (row as Record<string, string | null>)[col];
      return value?.trim() || "Unknown";
    });
    const key = keyParts.join("|");

    const existing = counts.get(key);
    if (existing) {
      existing.visits += 1;
      continue;
    }

    counts.set(key, {
      country: row.country ?? null,
      country_code: row.country_code ?? null,
      region: row.region ?? null,
      city: row.city ?? null,
      visits: 1,
    });
  }

  return [...counts.values()]
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);
}

export async function fetchVisitorLocationAnalytics(
  days = 30
): Promise<VisitorLocationAnalytics> {
  const windowDays = Math.min(90, Math.max(1, Math.floor(days)));
  const since = sinceIso(windowDays);

  const { count, error: countError } = await getSupabaseServerClient()
    .schema("dev")
    .from("visitor_locations")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);

  if (countError) throw countError;

  const [byCountry, byRegion, byCity] = await Promise.all([
    aggregateVisits(["country_code", "country"], windowDays, 30),
    aggregateVisits(["country_code", "region"], windowDays, 50),
    aggregateVisits(["country_code", "region", "city"], windowDays, 100),
  ]);

  return {
    days: windowDays,
    totalVisits: count ?? 0,
    byCountry,
    byRegion,
    byCity,
  };
}

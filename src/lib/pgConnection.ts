import type { PoolConfig } from "pg";

/** Pool config for Supabase Postgres (fixes "self-signed certificate in certificate chain"). */
export function getPgPoolConfig(connectionString: string): PoolConfig {
  const needsSsl =
    /supabase\.com/i.test(connectionString) ||
    /sslmode=require/i.test(connectionString);

  if (!needsSsl) {
    return { connectionString };
  }

  let cleaned = connectionString;
  try {
    const url = new URL(connectionString.replace(/^postgresql:/i, "postgres:"));
    url.searchParams.delete("sslmode");
    cleaned = url.toString().replace(/^postgres:/i, "postgresql:");
  } catch {
    // keep original URL
  }

  return {
    connectionString: cleaned,
    ssl: { rejectUnauthorized: false },
  };
}

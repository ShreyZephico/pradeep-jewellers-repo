/**
 * One-time fix for: permission denied for table store_metal_prices
 * Uses DATABASE_URL from .env.local or .env
 */
import { readFileSync, existsSync } from "fs";
import pg from "pg";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL not found in .env.local or .env");
  process.exit(1);
}

function getPoolConfig(url) {
  const needsSsl =
    /supabase\.com/i.test(url) || /sslmode=require/i.test(url);
  if (!needsSsl) return { connectionString: url };

  let cleaned = url;
  try {
    const parsed = new URL(url.replace(/^postgresql:/i, "postgres:"));
    parsed.searchParams.delete("sslmode");
    cleaned = parsed.toString().replace(/^postgres:/i, "postgresql:");
  } catch {
    // keep url
  }

  return {
    connectionString: cleaned,
    ssl: { rejectUnauthorized: false },
  };
}

const pool = new pg.Pool(getPoolConfig(connectionString));

const sql = `
  GRANT USAGE ON SCHEMA dev TO postgres, service_role, authenticator;
  GRANT SELECT, INSERT ON dev.store_metal_prices TO postgres, service_role;
  GRANT SELECT ON dev.store_metal_prices TO anon, authenticated;

  ALTER TABLE dev.store_metal_prices ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS store_metal_prices_service_role ON dev.store_metal_prices;
  CREATE POLICY store_metal_prices_service_role
    ON dev.store_metal_prices
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  DROP POLICY IF EXISTS store_metal_prices_postgres ON dev.store_metal_prices;
  CREATE POLICY store_metal_prices_postgres
    ON dev.store_metal_prices
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);
`;

try {
  await pool.query(sql);
  console.log("OK — permissions set on dev.store_metal_prices");
} catch (err) {
  console.error("Grant failed:", err.message);
  console.error("\nRun supabase/migrations/20260603120000_store_metal_prices.sql first.\n");
  process.exit(1);
} finally {
  await pool.end();
}

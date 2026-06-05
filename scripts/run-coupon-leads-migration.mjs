import { readFileSync, existsSync } from "fs";
import pg from "pg";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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
  console.error("DATABASE_URL missing in .env.local or .env");
  process.exit(1);
}

let cleaned = connectionString;
try {
  const parsed = new URL(connectionString.replace(/^postgresql:/i, "postgres:"));
  parsed.searchParams.delete("sslmode");
  cleaned = parsed.toString().replace(/^postgres:/i, "postgresql:");
} catch {
  // keep url
}

const sql = readFileSync(
  "supabase/migrations/20260605120000_coupon_leads.sql",
  "utf8"
);

const client = new pg.Client({
  connectionString: cleaned,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  await client.query("NOTIFY pgrst, 'reload schema'");
  const count = await client.query(
    "select count(*)::int as n from dev.coupon_leads"
  );
  console.log("Migration OK — dev.coupon_leads rows:", count.rows[0]?.n);
  console.log("PostgREST schema reload notified.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}

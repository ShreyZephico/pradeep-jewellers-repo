import { readFileSync } from "fs";
import pg from "pg";

function loadEnv() {
  const raw = readFileSync(".env", "utf8");
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
    process.env[key] = val;
  }
}

loadEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const grants = `
grant usage on schema dev to service_role;
grant select, insert on dev.whatsapp_broadcast_subscribers to service_role;

alter table dev.whatsapp_broadcast_subscribers enable row level security;

drop policy if exists whatsapp_broadcast_service_role on dev.whatsapp_broadcast_subscribers;
create policy whatsapp_broadcast_service_role
  on dev.whatsapp_broadcast_subscribers
  for all
  to service_role
  using (true)
  with check (true);
`;

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL.trim(),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(grants);
  console.log("Grants applied.");
} catch (err) {
  console.error(err.message);
  process.exit(1);
} finally {
  await client.end();
}

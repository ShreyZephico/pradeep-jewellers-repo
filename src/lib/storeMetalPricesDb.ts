import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Pool } from "pg";

import { env } from "@/lib/envTrim";
import { getPgPoolConfig } from "@/lib/pgConnection";

const GRANT_HINT =
  "Run in terminal: npm run store-metal-prices:grant — then restart npm run dev";

const MANUAL_SOURCE = "manual";

let pgPool: Pool | null = null;

function getDatabaseUrl(): string {
  const url = env("DATABASE_URL");
  if (!url) {
    throw new Error(`DATABASE_URL is missing in .env.local. ${GRANT_HINT}`);
  }
  return url;
}

function getPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool(getPgPoolConfig(getDatabaseUrl()));
  }
  return pgPool;
}

function getSupabaseAdmin(): SupabaseClient | null {
  const url =
    env("NEXT_PUBLIC_SUPABASE_URL") ||
    env("NEXT_SUPABASE_URL") ||
    env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

export function permissionHint(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("permission denied")) {
    return `${message}. ${GRANT_HINT}`;
  }
  if (lower.includes("self-signed certificate")) {
    return `${message}. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY.`;
  }
  return message;
}

export type StoreMetalPriceInsert = {
  metal: string;
  purity_label: string;
  unit: string;
  price: number;
};

export type StoreMetalPriceCreator = {
  email: string | null;
};

export async function insertStoreMetalPrices(
  rows: StoreMetalPriceInsert[],
  creator: StoreMetalPriceCreator
): Promise<void> {
  const created_at = new Date().toISOString();
  const payload = rows.map((row) => ({
    metal: row.metal,
    purity_label: row.purity_label,
    unit: row.unit,
    price: row.price,
    created_at,
    created_by_email: creator.email,
    source: MANUAL_SOURCE,
  }));

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase
      .schema("dev")
      .from("store_metal_prices")
      .insert(payload);
    if (!error) return;
    if (!error.message.toLowerCase().includes("permission denied")) {
      throw new Error(error.message);
    }
  }

  const pool = getPool();
  const text = `
    INSERT INTO dev.store_metal_prices (
      metal, purity_label, unit, price, created_at,
      created_by_email, source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;

  for (const row of payload) {
    await pool.query(text, [
      row.metal,
      row.purity_label,
      row.unit,
      row.price,
      row.created_at,
      row.created_by_email,
      row.source,
    ]);
  }
}

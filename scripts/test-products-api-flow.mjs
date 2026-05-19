import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv();

// Dynamic import after env is loaded
const { getProductsPage } = await import("../src/lib/shopify.ts");

try {
  const result = await getProductsPage({ page: 1, limit: 5 });
  console.log("getProductsPage OK");
  console.log("total:", result.total);
  console.log(
    "first products:",
    result.products.slice(0, 3).map((p) => ({ name: p.name, slug: p.slug, id: p.id }))
  );
} catch (error) {
  console.error("getProductsPage FAILED:", error);
  process.exit(1);
}

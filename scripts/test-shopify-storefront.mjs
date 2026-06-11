import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
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
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

function normalizeStoreDomain(raw) {
  if (!raw?.trim()) return "";
  return raw.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

const domain = normalizeStoreDomain(
  process.env.NEXT_SHOPIFY_STORE ?? process.env.SHOPIFY_STORE_DOMAIN
);
const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2025-04";
const publicToken = process.env.NEXT_SHOPIFY_STOREFRONT_TOKEN?.trim() ?? "";
const serverToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() ?? "";
const token =
  (publicToken && !publicToken.startsWith("shpat_") ? publicToken : undefined) ??
  serverToken ??
  publicToken ??
  "";


if (publicToken.startsWith("shpat_")) {
  console.log(
    "WARN: NEXT_SHOPIFY_STOREFRONT_TOKEN looks like Admin token (shpat_). Use a Storefront token instead."
  );
}

if (!domain || !token) {
  process.exit(1);
}

const query = `
  query ProductsList($first: Int!) {
    products(first: $first) {
      edges {
        node {
          handle
          title
        }
      }
    }
  }
`;

const response = await fetch(
  `https://${domain}/api/${apiVersion}/graphql.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables: { first: 5 } }),
  }
);

const json = await response.json();

if (json.errors?.length) {
  console.log("GraphQL errors:", JSON.stringify(json.errors, null, 2));
  process.exit(2);
}

const edges = json.data?.products?.edges ?? [];
console.log("products returned:", edges.length);
for (const { node } of edges) {
  console.log(`  - ${node.handle}: ${node.title}`);
}

if (edges.length === 0) {
  console.log(
    "NOTE: API works but 0 products — check Sales channel > Headless / Online Store publication."
  );
}

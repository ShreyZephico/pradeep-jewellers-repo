import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import {
  isWebhookEventProcessed,
  markWebhookEventProcessed,
} from "@/lib/checkoutWebhookStore";
import { clearShopifyNodesCache } from "@/lib/shopify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET?.trim();
  if (!secret || !hmacHeader) return false;

  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const webhookId = request.headers.get("x-shopify-webhook-id") ?? "";
  const topic = request.headers.get("x-shopify-topic") ?? "unknown";

  if (webhookId && (await isWebhookEventProcessed(webhookId))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const resourceId =
    (typeof payload.id === "string" || typeof payload.id === "number"
      ? String(payload.id)
      : null) ??
    (typeof payload.admin_graphql_api_id === "string"
      ? payload.admin_graphql_api_id
      : null);

  if (
    topic === "products/update" ||
    topic === "products/create" ||
    topic === "products/delete" ||
    topic === "inventory_levels/update"
  ) {
    clearShopifyNodesCache();
  }

  if (webhookId) {
    await markWebhookEventProcessed({
      id: webhookId,
      topic,
      resourceId,
    });
  }

  return NextResponse.json({ ok: true, topic });
}

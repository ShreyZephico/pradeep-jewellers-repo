import { getSupabaseServerClient } from "@/lib/supabaseServer";

/** Idempotent Shopify webhook processing (dedupe by X-Shopify-Webhook-Id). */
export async function isWebhookEventProcessed(webhookId: string): Promise<boolean> {
  if (!webhookId.trim()) return false;

  try {
    const { data, error } = await getSupabaseServerClient()
      .schema("dev")
      .from("checkout_webhook_events")
      .select("id")
      .eq("id", webhookId.trim())
      .maybeSingle();

    if (error) {
      console.warn("checkout_webhook_events lookup:", error.message);
      return false;
    }
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function markWebhookEventProcessed(input: {
  id: string;
  topic: string;
  resourceId?: string | null;
}): Promise<void> {
  if (!input.id.trim()) return;

  try {
    const { error } = await getSupabaseServerClient()
      .schema("dev")
      .from("checkout_webhook_events")
      .upsert(
        {
          id: input.id.trim(),
          topic: input.topic,
          resource_id: input.resourceId ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

    if (error) {
      console.warn("checkout_webhook_events insert:", error.message);
    }
  } catch (error) {
    console.warn("checkout_webhook_events insert failed:", error);
  }
}

-- Idempotent Shopify webhook deduplication + audit trail
CREATE TABLE IF NOT EXISTS dev.checkout_webhook_events (
  id text PRIMARY KEY,
  topic text NOT NULL,
  resource_id text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dev.checkout_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS checkout_webhook_events_service_role ON dev.checkout_webhook_events;
CREATE POLICY checkout_webhook_events_service_role ON dev.checkout_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON dev.checkout_webhook_events TO service_role;

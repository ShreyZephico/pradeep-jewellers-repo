/** Read env vars (trims spaces — fixes `KEY = value` typos in .env). */
export function env(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

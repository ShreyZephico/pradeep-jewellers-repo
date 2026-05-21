/** Normalize image URLs for cart display (protocol-relative, whitespace). */
export function normalizeCartImageUrl(
  url: string | null | undefined
): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

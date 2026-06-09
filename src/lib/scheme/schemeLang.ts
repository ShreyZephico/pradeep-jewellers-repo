export const SCHEME_LANG_STORAGE_KEY = "svy_lang";
export const SCHEME_LANG_COOKIE = "svy_lang";
export const SCHEME_LANG_DEFAULT = "gu" as const;

export type SchemeLang = "en" | "gu";

export function parseSchemeLang(
  value: string | undefined | null
): SchemeLang | null {
  if (value === "en" || value === "gu") return value;
  return null;
}

export function schemeLangCookieHeader(value: SchemeLang): string {
  return `${SCHEME_LANG_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

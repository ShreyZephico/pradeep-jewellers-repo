const FETCH_TIMEOUT_MS = 8_000;
const IPINFO_BASE = "https://ipinfo.io";

export type IpGeolocationResult = {
  ip: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  postal: string | null;
  source: "ipinfo";
};

export type IpInfoPayload = {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  postal?: string;
  timezone?: string;
  bogon?: boolean;
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  AE: "United Arab Emirates",
  SG: "Singapore",
  CA: "Canada",
  AU: "Australia",
};

function countryCodeToName(code: string | null): string | null {
  if (!code) return null;
  return COUNTRY_NAMES[code] ?? code;
}

function parseLoc(loc: string | undefined): {
  latitude: number | null;
  longitude: number | null;
} {
  const trimmed = loc?.trim() ?? "";
  if (!trimmed) return { latitude: null, longitude: null };

  const [latRaw, lngRaw] = trimmed.split(",");
  const latitude = Number.parseFloat(latRaw ?? "");
  const longitude = Number.parseFloat(lngRaw ?? "");

  return {
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

export function mapIpInfoPayload(payload: IpInfoPayload): IpGeolocationResult | null {
  if (payload.bogon) return null;

  const ip = payload.ip?.trim();
  if (!ip) return null;

  const countryCode = payload.country?.trim().toUpperCase() || null;
  const { latitude, longitude } = parseLoc(payload.loc);

  return {
    ip,
    country: countryCodeToName(countryCode),
    countryCode,
    region: payload.region?.trim() || null,
    city: payload.city?.trim() || null,
    latitude,
    longitude,
    timezone: payload.timezone?.trim() || null,
    postal: payload.postal?.trim() || null,
    source: "ipinfo",
  };
}

export function normalizeIpAddress(ip: string): string {
  const trimmed = ip.trim();
  if (!trimmed) return "unknown";
  if (trimmed.startsWith("::ffff:")) {
    return trimmed.slice(7);
  }
  return trimmed;
}

export function isPrivateOrLoopbackIp(ip: string): boolean {
  const normalized = normalizeIpAddress(ip).toLowerCase();
  if (!normalized || normalized === "unknown") return true;
  if (normalized === "localhost" || normalized === "::1" || normalized === "127.0.0.1") {
    return true;
  }

  if (normalized.includes(":")) {
    return (
      normalized === "::1" ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd")
    );
  }

  const parts = normalized.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
}

function resolveDevFallbackIp(): string | null {
  const fallback = process.env.VISITOR_GEO_FALLBACK_IP?.trim();
  if (!fallback || isPrivateOrLoopbackIp(fallback)) {
    return null;
  }
  return normalizeIpAddress(fallback);
}

function ipInfoToken(): string | null {
  const token = process.env.IPINFO_TOKEN?.trim();
  return token || null;
}

function buildIpInfoUrl(ip?: string): string {
  const path = ip ? `/${encodeURIComponent(ip)}/json` : "/json";
  const url = new URL(`${IPINFO_BASE}${path}`);
  const token = ipInfoToken();
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

/** Best public client IP from proxy headers (Vercel, Cloudflare, nginx). */
export function resolvePublicClientIp(request: Request): string {
  const headerCandidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-real-ip"),
    ...(request.headers.get("x-forwarded-for")?.split(",") ?? []),
  ];

  for (const raw of headerCandidates) {
    const ip = normalizeIpAddress(raw?.trim() ?? "");
    if (ip && !isPrivateOrLoopbackIp(ip)) {
      return ip;
    }
  }

  const firstForwarded = normalizeIpAddress(
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip")?.trim() ??
      "unknown"
  );

  if (!isPrivateOrLoopbackIp(firstForwarded)) {
    return firstForwarded;
  }

  return resolveDevFallbackIp() ?? firstForwarded;
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Fetch geo from ipinfo.io — omit ip to use the requester's public IP. */
export async function fetchIpInfoGeolocation(
  ip?: string
): Promise<IpGeolocationResult | null> {
  try {
    const response = await fetchWithTimeout(buildIpInfoUrl(ip), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as IpInfoPayload;
    return mapIpInfoPayload(data);
  } catch {
    return null;
  }
}

export async function resolveIpGeolocation(ip: string): Promise<IpGeolocationResult | null> {
  const normalized = normalizeIpAddress(ip);
  if (!normalized || normalized === "unknown") {
    return fetchIpInfoGeolocation();
  }

  if (isPrivateOrLoopbackIp(normalized)) {
    return fetchIpInfoGeolocation();
  }

  return fetchIpInfoGeolocation(normalized);
}

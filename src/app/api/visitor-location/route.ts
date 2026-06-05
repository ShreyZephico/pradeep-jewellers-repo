import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rateLimit";
import {
  fetchIpInfoGeolocation,
  isPrivateOrLoopbackIp,
  mapIpInfoPayload,
  normalizeIpAddress,
  resolveIpGeolocation,
  resolvePublicClientIp,
  type IpGeolocationResult,
} from "@/lib/ipGeolocation";
import {
  hasRecentVisitorSession,
  insertVisitorLocation,
} from "@/lib/visitorLocationsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TrackBody = {
  session_id?: string;
  source_page?: string;
  referrer?: string;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  postal?: string;
  timezone?: string;
};

function normalizePath(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || !trimmed.startsWith("/")) return "/";
  return trimmed.slice(0, 512);
}

function normalizeReferrer(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, 1024);
}

function text(value: string | null | undefined, max: number): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

async function resolveVisitorGeo(
  requestIp: string,
  body: TrackBody
): Promise<IpGeolocationResult | null> {
  const clientPayload = mapIpInfoPayload({
    ip: body.ip,
    city: body.city,
    region: body.region,
    country: body.country,
    loc: body.loc,
    postal: body.postal,
    timezone: body.timezone,
  });

  if (!isPrivateOrLoopbackIp(requestIp)) {
    const serverGeo = await resolveIpGeolocation(requestIp);
    if (serverGeo) return serverGeo;
  }

  if (clientPayload) {
    return clientPayload;
  }

  if (body.ip && !isPrivateOrLoopbackIp(body.ip)) {
    const bodyIpGeo = await fetchIpInfoGeolocation(body.ip);
    if (bodyIpGeo) return bodyIpGeo;
  }

  return fetchIpInfoGeolocation();
}

export async function POST(request: Request) {
  const ip = resolvePublicClientIp(request);
  const limited = rateLimit(`visitor-location:${ip}`, 60, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, skipped: true }, { status: 429 });
  }

  try {
    const body = (await request.json()) as TrackBody;
    const sessionId = body.session_id?.trim();
    if (!sessionId || sessionId.length < 8 || sessionId.length > 128) {
      return NextResponse.json(
        { ok: false, error: "Invalid session" },
        { status: 400 }
      );
    }

    const since = new Date();
    since.setHours(since.getHours() - 24);

    if (await hasRecentVisitorSession(sessionId, since.toISOString())) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
    const geo = await resolveVisitorGeo(ip, body);
    const storedIp = text(
      normalizeIpAddress(geo?.ip ?? ip),
      64
    );

    if (!geo) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no_geo",
      });
    }

    await insertVisitorLocation({
      session_id: sessionId,
      ip_address: storedIp,
      country_code: text(geo.countryCode, 8),
      country: text(geo.country, 128),
      region: text(geo.region, 128),
      city: text(geo.city, 128),
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: text(geo.timezone, 64),
      source_page: normalizePath(body.source_page),
      referrer: normalizeReferrer(body.referrer),
      user_agent: userAgent,
    });

    return NextResponse.json({
      ok: true,
      geoResolved: true,
      source: geo.source,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tracking failed";
    console.error("visitor-location error:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

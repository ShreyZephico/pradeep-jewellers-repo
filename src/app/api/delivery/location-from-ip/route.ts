import { NextResponse } from "next/server";

import {
  indianPincodeFromGeo,
  resolvePublicClientIp,
  resolveIpGeolocation,
} from "@/lib/ipGeolocation";
import {
  isValidPincodeFormat,
  normalizePincodeInput,
} from "@/lib/pincodeDelivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FETCH_TIMEOUT_MS = 10_000;

async function reverseGeocodeIndianPincode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = new URL(
      "https://api.bigdatacloud.net/data/reverse-geocode-client"
    );
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("localityLanguage", "en");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      countryCode?: string;
      postcode?: string;
    };

    if (data.countryCode && data.countryCode !== "IN") {
      return null;
    }

    const pincode = normalizePincodeInput(
      typeof data.postcode === "string" ? data.postcode : ""
    );
    return isValidPincodeFormat(pincode) ? pincode : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: Request) {
  const ip = resolvePublicClientIp(request);
  const geo = await resolveIpGeolocation(ip);

  if (!geo) {
    return NextResponse.json(
      {
        success: false,
        error: "Could not resolve location from IP.",
        code: "no_geo",
      },
      { status: 404 }
    );
  }

  let pincode = indianPincodeFromGeo(geo);

  if (
    !pincode &&
    geo.countryCode === "IN" &&
    geo.latitude != null &&
    geo.longitude != null
  ) {
    pincode = await reverseGeocodeIndianPincode(geo.latitude, geo.longitude);
  }

  return NextResponse.json({
    success: true,
    ip: geo.ip,
    pincode,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    countryCode: geo.countryCode,
    latitude: geo.latitude,
    longitude: geo.longitude,
    timezone: geo.timezone,
    postal: geo.postal,
  });
}

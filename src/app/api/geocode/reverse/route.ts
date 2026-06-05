import { NextResponse } from "next/server";

import {
  isValidPincodeFormat,
  normalizePincodeInput,
} from "@/lib/pincodeDelivery";

const FETCH_TIMEOUT_MS = 10_000;

function parseCoordinates(
  latRaw: string | null,
  lngRaw: string | null
): { lat: number; lng: number } | null {
  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}

function extractIndianPincode(value: unknown): string | null {
  const normalized = normalizePincodeInput(
    typeof value === "string" || typeof value === "number" ? String(value) : ""
  );
  return isValidPincodeFormat(normalized) ? normalized : null;
}

async function reverseGeocodeBigDataCloud(
  lat: number,
  lng: number
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = new URL(
      "https://api.bigdatacloud.net/data/reverse-geocode-client"
    );
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("localityLanguage", "en");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      countryCode?: string;
      postcode?: string;
    };

    if (data.countryCode && data.countryCode !== "IN") {
      return null;
    }

    return extractIndianPincode(data.postcode);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function reverseGeocodeNominatim(
  lat: number,
  lng: number
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "PradeepJewellers-Shop/1.0 (delivery-estimate)",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      address?: {
        postcode?: string;
        country_code?: string;
      };
    };

    if (data.address?.country_code && data.address.country_code !== "in") {
      return null;
    }

    return extractIndianPincode(data.address?.postcode);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lng")
  );

  if (!coords) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid coordinates.",
        code: "invalid",
      },
      { status: 400 }
    );
  }

  const pincode =
    (await reverseGeocodeBigDataCloud(coords.lat, coords.lng)) ??
    (await reverseGeocodeNominatim(coords.lat, coords.lng));

  if (!pincode) {
    return NextResponse.json(
      {
        success: false,
        error: "Could not find an Indian pincode for this location.",
        code: "no_pincode",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    pincode,
  });
}

import {
  isValidPincodeFormat,
  normalizePincodeInput,
} from "@/lib/pincodeDelivery";

const DELIVERY_PINCODE_STORAGE_KEY = "pj-delivery-pincode";
const DELIVERY_LOCATION_INIT_KEY = "pj-delivery-location-init";
const DELIVERY_LOCATION_DENIED_KEY = "pj-delivery-location-denied";

export type DeliveryLocationStatus =
  | "idle"
  | "locating"
  | "ready"
  | "denied"
  | "unsupported"
  | "unavailable";

export type DeliveryLocationError = {
  message: string;
  code:
    | "unsupported"
    | "denied"
    | "unavailable"
    | "timeout"
    | "network"
    | "no_pincode"
    | "invalid";
};

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function readSavedDeliveryPincode(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const saved = sessionStorage.getItem(DELIVERY_PINCODE_STORAGE_KEY);
    const normalized = saved ? normalizePincodeInput(saved) : "";
    return isValidPincodeFormat(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function hasAttemptedDeliveryLocation(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return sessionStorage.getItem(DELIVERY_LOCATION_INIT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markDeliveryLocationAttempted(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(DELIVERY_LOCATION_INIT_KEY, "1");
  } catch {
    // ignore
  }
}

export function wasDeliveryLocationDenied(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return sessionStorage.getItem(DELIVERY_LOCATION_DENIED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markDeliveryLocationDenied(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(DELIVERY_LOCATION_DENIED_KEY, "1");
  } catch {
    // ignore
  }
}

export function writeSavedDeliveryPincode(pincode: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = normalizePincodeInput(pincode);
  if (!isValidPincodeFormat(normalized)) {
    return;
  }
  try {
    sessionStorage.setItem(DELIVERY_PINCODE_STORAGE_KEY, normalized);
  } catch {
    // ignore quota / private mode
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(
        Object.assign(new Error("Geolocation is not supported."), {
          code: 0,
        })
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

function mapGeolocationError(error: GeolocationPositionError): DeliveryLocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        message: "Location permission was denied.",
        code: "denied",
      };
    case error.POSITION_UNAVAILABLE:
      return {
        message: "Your location is unavailable.",
        code: "unavailable",
      };
    case error.TIMEOUT:
      return {
        message: "Location request timed out.",
        code: "timeout",
      };
    default:
      return {
        message: "Unable to read your location.",
        code: "unavailable",
      };
  }
}

export async function fetchPincodeFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string | DeliveryLocationError> {
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
    });
    const response = await fetch(`/api/geocode/reverse?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      return {
        message:
          typeof data?.error === "string"
            ? data.error
            : "Unable to detect pincode from your location.",
        code: data?.code === "no_pincode" ? "no_pincode" : "network",
      };
    }

    const pincode = normalizePincodeInput(
      typeof data?.pincode === "string" ? data.pincode : ""
    );
    if (!isValidPincodeFormat(pincode)) {
      return {
        message: "Could not find a valid pincode for your location.",
        code: "no_pincode",
      };
    }

    return pincode;
  } catch {
    return {
      message: "Network error while detecting location.",
      code: "network",
    };
  }
}

export async function getGeolocationPermissionState(): Promise<
  PermissionState | "unsupported"
> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unsupported";
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state;
  } catch {
    return "unsupported";
  }
}

/** True when we should skip calling getCurrentPosition (browser already denied). */
export async function isDeliveryLocationBlocked(): Promise<boolean> {
  const permission = await getGeolocationPermissionState();
  if (permission === "denied") {
    return true;
  }
  if (permission === "unsupported" && wasDeliveryLocationDenied()) {
    return true;
  }
  return false;
}

/** Triggers the browser location permission prompt (Allow / Block). */
export async function requestDeliveryPincodeFromGeolocation(): Promise<
  { pincode: string; source: "geolocation" } | DeliveryLocationError
> {
  if (!isGeolocationSupported()) {
    return {
      message: "Location is not supported on this device.",
      code: "unsupported",
    };
  }

  try {
    const position = await getCurrentPosition();
    const pincodeResult = await fetchPincodeFromCoordinates(
      position.coords.latitude,
      position.coords.longitude
    );

    if (typeof pincodeResult !== "string") {
      return pincodeResult;
    }

    writeSavedDeliveryPincode(pincodeResult);
    return { pincode: pincodeResult, source: "geolocation" };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const mapped = mapGeolocationError(error as GeolocationPositionError);
      if (mapped.code === "denied") {
        markDeliveryLocationDenied();
      }
      return mapped;
    }
    return {
      message: "Unable to read your location.",
      code: "unavailable",
    };
  }
}

type SiteDeliveryLocationResult =
  | { pincode: string; source: "saved" | "geolocation" }
  | DeliveryLocationError;

let siteDeliveryLocationPromise: Promise<SiteDeliveryLocationResult> | null =
  null;

/**
 * Runs once per page load when the site opens. Shows the native browser
 * location permission dialog (same as lapinozpizza.in store-locator).
 */
export async function fetchDeliveryPincodeFromIp(): Promise<string | null> {
  try {
    const response = await fetch("/api/delivery/location-from-ip", {
      cache: "no-store",
    });
    const data = (await response.json()) as {
      success?: boolean;
      pincode?: string;
    };

    if (!response.ok || !data?.success) {
      return null;
    }

    const pincode = normalizePincodeInput(
      typeof data.pincode === "string" ? data.pincode : ""
    );
    return isValidPincodeFormat(pincode) ? pincode : null;
  } catch {
    return null;
  }
}

export function initSiteDeliveryLocationOnce(): Promise<SiteDeliveryLocationResult> {
  const saved = readSavedDeliveryPincode();
  if (saved) {
    return Promise.resolve({ pincode: saved, source: "saved" });
  }

  if (siteDeliveryLocationPromise) {
    return siteDeliveryLocationPromise;
  }

  siteDeliveryLocationPromise = (async () => {
    if (await isDeliveryLocationBlocked()) {
      return {
        message: "Location permission was denied.",
        code: "denied",
      };
    }

    const resolved = await requestDeliveryPincodeFromGeolocation();
    markDeliveryLocationAttempted();
    return resolved;
  })();

  return siteDeliveryLocationPromise;
}

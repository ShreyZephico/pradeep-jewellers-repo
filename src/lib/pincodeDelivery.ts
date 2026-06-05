export type PincodePostOffice = {
  Name: string;
  State: string;
  District: string;
  Region?: string;
  Pincode: string;
  DeliveryStatus?: string;
};

export type PincodeLookupResult = {
  pincode: string;
  district: string;
  state: string;
  areaLabel: string;
  isGujarat: boolean;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  deliveryRegionLabel: string;
};

export type PincodeLookupError = {
  message: string;
  code: "invalid" | "not_found" | "upstream" | "network";
};

export const GUJARAT_DELIVERY_DAYS = { min: 5, max: 7 } as const;
export const REST_OF_INDIA_DELIVERY_DAYS = { min: 9, max: 13 } as const;

const GUJARAT_DELIVERY = {
  ...GUJARAT_DELIVERY_DAYS,
  label: "Gujarat",
} as const;
const INDIA_DELIVERY = {
  ...REST_OF_INDIA_DELIVERY_DAYS,
  label: "Rest of India",
} as const;

export function normalizePincodeInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export function isValidPincodeFormat(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

function isGujaratState(state: string): boolean {
  const normalized = state.trim().toLowerCase().replace(/\s+/g, " ");
  return normalized === "gujarat" || normalized === "gujrat";
}

export function getDeliveryWindowForState(state: string): {
  min: number;
  max: number;
  regionLabel: string;
  isGujarat: boolean;
} {
  const isGujarat = isGujaratState(state);
  const window = isGujarat ? GUJARAT_DELIVERY : INDIA_DELIVERY;
  return {
    min: window.min,
    max: window.max,
    regionLabel: window.label,
    isGujarat,
  };
}

export function formatDeliveryDays(min: number, max: number): string {
  return `${min}–${max} days`;
}

export function formatDeliveryEstimateSummary(
  result: Pick<
    PincodeLookupResult,
    "isGujarat" | "deliveryDaysMin" | "deliveryDaysMax" | "deliveryRegionLabel"
  >
): { headline: string; regionNote: string; daysLabel: string } {
  const daysLabel = formatDeliveryDays(
    result.deliveryDaysMin,
    result.deliveryDaysMax
  );

  if (result.isGujarat) {
    return {
      daysLabel,
      headline: `Free delivery in ${daysLabel}`,
      regionNote: "Within Gujarat",
    };
  }

  return {
    daysLabel,
    headline: `Delivery in ${daysLabel}`,
    regionNote: result.deliveryRegionLabel,
  };
}

export function formatEstimatedDeliveryDate(minDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + minDays);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

type PostalApiEntry = {
  Message?: string;
  Status?: string;
  PostOffice?: PincodePostOffice[] | null;
};

export function parsePostalPincodeResponse(
  pincode: string,
  payload: unknown
): PincodeLookupResult | PincodeLookupError {
  if (!Array.isArray(payload) || payload.length === 0) {
    return { message: "Invalid pincode response.", code: "upstream" };
  }

  const entry = payload[0] as PostalApiEntry;
  if (entry.Status !== "Success" || !entry.PostOffice?.length) {
    return {
      message: "We could not find this pincode. Please check and try again.",
      code: "not_found",
    };
  }

  const offices = entry.PostOffice;
  const preferred =
    offices.find((office) => office.DeliveryStatus === "Delivery") ??
    offices[0];

  const district = preferred.District?.trim() || "";
  const state = preferred.State?.trim() || "";
  if (!district || !state) {
    return {
      message: "Location details are unavailable for this pincode.",
      code: "not_found",
    };
  }

  const delivery = getDeliveryWindowForState(state);

  return {
    pincode,
    district,
    state,
    areaLabel: `${district}, ${state}`,
    isGujarat: delivery.isGujarat,
    deliveryDaysMin: delivery.min,
    deliveryDaysMax: delivery.max,
    deliveryRegionLabel: delivery.regionLabel,
  };
}

export async function fetchPincodeLookup(
  pincode: string
): Promise<PincodeLookupResult | PincodeLookupError> {
  if (!isValidPincodeFormat(pincode)) {
    return {
      message: "Enter a valid 6-digit Indian pincode.",
      code: "invalid",
    };
  }

  try {
    const response = await fetch(`/api/pincode/${pincode}`, {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      const message =
        typeof data?.error === "string"
          ? data.error
          : "Unable to check delivery for this pincode.";
      return {
        message,
        code: data?.code === "invalid" ? "invalid" : "upstream",
      };
    }

    if (data?.success && data?.result) {
      return data.result as PincodeLookupResult;
    }

    return {
      message:
        typeof data?.error === "string"
          ? data.error
          : "Unable to check delivery for this pincode.",
      code: "upstream",
    };
  } catch {
    return {
      message: "Network error. Please try again.",
      code: "network",
    };
  }
}

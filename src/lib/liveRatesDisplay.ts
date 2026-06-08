import contactData from "@/data/contactDatas.json";

import type { GoldRateApiResponse, MetalRateItem } from "@/types/goldRate";

/** Homepage ticker / hero display order (22K + 14K + 18K + silver). */
export const LIVE_RATE_KEYS = [
  "gold22k",
  "gold14k",
  "gold18k",
  "silver1kg",
] as const;

export type LiveRateKey = (typeof LIVE_RATE_KEYS)[number];

type RateUiConfig = {
  label: string;
  unitSuffix: string;
  fractionDigits: number;
};

export type LiveRateDisplayItem = {
  key: LiveRateKey;
  label: string;
  unitSuffix: string;
  fractionDigits: number;
  rate?: MetalRateItem;
  optional: boolean;
};

function getRateUiConfig(key: LiveRateKey): RateUiConfig | null {
  const rates = contactData.heroSection.rates;
  const config = rates[key as keyof typeof rates];
  if (!config || typeof config !== "object" || !("label" in config)) {
    return null;
  }

  return {
    label: config.label,
    unitSuffix: config.unitSuffix ?? "",
    fractionDigits: config.fractionDigits ?? 2,
  };
}

/** Build ticker/hero items from API payload; optional 14K/18K hide when not saved yet. */
export function buildLiveRateDisplayItems(
  live: GoldRateApiResponse["data"] | undefined,
  options?: { includeOptionalWithoutRate?: boolean }
): LiveRateDisplayItem[] {
  const includeOptionalWithoutRate = options?.includeOptionalWithoutRate ?? false;

  return LIVE_RATE_KEYS.flatMap((key) => {
    const config = getRateUiConfig(key);
    if (!config) return [];

    const optional = key === "gold14k" || key === "gold18k";
    const rate = live?.[key];

    if (optional && !rate && !includeOptionalWithoutRate) {
      return [];
    }

    return [
      {
        key,
        label: config.label,
        unitSuffix: config.unitSuffix,
        fractionDigits: config.fractionDigits,
        rate,
        optional,
      },
    ];
  });
}

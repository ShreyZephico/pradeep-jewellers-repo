/** Clearance countdown config from contactDatas.json */
export type ClearanceCountdownConfig = {
  /** Exact end (ISO 8601). Overrides daysLeft when set. */
  endsAt?: string;
  /** How many days the timer runs (e.g. 3 → starts at 03 days, 00 hrs, …). */
  daysLeft?: number;
  daysLabel?: string;
  hoursLabel?: string;
  minutesLabel?: string;
  secondsLabel?: string;
  expiredMessage?: string;
};

export type ClearancePanelCountdownSource = {
  endsAt?: string;
  daysLeft?: number;
  daysLabel?: string;
  hoursLabel?: string;
  minutesLabel?: string;
  secondsLabel?: string;
  countdown?: ClearanceCountdownConfig;
};

export type ResolvedClearanceCountdown = {
  endsAt: string | undefined;
  daysLeft: number | undefined;
  daysLabel: string;
  hoursLabel: string;
  minutesLabel: string;
  secondsLabel: string;
  expiredMessage: string;
  isConfigured: boolean;
};

const DEFAULT_LABELS = {
  daysLabel: "DAYS",
  hoursLabel: "HRS",
  minutesLabel: "MIN",
  secondsLabel: "SEC",
  expiredMessage: "Sale ended",
} as const;

const MS_PER_DAY = 86_400_000;
const STORAGE_PREFIX = "pj-clearance-countdown-end";

function normalizeDaysLeft(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

export function resolveClearanceCountdown(
  panel: ClearancePanelCountdownSource
): ResolvedClearanceCountdown {
  const nested = panel.countdown;
  const endsAt = nested?.endsAt?.trim() || panel.endsAt?.trim() || undefined;
  const daysLeft =
    normalizeDaysLeft(nested?.daysLeft) ?? normalizeDaysLeft(panel.daysLeft);

  return {
    endsAt,
    daysLeft,
    daysLabel: nested?.daysLabel ?? panel.daysLabel ?? DEFAULT_LABELS.daysLabel,
    hoursLabel: nested?.hoursLabel ?? panel.hoursLabel ?? DEFAULT_LABELS.hoursLabel,
    minutesLabel:
      nested?.minutesLabel ?? panel.minutesLabel ?? DEFAULT_LABELS.minutesLabel,
    secondsLabel:
      nested?.secondsLabel ?? panel.secondsLabel ?? DEFAULT_LABELS.secondsLabel,
    expiredMessage:
      nested?.expiredMessage?.trim() || DEFAULT_LABELS.expiredMessage,
    isConfigured: Boolean(endsAt) || daysLeft !== undefined,
  };
}

export function parseEndsAtMs(iso: string | undefined): number | null {
  if (!iso?.trim()) return null;
  const ms = Date.parse(iso.trim());
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Resolves countdown end time on the client.
 * - endsAt: fixed datetime from JSON
 * - daysLeft: now + N full days (first visit stores end so refresh does not reset)
 */
export function resolveCountdownEndMs(
  config: ResolvedClearanceCountdown
): number | null {
  const fromIso = parseEndsAtMs(config.endsAt);
  if (fromIso !== null) return fromIso;

  const days = config.daysLeft;
  if (days === undefined) return null;

  if (typeof window === "undefined") return null;

  const storageKey = `${STORAGE_PREFIX}:${days}`;
  const stored = sessionStorage.getItem(storageKey);
  if (stored) {
    const parsed = Number(stored);
    if (!Number.isNaN(parsed) && parsed > Date.now()) {
      return parsed;
    }
  }

  const endMs = Date.now() + days * MS_PER_DAY;
  sessionStorage.setItem(storageKey, String(endMs));
  return endMs;
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
};

export function msToCountdownParts(remainingMs: number): CountdownParts {
  const totalMs = Math.max(0, remainingMs);
  const sec = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
    isExpired: totalMs <= 0,
  };
}

export function padCountdownUnit(n: number): string {
  return String(n).padStart(2, "0");
}

/** Max % shown for daily metal rate moves (landing ticker / header). */
export const MAX_METAL_RATE_PERCENT = 100;

/** Reject baselines that look like a different unit or corrupt row (e.g. 10× jump). */
const MIN_COMPARABLE_RATIO = 0.5;
const MAX_COMPARABLE_RATIO = 2;

export function pricesAreComparable(current: number, baseline: number): boolean {
  if (!Number.isFinite(current) || !Number.isFinite(baseline)) return false;
  if (baseline <= 0 || current <= 0) return false;
  const ratio = current / baseline;
  return ratio >= MIN_COMPARABLE_RATIO && ratio <= MAX_COMPARABLE_RATIO;
}

export function clampMetalPercentChange(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  const rounded = Number(percent.toFixed(2));
  return Math.min(
    MAX_METAL_RATE_PERCENT,
    Math.max(-MAX_METAL_RATE_PERCENT, rounded)
  );
}

export function computeMetalPercentChange(current: number, old: number): number {
  if (old <= 0 || current <= 0) return 0;
  return clampMetalPercentChange(((current - old) / old) * 100);
}

/** Pick a historical day comparable to today; falls back to today (0% change). */
export function pickComparableBaselineDay(
  sortedDays: string[],
  priceForDay: (day: string) => number,
  compareDays: number
): string {
  if (!sortedDays.length) return "";

  const currentDay = sortedDays[sortedDays.length - 1];
  const currentPrice = priceForDay(currentDay);
  const startIndex = Math.max(0, sortedDays.length - 1 - compareDays);

  for (let i = startIndex; i >= 0; i--) {
    const day = sortedDays[i];
    if (day === currentDay) continue;
    const baseline = priceForDay(day);
    if (pricesAreComparable(currentPrice, baseline)) {
      return day;
    }
  }

  return currentDay;
}

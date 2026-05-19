export function formatInr(
  amount: number,
  maximumFractionDigits = 0
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(amount);
}

export function formatDifference(difference: number): string {
  const abs = Math.abs(difference);
  const decimals = abs > 0 && abs < 10 && !Number.isInteger(abs) ? 2 : 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(abs);
  if (difference > 0) return `+${formatted}`;
  if (difference < 0) return `-${formatted}`;
  return "0";
}

const IST = "Asia/Kolkata";

/** Format DB ISO timestamp for display (e.g. "19 May 2026 at 2:28 pm"). */
export function formatRateTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatPercentChange(percent: number): string {
  const abs = Math.abs(percent);
  const decimals = abs > 0 && abs < 10 && !Number.isInteger(abs) ? 2 : 1;
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(abs);
  if (percent > 0) return `+${formatted}%`;
  if (percent < 0) return `-${formatted}%`;
  return "0%";
}

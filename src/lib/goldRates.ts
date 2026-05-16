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

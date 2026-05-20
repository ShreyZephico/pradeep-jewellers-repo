/** 10-digit Indian mobile national number, or null if invalid. */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  let national = "";
  if (digits.length === 10) {
    national = digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    national = digits.slice(1);
  } else {
    return null;
  }

  if (!/^[6-9]\d{9}$/.test(national)) {
    return null;
  }

  return national;
}

export function toIndianE164(national: string): string {
  return `+91${national}`;
}

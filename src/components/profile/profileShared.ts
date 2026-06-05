export type CustomerAddress = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  province?: string | null;
  country: string;
  zip: string;
  phone?: string | null;
};

export type CustomerProfile = {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  acceptsMarketing: boolean;
  defaultAddress: CustomerAddress | null;
  addresses: CustomerAddress[];
};

export type AddressFormState = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
};

export const EMPTY_ADDRESS: AddressFormState = {
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  country: "IN",
  zip: "",
  phone: "",
};

export type AccountSection = "profile" | "addresses" | "orders";

export function displayName(profile: CustomerProfile | null): string {
  if (!profile) return "Guest";
  const full = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || profile.displayName || profile.email.split("@")[0] || "Guest";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function formatAddress(address: CustomerAddress): string {
  const lines = [
    [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.company,
    address.address1,
    address.address2,
    [address.city, address.province, address.zip].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ].filter(Boolean);
  return lines.join("\n");
}

export function addressToForm(
  address: CustomerAddress | null,
  profile: CustomerProfile | null
): AddressFormState {
  if (!address) {
    return {
      ...EMPTY_ADDRESS,
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      phone: profile?.phone ?? "",
    };
  }

  return {
    firstName: address.firstName ?? "",
    lastName: address.lastName ?? "",
    address1: address.address1,
    address2: address.address2 ?? "",
    city: address.city,
    province: address.province ?? "",
    country: address.country || "IN",
    zip: address.zip,
    phone: address.phone ?? "",
  };
}

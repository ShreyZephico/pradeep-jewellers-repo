/** Jewellery-only Unsplash IDs (no people). */
export const JEWELLERY_PHOTO = {
  ring: "photo-1605100804763-247f67b3557e",
  necklace: "photo-1599643478518-a784e5dc4c8f",
  goldSet: "photo-1617038220319-276d3cfab638",
  earrings: "photo-1635767798638-3e25273a8236",
  ringsGroup: "photo-1515562141207-7a88fb7ce338",
  gemstone: "photo-1611085583191-a3b181a88401",
  display: "photo-1603974372039-adc49044b6bd",
  bangle: "photo-1611652022419-a9419f74343d",
  case: "photo-1533734685302-aee5a945845a",
  showroom: "photo-1601925260368-ae2f83b8a168",
  temple: "photo-1617038260897-41a1f14a8ca0",
  handRing: "photo-1603561596112-0a132b757442",
  silver: "photo-1611591437281-4605be9940a0",
} as const;

export const PLACEHOLDER_AVATAR = "/images/placeholders/avatar.svg";
export const PLACEHOLDER_JEWELLERY = "/images/placeholders/jewellery.svg";

export type PlaceholderImageWidth =
  | 200
  | 400
  | 600
  | 800
  | 1200
  | 1600
  | 1920
  | 2400;

export function jewelleryImageUrl(
  photoId: string,
  width: PlaceholderImageWidth = 1200
): string {
  return `https://images.unsplash.com/${photoId}?q=80&w=${width}&auto=format&fit=crop`;
}

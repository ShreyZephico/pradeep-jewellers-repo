import raw from "@/data/bespokedata.json";
import {
  JEWELLERY_PHOTO,
  PLACEHOLDER_AVATAR,
  jewelleryImageUrl,
} from "@/lib/placeholderImages";

export type BespokeGalleryItem = {
  id: string;
  title: string;
  alt: string;
  image: string;
};

export type BespokeGalleryRow = {
  id: string;
  direction: "ltr" | "rtl";
  items: BespokeGalleryItem[];
};

export type BespokeCategoryId = "ring" | "necklace" | "earrings";

type BespokeDataRaw = typeof raw;

const data = raw as BespokeDataRaw;

export function bespokeImageUrl(
  photoId: string,
  width: 400 | 600 | 800 | 1200 | 1920 = 600
): string {
  return jewelleryImageUrl(photoId, width);
}

function mapGalleryItem(
  item: BespokeDataRaw["gallery"]["rows"][0]["items"][0]
): BespokeGalleryItem {
  return {
    id: item.id,
    title: item.title,
    alt: item.alt,
    image: bespokeImageUrl(item.photoId, 600),
  };
}

export const BESPOKE_IMAGE_FALLBACK = bespokeImageUrl(data.imageFallbackPhotoId, 600);

export const BESPOKE_HERO = {
  headline: data.hero.headline,
  subheadline: data.hero.subheadline,
  cta: data.hero.cta,
  secondaryCta: data.hero.secondaryCta,
  secondaryCtaHref: data.hero.secondaryCtaHref,
  image: bespokeImageUrl(data.hero.photoId, 1920),
  imageAlt: data.hero.imageAlt,
};

export const BESPOKE_GALLERY_SECTION = {
  eyebrow: data.gallery.eyebrow,
  title: data.gallery.title,
  lead: data.gallery.lead,
  footnote: data.gallery.footnote,
};

export const BESPOKE_GALLERY_ROWS: BespokeGalleryRow[] = data.gallery.rows.map((row) => ({
  id: row.id,
  direction: row.direction === "rtl" ? "rtl" : "ltr",
  items: row.items.map(mapGalleryItem),
}));

/** @deprecated Use BESPOKE_GALLERY_ROWS */
export const BESPOKE_GALLERY: BespokeGalleryItem[] = BESPOKE_GALLERY_ROWS.flatMap(
  (row) => row.items
);

export const BESPOKE_PROCESS_SECTION = {
  eyebrow: data.process.eyebrow,
  title: data.process.title,
  lead: data.process.lead,
};

export const BESPOKE_PROCESS = data.process.steps.map((step) => ({
  step: step.step,
  title: step.title,
  body: step.body,
  image: bespokeImageUrl(step.photoId, 400),
  imageAlt: step.imageAlt,
}));

export const BESPOKE_FORM_SECTION = {
  eyebrow: data.form.eyebrow,
  title: data.form.title,
  lead: data.form.lead,
  submitLabel: data.form.submitLabel,
  nextLabel: data.form.nextLabel,
  backLabel: data.form.backLabel,
  fileUploadNote: data.form.fileUploadNote,
  fileUploadHint: data.form.fileUploadHint,
  uploadingLabel: data.form.uploadingLabel,
  trustBadges: data.form.trustBadges,
  whatsappIntro: data.form.whatsappIntro,
  steps: data.form.steps,
};

export const BESPOKE_FORM_IMAGE = bespokeImageUrl(data.form.photoId, 800);
export const BESPOKE_FORM_IMAGE_ALT = data.form.imageAlt;
export const BESPOKE_JEWELLERY_TYPES = data.form.jewelleryTypes;
export const BESPOKE_METALS = data.form.metals;
export const BESPOKE_GEMSTONES = data.form.gemstones;
export const BESPOKE_STYLES = [
  {
    label: "Traditional",
    image: bespokeImageUrl(JEWELLERY_PHOTO.earrings, 600),
  },
  {
    label: "Contemporary",
    image: bespokeImageUrl("photo-1611085583191-a3b181a88401", 600),
  },
  {
    label: "Minimal",
    image: bespokeImageUrl("photo-1515562141207-7a88fb7ce338", 600),
  },
] as const;

export const BESPOKE_CATEGORIES: Array<{
  id: BespokeCategoryId;
  label: string;
  priceFrom: string;
  image: string;
  imageAlt: string;
}> = [
  {
    id: "ring",
    label: "Rings",
    priceFrom: "From ₹25,000",
    image: bespokeImageUrl("photo-1605100804763-247f67b3557e", 800),
    imageAlt: "Custom ring design",
  },
  {
    id: "necklace",
    label: "Necklaces",
    priceFrom: "From ₹60,000",
    image: bespokeImageUrl("photo-1599643478518-a784e5dc4c8f", 800),
    imageAlt: "Custom necklace design",
  },
  {
    id: "earrings",
    label: "Earrings",
    priceFrom: "From ₹18,000",
    image: bespokeImageUrl("photo-1635767798638-3e25273a8236", 800),
    imageAlt: "Custom earrings design",
  },
];
export const BESPOKE_PRICING_ROWS: Array<{
  type: string;
  metal: string;
  price: string;
}> = [
  { type: "Engagement ring", metal: "18K Gold", price: "From ₹35,000" },
  { type: "Wedding band", metal: "22K Gold", price: "From ₹25,000" },
  { type: "Solitaire ring", metal: "18K Gold + diamond", price: "From ₹75,000" },
  { type: "Necklace / choker", metal: "22K Gold", price: "From ₹60,000" },
  { type: "Pendant", metal: "18K Gold", price: "From ₹30,000" },
  { type: "Stud earrings", metal: "18K Gold", price: "From ₹18,000" },
  { type: "Jhumka / chandelier", metal: "22K Gold", price: "From ₹45,000" },
  { type: "Bracelet / bangle", metal: "22K Gold", price: "From ₹50,000" },
];

export const BESPOKE_WHY_US: Array<{
  title: string;
  body: string;
  icon: string;
}> = [
  {
    icon: "◆",
    title: "Hallmarked gold",
    body: "BIS-certified purity on every piece — weighed and documented before you approve.",
  },
  {
    icon: "✦",
    title: "Free 3D previews",
    body: "See your design in detail before we craft. Revisions included until you love it.",
  },
  {
    icon: "⚒",
    title: "Master karigars",
    body: "Four decades of bench craft — traditional techniques with modern finishing.",
  },
  {
    icon: "₹",
    title: "Transparent pricing",
    body: "Metal, making charges, and stones broken down clearly — no hidden fees.",
  },
  {
    icon: "↺",
    title: "Old gold exchange",
    body: "Redesign heirloom pieces or apply old gold value toward your new commission.",
  },
  {
    icon: "📦",
    title: "Insured delivery",
    body: "Collect in Nadiad or arrange insured delivery across Gujarat and India with secure packaging.",
  },
];

export const BESPOKE_TESTIMONIALS: Array<{
  name: string;
  rating: number;
  text: string;
  image: string;
}> = [
  {
    name: "Priya S.",
    rating: 5,
    text: "Shared a Pinterest photo and got a gorgeous mangalsutra made in 2 weeks. Responsive on WhatsApp.",
    image: PLACEHOLDER_AVATAR,
  },
  {
    name: "Rohan M.",
    rating: 5,
    text: "They matched my ring size perfectly and gave clarity on gold weight before production.",
    image: PLACEHOLDER_AVATAR,
  },
  {
    name: "Hetal P.",
    rating: 5,
    text: "Transparent pricing, quick estimate, and the craftsmanship is superb.",
    image: PLACEHOLDER_AVATAR,
  },
  {
    name: "Kiran & Meera",
    rating: 5,
    text: "From WhatsApp quote to pickup in Nadiad — specs were clear and the finish was exactly what we discussed.",
    image: PLACEHOLDER_AVATAR,
  },
];

export const BESPOKE_BUDGET_OPTIONS = data.form.budgetOptions;
export const BESPOKE_CONTACT_METHODS = data.form.contactMethods;

export const BESPOKE_FAQ_SECTION = {
  eyebrow: data.faq.eyebrow,
  title: data.faq.title,
};

export const BESPOKE_FAQ = data.faq.items;

export const BESPOKE_FINAL_CTA = {
  headline: data.finalCta.headline,
  subtext: data.finalCta.subtext,
  cta: data.finalCta.cta,
  image: bespokeImageUrl(data.finalCta.photoId, 1920),
};

export const BESPOKE_STICKY_BAR = data.stickyBar;

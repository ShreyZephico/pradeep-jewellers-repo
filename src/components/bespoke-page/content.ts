import raw from "@/data/bespokedata.json";

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

type BespokeDataRaw = typeof raw;

const data = raw as BespokeDataRaw;

export function bespokeImageUrl(
  photoId: string,
  width: 400 | 600 | 800 | 1200 | 1920 = 600
): string {
  return `https://images.unsplash.com/${photoId}?q=80&w=${width}&auto=format&fit=crop`;
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
  direction: row.direction,
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

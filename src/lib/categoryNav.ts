import productContent from "@/lib/productContent";

export type CategoryNavLink = {
  label: string;
  href: string;
};

export type CategoryNavMetalLink = CategoryNavLink & {
  swatch?: "gold" | "rose" | "white" | "platinum" | "diamond" | "pearl" | "gem";
};

export type CategoryNavPromo = {
  label: string;
  href: string;
  image: string;
  imageAlt: string;
};

export type CategoryNavItem = {
  id: string;
  label: string;
  pluralLabel: string;
  featured: CategoryNavLink[];
  styles: CategoryNavLink[];
  metals: CategoryNavMetalLink[];
  prices: CategoryNavLink[];
  audiences: CategoryNavLink[];
  promos: CategoryNavPromo[];
};

const priceTiers = productContent.priceTiers.filter((t) => t.id !== "any");

/** Same URL shape as contactDatas / bespoke (verified 200 responses). */
function unsplashPhoto(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?q=80&w=560&auto=format&fit=crop`;
}

/** Two jewellery Unsplash photos per category — IDs from site content. */
const CATEGORY_NAV_PHOTOS: Record<string, readonly [string, string]> = {
  ring: [
    "photo-1605100804763-247f67b3557e",
    "photo-1611652022419-a9419f74343d",
  ],
  earring: [
    "photo-1599643478518-a784e5dc4c8f",
    "photo-1617038220319-276d3cfab638",
  ],
  bracelet: [
    "photo-1611085583191-a3b181a88401",
    "photo-1635767798638-3e25273a8236",
  ],
  bangle: [
    "photo-1515562141207-7a88fb7ce338",
    "photo-1605100804763-247f67b3557e",
  ],
  necklace: [
    "photo-1617038220319-276d3cfab638",
    "photo-1599643478518-a784e5dc4c8f",
  ],
  pendant: [
    "photo-1611652022419-a9419f74343d",
    "photo-1603561591411-07134e71a2a9",
  ],
  mangalsutra: [
    "photo-1603974372039-adc49044b6bd",
    "photo-1617038220319-276d3cfab638",
  ],
  chain: [
    "photo-1515562141207-7a88fb7ce338",
    "photo-1605100804763-247f67b3557e",
  ],
  anklet: [
    "photo-1599643478518-a784e5dc4c8f",
    "photo-1611085583191-a3b181a88401",
  ],
  kada: [
    "photo-1515562141207-7a88fb7ce338",
    "photo-1635767798638-3e25273a8236",
  ],
  charm: [
    "photo-1611652022419-a9419f74343d",
    "photo-1603561591411-07134e71a2a9",
  ],
  "nose-pin": [
    "photo-1599643478518-a784e5dc4c8f",
    "photo-1611652022419-a9419f74343d",
  ],
  "necklace-set": [
    "photo-1617038220319-276d3cfab638",
    "photo-1603974372039-adc49044b6bd",
  ],
  "pendant-set": [
    "photo-1603561591411-07134e71a2a9",
    "photo-1611652022419-a9419f74343d",
  ],
};

export function buildProductsListUrl(
  category: string,
  extra?: { price?: string; sort?: string; q?: string }
): string {
  const params = new URLSearchParams();
  if (category && category !== "all") {
    params.set("category", category);
  }
  if (extra?.price && extra.price !== "any") {
    params.set("price", extra.price);
  }
  if (extra?.sort && extra.sort !== "featured") {
    params.set("sort", extra.sort);
  }
  if (extra?.q?.trim()) {
    params.set("q", extra.q.trim());
  }
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

const SHARED_METALS: CategoryNavMetalLink[] = [
  { label: "Diamond", href: buildProductsListUrl("diamond"), swatch: "diamond" },
  { label: "Pearl", href: buildProductsListUrl("gemstone"), swatch: "pearl" },
  { label: "Gemstone", href: buildProductsListUrl("gemstone"), swatch: "gem" },
  { label: "Yellow Gold", href: buildProductsListUrl("gold"), swatch: "gold" },
  { label: "Rose Gold", href: buildProductsListUrl("gold"), swatch: "rose" },
  { label: "White Gold", href: buildProductsListUrl("gold"), swatch: "white" },
  { label: "Silver", href: buildProductsListUrl("silver"), swatch: "platinum" },
];

function priceLinks(categoryId: string): CategoryNavLink[] {
  return priceTiers.map((tier) => ({
    label: tier.label,
    href: buildProductsListUrl(categoryId, { price: tier.id }),
  }));
}

function baseFeatured(id: string, plural: string): CategoryNavLink[] {
  return [
    { label: "Latest designs", href: buildProductsListUrl(id) },
    { label: "Bestsellers", href: buildProductsListUrl(id, { sort: "featured" }) },
    { label: "View all", href: buildProductsListUrl(id) },
  ];
}

function audiences(id: string): CategoryNavLink[] {
  return [
    { label: "For women", href: buildProductsListUrl(id) },
    { label: "For men", href: buildProductsListUrl(id) },
    { label: "For kids", href: buildProductsListUrl(id) },
  ];
}

function defaultPromos(
  id: string,
  pluralLabel: string,
  labels?: [string, string]
): CategoryNavPromo[] {
  const photos = CATEGORY_NAV_PHOTOS[id];
  if (!photos) {
    return [];
  }

  const [labelA, labelB] = labels ?? [`Shop ${pluralLabel}`, "New arrivals"];

  return [
    {
      label: labelA,
      href: buildProductsListUrl(id),
      image: unsplashPhoto(photos[0]),
      imageAlt: `${labelA} — ${pluralLabel}`,
    },
    {
      label: labelB,
      href: buildProductsListUrl(id),
      image: unsplashPhoto(photos[1]),
      imageAlt: `${labelB} — ${pluralLabel}`,
    },
  ];
}

function item(
  id: string,
  label: string,
  pluralLabel: string,
  styles: string[],
  promoLabels?: [string, string]
): CategoryNavItem {
  const styleLinks: CategoryNavLink[] = [
    { label: `All ${pluralLabel}`, href: buildProductsListUrl(id) },
    ...styles.map((s) => ({
      label: s,
      href: buildProductsListUrl(id, { q: s }),
    })),
  ];

  return {
    id,
    label,
    pluralLabel,
    featured: baseFeatured(id, pluralLabel),
    styles: styleLinks,
    metals: SHARED_METALS,
    prices: priceLinks(id),
    audiences: audiences(id),
    promos: defaultPromos(id, pluralLabel, promoLabels),
  };
}

/** Primary shop-by-category row (matches catalog product types). */
export const CATEGORY_NAV_ITEMS: CategoryNavItem[] = [
  item(
    "ring",
    "Ring",
    "Rings",
    ["Engagement", "Daily wear", "Solitaire", "Couple bands", "Promise rings"],
    ["Message bands", "New arrivals"]
  ),
  item("earring", "Earring", "Earrings", ["Studs", "Hoops", "Drops", "Jhumkas"], [
    "Gold studs",
    "New arrivals",
  ]),
  item("bracelet", "Bracelet", "Bracelets", ["Tennis", "Chain", "Cuff"], [
    "Tennis styles",
    "New arrivals",
  ]),
  item("bangle", "Bangle", "Bangles", ["Daily wear", "Festive", "Kada style"], [
    "Festive bangles",
    "New arrivals",
  ]),
  item("necklace", "Necklace", "Necklaces", ["Chains", "Chokers", "Layered"], [
    "Statement pieces",
    "New arrivals",
  ]),
  item("pendant", "Pendant", "Pendants", ["Solitaire", "Religious", "Initial"], [
    "Signature pendants",
    "New arrivals",
  ]),
  item("mangalsutra", "Mangalsutra", "Mangalsutras", [
    "Traditional",
    "Contemporary",
    "Diamond",
  ], ["Traditional", "New arrivals"]),
  item("chain", "Chain", "Chains", ["Gold chain", "Box chain", "Rope chain"], [
    "Gold chains",
    "New arrivals",
  ]),
  item("anklet", "Anklet", "Anklets", ["Delicate", "Charm", "Traditional"], [
    "Delicate anklets",
    "New arrivals",
  ]),
  item("kada", "Kada", "Kadas", ["Men's", "Women's", "Plain gold"], [
    "Men's kadas",
    "New arrivals",
  ]),
  item("charm", "Charm", "Charms", ["Gold", "Silver", "Enamel"], [
    "Charm collection",
    "New arrivals",
  ]),
  item("nose-pin", "Nose pin", "Nose pins", ["Stud", "Ring", "Diamond"], [
    "Diamond studs",
    "New arrivals",
  ]),
  item("necklace-set", "Necklace set", "Necklace sets", ["Bridal", "Festive"], [
    "Bridal sets",
    "New arrivals",
  ]),
  item("pendant-set", "Pendant set", "Pendant sets", ["With chain", "Gift sets"], [
    "Gift sets",
    "New arrivals",
  ]),
];

export const CATEGORY_NAV_IDS = new Set(
  CATEGORY_NAV_ITEMS.map((c) => c.id)
);

export function getCategoryNavItem(id: string): CategoryNavItem | undefined {
  return CATEGORY_NAV_ITEMS.find((c) => c.id === id);
}

export function isValidCategoryNavId(id: string): boolean {
  return id === "all" || CATEGORY_NAV_IDS.has(id);
}

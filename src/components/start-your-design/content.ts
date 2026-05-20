export type StartDesignCategory = {
  id: string;
  label: string;
  desc: string;
};

export const START_DESIGN_CATEGORIES: StartDesignCategory[] = [
  { id: "ring", label: "Ring", desc: "Engagement, daily wear, cocktail" },
  { id: "necklace", label: "Necklace", desc: "Chains, sets, bridal" },
  { id: "earrings", label: "Earrings", desc: "Studs, hoops, jhumka" },
  { id: "bangle", label: "Bangles", desc: "Kada, bracelets, stack" },
  { id: "mangalsutra", label: "Mangalsutra", desc: "Modern & traditional" },
  { id: "other", label: "Other", desc: "Anything custom you imagine" },
];

export const START_DESIGN_STEPS = [
  {
    title: "Share a reference",
    body: "Send a photo, sketch, or a link. We’ll confirm metal, size, and finish.",
  },
  {
    title: "Quick consultation",
    body: "We’ll WhatsApp/call to clarify details and align the budget range.",
  },
  {
    title: "Quote + timeline",
    body: "You receive an estimated quote and delivery timeline based on today’s rates.",
  },
  {
    title: "Make & deliver",
    body: "After approval, we start craftsmanship and keep you updated till delivery.",
  },
] as const;

export const START_DESIGN_FAQ = [
  {
    q: "How fast will I get a quotation?",
    a: "Usually within 30–60 minutes during working hours. For complex designs, we share a same-day estimate and a detailed quote after confirmation.",
  },
  {
    q: "Can you remake a design from a photo?",
    a: "Yes. Share 1–3 clear reference images and we’ll propose the closest match with improvements for comfort and durability.",
  },
  {
    q: "What affects the price most?",
    a: "Metal purity/weight, stone type & quality, and making/setting complexity. We’ll always break it down clearly on WhatsApp.",
  },
  {
    q: "Do you do redesign with old gold?",
    a: "Yes — share a photo of your old jewellery and approx weight. We’ll guide the best approach and estimate.",
  },
] as const;


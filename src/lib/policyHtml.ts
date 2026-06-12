import contactData from "@/data/contactDatas.json";

const DEFAULT_POLICY_HREFS = {
  privacy: "/privacy",
  refund: "/returns",
  terms: "/terms",
} as const;

type LegalJson = {
  tradingName?: string;
  email?: string;
  address?: string;
  phone?: string;
  registrationNumber?: string;
  vatNumber?: string;
  gstin?: string;
  websiteUrl?: string;
  legacyEmails?: string[];
};

type ContactDatasJson = {
  brand?: { name?: string };
  contact?: { phone?: string; email?: string };
  footer?: { visit?: { address?: string } };
  legal?: LegalJson;
};

const siteData = contactData as ContactDatasJson;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function policyAnchor(href: string, label: string): string {
  return `<a href="${href}">${escapeHtml(label)}</a>`;
}

function emailAnchor(email: string): string {
  const safe = escapeHtml(email);
  return `<a href="mailto:${safe}">${safe}</a>`;
}

function phoneAnchor(phone: string): string {
  const tel = phone.replace(/[^\d+]/g, "");
  const safe = escapeHtml(phone);
  return `<a href="tel:${tel}">${safe}</a>`;
}

export function getPolicyBusinessDetails() {
  const legal = siteData.legal ?? {};

  return {
    tradingName: legal.tradingName ?? siteData.brand?.name ?? "Pradeep Jewellers",
    email: legal.email ?? siteData.contact?.email ?? "",
    address:
      legal.address ?? siteData.footer?.visit?.address ?? "",
    phone: legal.phone ?? siteData.contact?.phone ?? "",
    registrationNumber: legal.registrationNumber ?? "",
    vatNumber: legal.vatNumber ?? legal.gstin ?? "",
    websiteUrl: legal.websiteUrl ?? "",
    legacyEmails: legal.legacyEmails ?? [],
  };
}

function applyBusinessPlaceholders(html: string): string {
  const details = getPolicyBusinessDetails();

  const placeholderValues: Record<string, string> = {
    "TRADING NAME": details.tradingName,
    "STORE NAME": details.tradingName,
    "COMPANY NAME": details.tradingName,
    "FULL COMPANY NAME": details.tradingName,
    "BUSINESS NAME": details.tradingName,
    "BUSINESS ADDRESS": details.address,
    "ADDRESS": details.address,
    "BUSINESS PHONE NUMBER": details.phone,
    "PHONE NUMBER": details.phone,
    "BUSINESS PHONE": details.phone,
    "EMAIL ADDRESS": details.email,
    "EMAIL": details.email,
    "CONTACT EMAIL": details.email,
    "BUSINESS REGISTRATION NUMBER": details.registrationNumber,
    "REGISTRATION NUMBER": details.registrationNumber,
    "VAT NUMBER": details.vatNumber,
    "GST NUMBER": details.vatNumber,
    "GSTIN": details.vatNumber,
    "WEBSITE URL": details.websiteUrl,
    "STORE URL": details.websiteUrl,
    "URL": details.websiteUrl,
  };

  let output = html;

  for (const [label, value] of Object.entries(placeholderValues)) {
    if (!value.trim()) continue;
    const pattern = new RegExp(`\\[INSERT\\s+${label.replace(/\s+/g, "\\s+")}\\s*\\]`, "gi");
    const replacement =
      label.includes("EMAIL") && value.includes("@")
        ? emailAnchor(value)
        : (label.includes("PHONE") || label === "BUSINESS PHONE")
          ? phoneAnchor(value)
          : label.includes("URL")
            ? policyAnchor(value, value)
            : escapeHtml(value);
    output = output.replace(pattern, () => replacement);
  }

  for (const legacyEmail of details.legacyEmails) {
    if (!legacyEmail.trim() || !details.email.trim()) continue;
    const legacyPattern = new RegExp(escapeRegex(legacyEmail), "gi");
    output = output.replace(legacyPattern, () => emailAnchor(details.email));
  }

  return output;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Shopify policy bodies sometimes ship with "[LINK]" and "[INSERT …]" placeholders.
 */
export function enrichPolicyHtml(
  body: string,
  hrefs: Partial<typeof DEFAULT_POLICY_HREFS> = {}
): string {
  const routes = { ...DEFAULT_POLICY_HREFS, ...hrefs };
  let html = body;

  const linkReplacements: { pattern: RegExp; href: string; label: string }[] = [
    {
      pattern: /Privacy Policy\s*\[LINK\]/gi,
      href: routes.privacy,
      label: "Privacy Policy",
    },
    {
      pattern: /Return\s*&\s*Refund Policy\s*\[LINK\]/gi,
      href: routes.refund,
      label: "Return & Refund Policy",
    },
    {
      pattern: /Refund Policy\s*\[LINK\]/gi,
      href: routes.refund,
      label: "Refund Policy",
    },
    {
      pattern: /Return Policy\s*\[LINK\]/gi,
      href: routes.refund,
      label: "Return Policy",
    },
    {
      pattern: /Terms(?:\s*&\s*|\s+and\s+)Conditions\s*\[LINK\]/gi,
      href: routes.terms,
      label: "Terms & Conditions",
    },
  ];

  for (const { pattern, href, label } of linkReplacements) {
    html = html.replace(pattern, () => policyAnchor(href, label));
  }

  html = html.replace(/href\s*=\s*["']\[LINK\]["']/gi, 'href="/"');
  html = applyBusinessPlaceholders(html);

  return html;
}

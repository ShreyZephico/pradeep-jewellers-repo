import type { ShopifyShopPolicies } from "@/lib/shopify";
import { enrichPolicyHtml } from "@/lib/policyHtml";

import "@/styles/policy.css";

type ShopifyPolicy = NonNullable<ShopifyShopPolicies[keyof ShopifyShopPolicies]>;

type ShopPolicyPageProps = {
  title: string;
  subtitle?: string;
  policy: ShopifyPolicy | null;
  /** Optional extra blocks shown under the primary policy (for combined pages). */
  extra?: { heading: string; policy: ShopifyPolicy | null }[];
};

function PolicyBlock({ heading, policy }: { heading: string; policy: ShopifyPolicy | null }) {
  if (!policy?.body?.trim()) {
    return (
      <div className="policy-missing">
        <strong>{heading}:</strong> Not available.
      </div>
    );
  }

  return (
    <div className="policy-body">
      <h2>{heading}</h2>
      <div dangerouslySetInnerHTML={{ __html: enrichPolicyHtml(policy.body) }} />
    </div>
  );
}

export default function ShopPolicyPage({
  title,
  subtitle,
  policy,
  extra,
}: ShopPolicyPageProps) {
  return (
    <main className="policy-page">
      <div className="policy-container">
        <header className="policy-header">
          <h1 className="policy-title">{title}</h1>
          {subtitle ? <p className="policy-subtitle">{subtitle}</p> : null}
        </header>

        <div className="policy-card">
          <PolicyBlock heading={title} policy={policy} />
          {extra?.length
            ? extra.map((b) => <PolicyBlock key={b.heading} heading={b.heading} policy={b.policy} />)
            : null}
        </div>

      </div>
    </main>
  );
}


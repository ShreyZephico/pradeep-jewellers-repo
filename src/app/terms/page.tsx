import ShopPolicyPage from "@/components/policies/ShopPolicyPage";
import { getShopPolicies } from "@/lib/shopify";

export const metadata = {
  title: "Terms & Conditions | Pradeep Jewellers",
  description: "Terms and conditions for Pradeep Jewellers.",
};

export default async function TermsPage() {
  const policies = await getShopPolicies();

  return (
    <ShopPolicyPage
      title="Terms & Conditions"
      policy={policies.termsOfService}
    />
  );
}


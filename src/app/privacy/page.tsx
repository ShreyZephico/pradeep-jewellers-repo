import ShopPolicyPage from "@/components/policies/ShopPolicyPage";
import { getShopPolicies } from "@/lib/shopify";

export const metadata = {
  title: "Privacy Policy | Pradeep Jewellers",
  description: "Privacy policy for Pradeep Jewellers.",
};

export default async function PrivacyPolicyPage() {
  const policies = await getShopPolicies();
  return (
    <ShopPolicyPage
      title="Privacy Policy"
      policy={policies.privacyPolicy}
    />
  );
}


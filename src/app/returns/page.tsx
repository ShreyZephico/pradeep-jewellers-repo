import ShopPolicyPage from "@/components/policies/ShopPolicyPage";
import { getShopPolicies } from "@/lib/shopify";

export const metadata = {
  title: "Return & Refund Policy | Pradeep Jewellers",
  description: "Return and refund policy for Pradeep Jewellers.",
};

export default async function ReturnsPage() {
  const policies = await getShopPolicies();
  return (
    <ShopPolicyPage
      title="Return & Refund Policy"
      
      policy={policies.refundPolicy}
      extra={
        policies.shippingPolicy
          ? [{ heading: "Shipping Policy", policy: policies.shippingPolicy }]
          : []
      }
    />
  );
}


import OrdersPageClient from "@/components/orders/OrdersPageClient";

export const metadata = {
  title: "My Orders | Pradeep Jewellers",
  description: "View your order history, items, and delivery status.",
};

export default function OrdersPage() {
  return <OrdersPageClient />;
}

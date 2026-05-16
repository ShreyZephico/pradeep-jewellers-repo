import type { Product } from "@/types/product";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";

type ProductModalProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
};

export default function ProductModal({ product, open, onClose }: ProductModalProps) {
  if (!open || !product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1c12]/60 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-[#eadcc8] bg-[#fffaf2] shadow-[0_30px_100px_rgba(47,28,18,0.38)]">
        <ProductPurchasePanel
          key={product.id}
          product={product}
          showDesignSummary
          priceHeaderVariant="modal"
          onClose={onClose}
        />
      </div>
    </div>
  );
}

import { checkVariantAvailability as checkFromCartModule } from "@/lib/shopifyCart";

export class InsufficientStockError extends Error {
  constructor(message = "This item is out of stock.") {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export async function assertVariantCanBePurchased(
  merchandiseId: string,
  quantity: number
): Promise<void> {
  const availability = await checkFromCartModule(merchandiseId);
  if (!availability.availableForSale) {
    throw new InsufficientStockError();
  }
  if (
    typeof availability.quantityAvailable === "number" &&
    availability.quantityAvailable < quantity
  ) {
    throw new InsufficientStockError("Not enough stock for this quantity.");
  }
}

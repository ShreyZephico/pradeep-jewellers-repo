export type ClientCartLine = {
  id: string;
  quantity: number;
  merchandiseId: string;
  title: string;
  productHandle: string;
  imageUrl: string | null;
  customPriceInr: number;
  lineTotalInr: number;
  attributes: { key: string; value: string }[];
};

export type ClientCart = {
  id: string | null;
  totalQuantity: number;
  subtotalInr: number;
  lines: ClientCartLine[];
};

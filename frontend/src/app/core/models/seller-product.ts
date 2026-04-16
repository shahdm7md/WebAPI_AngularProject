export interface SellerProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  category: string;
  thumbnailUrl?: string;
}
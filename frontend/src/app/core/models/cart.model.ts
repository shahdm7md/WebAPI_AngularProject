export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  subTotal: number;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
  totalPrice: number;
  totalItems: number;
}

export interface CartItemRequest {
  productId: number;
  quantity: number;
}
export enum PaymentMethod {
  Card = 1,
PayPal = 2,
Cash = 3
}

export enum OrderStatus {
  Pending = 1,
Paid = 2,
Shipped = 3,
Delivered = 4,
Cancelled = 5
}

export enum PaymentStatus {
   Pending = 1,
 Completed = 2,
 Failed = 3
}

export interface CheckoutRequest {
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface OrderItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subTotal: number;
}

export interface PaymentResponse {
  id: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId: string | null;
  paidAt: string | null;
}

export interface OrderResponse {
  id: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItemResponse[];
  payment: PaymentResponse | null;
}
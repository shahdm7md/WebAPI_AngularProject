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

export interface Governorate {
  id: number;
  name: string;
  nameAr: string;
  shippingCost: number;
  isActive: boolean;
}

export interface CouponValidationResponse {
  isValid: boolean;
  message: string;
  couponCode: string;
  discountAmount: number;
}

export interface CheckoutRequest {
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  governorateId: number;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface OrderItemResponse {
  productId: number;
  productName: string;
  productImage?: string | null;
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
  subtotalAmount: number;
  totalAmount: number;
  shippingCost: number;
  discountAmount: number;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  appliedCouponCode?: string;
  status: OrderStatus | number;
  createdAt: string;
  items: OrderItemResponse[];
  payment: PaymentResponse | null;
}
export interface OrderHistory {
  id: number;
  createdAt: Date;
  totalAmount: number;
  status: string;
  itemCount: number;
}


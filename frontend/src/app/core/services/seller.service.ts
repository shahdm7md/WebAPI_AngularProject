import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

// ── Models ────────────────────────────────────────────────────────────────────

export interface SellerProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  storeName?: string;
  storeDescription?: string;
  sellerStatus?: string;
  walletBalance: number;
  createdAt: string;
}

export interface UpdateSellerProfileRequest {
  fullName: string;
  address?: string;
  storeName?: string;
  storeDescription?: string;
  phoneNumber?: string;
}

export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  isMain: boolean;
}

export interface SellerProductResponse {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  mainImageUrl?: string;
  images: ProductImageResponse[];
  averageRating: number;
  reviewCount: number;
}

export interface SellerOrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  price: number;
}

export interface PaymentSummaryResponse {
  method: string;
  status: string;
  paidAt?: string;
}

export interface SellerOrderResponse {
  id: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  notificationWarning?: string;
  items: SellerOrderItemResponse[];
  payment?: PaymentSummaryResponse;
}

export interface EarningsSummaryResponse {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  totalOrders: number;
  thisMonthOrders: number;
  averageOrderValue: number;
}

export interface EarningsDetailResponse {
  orderId: number;
  amount: number;
  date: string;
  orderStatus: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SellerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private get base() { return `${this.baseUrl}/api/SellerDashboard`; }

  // ── Profile ────────────────────────────────────────────────────────────────

  getProfile(): Observable<SellerProfileResponse> {
    return this.http.get<SellerProfileResponse>(`${this.base}/profile`);
  }

  updateProfile(req: UpdateSellerProfileRequest): Observable<SellerProfileResponse> {
    return this.http.put<SellerProfileResponse>(`${this.base}/profile`, req);
  }

  // ── Products ───────────────────────────────────────────────────────────────

  getProducts(search?: string): Observable<SellerProductResponse[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<SellerProductResponse[]>(`${this.base}/products`, { params });
  }

  getProductById(id: number): Observable<SellerProductResponse> {
    return this.http.get<SellerProductResponse>(`${this.base}/products/${id}`);
  }

  createProduct(formData: FormData): Observable<SellerProductResponse> {
    return this.http.post<SellerProductResponse>(`${this.base}/products`, formData);
  }

  updateProduct(id: number, data: Partial<SellerProductResponse>): Observable<SellerProductResponse> {
    return this.http.put<SellerProductResponse>(`${this.base}/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  updateStock(id: number, stockQuantity: number): Observable<SellerProductResponse> {
    return this.http.patch<SellerProductResponse>(
      `${this.base}/products/${id}/stock`, { stockQuantity });
  }

  addProductImage(productId: number, formData: FormData): Observable<ProductImageResponse> {
    return this.http.post<ProductImageResponse>(
      `${this.base}/products/${productId}/images`, formData);
  }

  deleteProductImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${productId}/images/${imageId}`);
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  getOrders(status?: string): Observable<SellerOrderResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<SellerOrderResponse[]>(`${this.base}/orders`, { params });
  }

  getOrderById(id: number): Observable<SellerOrderResponse> {
    return this.http.get<SellerOrderResponse>(`${this.base}/orders/${id}`);
  }

  updateOrderStatus(id: number, status: string): Observable<SellerOrderResponse> {
    return this.http.patch<SellerOrderResponse>(
      `${this.base}/orders/${id}/status`, { status });
  }

  // ── Earnings ───────────────────────────────────────────────────────────────

  getEarningsSummary(): Observable<EarningsSummaryResponse> {
    return this.http.get<EarningsSummaryResponse>(`${this.base}/earnings/summary`);
  }

  getEarningsDetail(): Observable<EarningsDetailResponse[]> {
    return this.http.get<EarningsDetailResponse[]>(`${this.base}/earnings`);
  }
}

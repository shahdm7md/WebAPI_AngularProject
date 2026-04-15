import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  DashboardStatsResponse,
  UserSummaryResponse,
  SellerSummaryResponse,
  AdminProductResponse,
  AdminOrderResponse,
  CouponResponse,
  BannerResponse,
  PaginatedResponse,
  ToggleActiveResult,
  ApproveSellerResult,
  RejectSellerResult,
  DeactivateProductResult,
  UpdateOrderStatusResult,
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponResult,
  CreateBannerRequest,
  UpdateBannerRequest,
  BannerResult,
  CategoryResponse,
  CreateProductRequest,
} from '../models/admin.models';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  // =================== Dashboard ===================

  getDashboardStats(): Observable<DashboardStatsResponse> {
    return this.http.get<DashboardStatsResponse>(
      `${this.baseUrl}/api/admin/dashboard/stats`
    );
  }

  // =================== Users ===================

  getAllUsers(role?: string, page = 1, pageSize = 10): Observable<PaginatedResponse<UserSummaryResponse>> {
    let url = `${this.baseUrl}/api/admin/users?page=${page}&pageSize=${pageSize}`;
    if (role) url += `&role=${role}`;
    return this.http.get<PaginatedResponse<UserSummaryResponse>>(url);
  }

  getPendingSellers(): Observable<SellerSummaryResponse[]> {
    return this.http.get<SellerSummaryResponse[]>(
      `${this.baseUrl}/api/admin/sellers/pending`
    );
  }

  toggleActive(userId: string): Observable<ToggleActiveResult> {
    return this.http.put<ToggleActiveResult>(
      `${this.baseUrl}/api/admin/users/${userId}/toggle-active`,
      {}
    );
  }

  approveSeller(userId: string): Observable<ApproveSellerResult> {
    return this.http.put<ApproveSellerResult>(
      `${this.baseUrl}/api/admin/sellers/${userId}/approve`,
      {}
    );
  }

  rejectSeller(userId: string): Observable<RejectSellerResult> {
    return this.http.put<RejectSellerResult>(
      `${this.baseUrl}/api/admin/sellers/${userId}/reject`,
      {}
    );
  }

  // =================== Products ===================

  getAllProducts(sellerId?: string, page = 1, pageSize = 10): Observable<PaginatedResponse<AdminProductResponse>> {
    let url = `${this.baseUrl}/api/admin/products?page=${page}&pageSize=${pageSize}`;
    if (sellerId) url += `&sellerId=${sellerId}`;
    return this.http.get<PaginatedResponse<AdminProductResponse>>(url);
  }

  deactivateProduct(productId: number): Observable<DeactivateProductResult> {
    return this.http.put<DeactivateProductResult>(
      `${this.baseUrl}/api/admin/products/${productId}/deactivate`,
      {}
    );
  }

  // =================== Orders ===================

  getAllOrders(status?: string, page = 1, pageSize = 10): Observable<PaginatedResponse<AdminOrderResponse>> {
    let url = `${this.baseUrl}/api/admin/orders?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    return this.http.get<PaginatedResponse<AdminOrderResponse>>(url);
  }

  updateOrderStatus(orderId: number, status: string): Observable<UpdateOrderStatusResult> {
    return this.http.put<UpdateOrderStatusResult>(
      `${this.baseUrl}/api/admin/orders/${orderId}/status`,
      { status }
    );
  }

  exportOrders(): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/api/admin/orders/export`,
      { responseType: 'blob' }
    );
  }

  // =================== Coupons ===================

  getCoupons(): Observable<CouponResponse[]> {
    return this.http.get<CouponResponse[]>(
      `${this.baseUrl}/api/admin/coupons`
    );
  }

  createCoupon(payload: any): Observable<CouponResult> {
    return this.http.post<CouponResult>(
      `${this.baseUrl}/api/admin/coupons`,
      payload
    );
  }

  updateCoupon(id: number, payload: any): Observable<CouponResult> {
    return this.http.put<CouponResult>(
      `${this.baseUrl}/api/admin/coupons/${id}`,
      payload
    );
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/api/admin/coupons/${id}`
    );
  }

  // =================== Banners ===================

  getBanners(): Observable<BannerResponse[]> {
    return this.http.get<BannerResponse[]>(
      `${this.baseUrl}/api/banners`
    );
  }

  createBanner(payload: CreateBannerRequest, image?: File): Observable<BannerResult> {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('displayOrder', payload.displayOrder.toString());
    if (payload.link)  form.append('link', payload.link);
    if (image)         form.append('image', image);
    return this.http.post<BannerResult>(
      `${this.baseUrl}/api/admin/banners`,
      form
    );
  }

  updateBanner(id: number, payload: UpdateBannerRequest): Observable<BannerResult> {
    return this.http.put<BannerResult>(
      `${this.baseUrl}/api/admin/banners/${id}`,
      payload
    );
  }

  deleteBanner(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/api/admin/banners/${id}`
    );
  }
  getCategories(): Observable<CategoryResponse[]> {
  return this.http.get<CategoryResponse[]>(`${this.baseUrl}/api/Categories`);
}

createProduct(payload: CreateProductRequest): Observable<any> {
  return this.http.post(`${this.baseUrl}/api/Products`, payload);
}
}
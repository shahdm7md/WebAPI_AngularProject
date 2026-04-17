import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { DEFAULT_API_BASE_URL } from '../config/api.config';
import {
  CreateProductReviewRequest,
  PagedProductsResponse,
  ProductDetailResponse,
  ProductReviewItem,
  PurchaseStatusResponse,
  StoreProduct,
  StorefrontQuery,
} from '../models/store-product.model';

@Injectable({ providedIn: 'root' })
export class StorefrontService {
  private readonly baseUrl = `${DEFAULT_API_BASE_URL}/api/Products`;

  constructor(private http: HttpClient) {}

  getActiveProductsPaged(query: StorefrontQuery = {}): Observable<PagedProductsResponse> {
    const page = query.page ?? 1;
    const size = query.size ?? 24;

    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }

    if (typeof query.categoryId === 'number') {
      params.set('categoryId', String(query.categoryId));
    }

    return this.http.get<PagedProductsResponse>(`${this.baseUrl}?${params.toString()}`);
  }

  getActiveProducts(page = 1, size = 48): Observable<StoreProduct[]> {
    return this.http
      .get<PagedProductsResponse>(`${this.baseUrl}?page=${page}&size=${size}`)
      .pipe(map((response) => response.data ?? []));
  }

  getProductById(productId: number): Observable<StoreProduct> {
    return this.http.get<StoreProduct>(`${this.baseUrl}/${productId}`);
  }

  getProductDetails(productId: number): Observable<ProductDetailResponse> {
    return this.http.get<ProductDetailResponse>(`${this.baseUrl}/${productId}/details`);
  }

  getProductReviews(productId: number): Observable<ProductReviewItem[]> {
    return this.http.get<ProductReviewItem[]>(`${this.baseUrl}/${productId}/reviews`);
  }

  getPurchaseStatus(productId: number): Observable<PurchaseStatusResponse> {
    return this.http.get<PurchaseStatusResponse>(`${this.baseUrl}/${productId}/purchase-status`);
  }

  addReview(productId: number, payload: CreateProductReviewRequest): Observable<ProductReviewItem> {
    return this.http.post<ProductReviewItem>(`${this.baseUrl}/${productId}/reviews`, payload);
  }
}

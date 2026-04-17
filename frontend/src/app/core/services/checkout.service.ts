import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CheckoutRequest, OrderResponse, Governorate, CouponValidationResponse } from '../models/order.model';
import { DEFAULT_API_BASE_URL  } from '../config/api.config';
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly baseUrl = `${DEFAULT_API_BASE_URL}/api/checkout`;
  private readonly govUrl = `${DEFAULT_API_BASE_URL}/api/governorates`;

  constructor(private http: HttpClient) {}

  getGovernorates(): Observable<Governorate[]> {
    return this.http.get<Governorate[]>(this.govUrl);
  }

  getSummary(): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.baseUrl}/summary`);
  }

  validateCoupon(couponCode: string): Observable<CouponValidationResponse> {
    return this.http.post<CouponValidationResponse>(`${this.baseUrl}/validate-coupon`, {
      couponCode
    });
  }

  checkout(dto: CheckoutRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, dto);
  }
}
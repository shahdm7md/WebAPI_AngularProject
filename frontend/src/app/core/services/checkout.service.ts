import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CheckoutRequest, OrderResponse } from '../models/order.model';
import { DEFAULT_API_BASE_URL  } from '../config/api.config';
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly baseUrl = `${DEFAULT_API_BASE_URL }/checkout`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.baseUrl}/summary`);
  }

  checkout(dto: CheckoutRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, dto);
  }
}
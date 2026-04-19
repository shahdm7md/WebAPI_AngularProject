import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DEFAULT_API_BASE_URL } from '../config/api.config';

export interface StripeSessionResponse {
  sessionId: string;
  checkoutUrl: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
private readonly baseUrl = 'https://localhost:44395/api/payment';
  constructor(private http: HttpClient) {}

  createStripeSession(orderId: number): Observable<StripeSessionResponse> {
    return this.http.post<StripeSessionResponse>(`${this.baseUrl}/create-session`, { orderId });
  }

  confirmPayment(orderId: number, sessionId?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/confirm`, { orderId, sessionId });
  }

  cashPayment(orderId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/cash`, { orderId });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DEFAULT_API_BASE_URL } from '../config/api.config';

export interface StripeSessionResponse {
  sessionId: string;
  checkoutUrl: string;
}

export interface PayPalCreateOrderRequest {
  amount: number;
}

export interface PayPalCreateOrderResponse {
  paypalOrderId: string;
}

export interface PayPalCaptureOrderRequest {
  paypalOrderId: string;
  systemOrderId: number;
}

export interface PayPalCaptureOrderResponse {
  success: boolean;
  transactionId?: string;
  status?: string | number;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
private readonly baseUrl = 'http://localhost:5199/api/payment';
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

  createPayPalOrder(amount: number): Observable<PayPalCreateOrderResponse> {
    return this.http.post<PayPalCreateOrderResponse>(`${DEFAULT_API_BASE_URL}/api/paypal/create-order`, {
      amount,
    } satisfies PayPalCreateOrderRequest);
  }

  capturePayPalOrder(data: PayPalCaptureOrderRequest): Observable<PayPalCaptureOrderResponse> {
    return this.http.post<PayPalCaptureOrderResponse>(`${DEFAULT_API_BASE_URL}/api/paypal/capture-order`, data);
  }
}


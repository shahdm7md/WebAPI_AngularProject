import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderHistory, OrderItemResponse, OrderResponse } from '../models/order.model'; // Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø§Ù„Ù…ÙˆØ¯ÙŠÙ„
@Injectable({
  providedIn: 'root',
})
export class OrderService
{
  private apiUrl = 'http://localhost:5199/api/orders';

  constructor(private http: HttpClient) { }

  getUserOrders(): Observable<OrderHistory[]> {
    return this.http.get<OrderHistory[]>(`${this.apiUrl}/my-orders`);
  }
  
}


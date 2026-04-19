import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderHistory, OrderItemResponse, OrderResponse } from '../models/order.model'; // استيراد الموديل
@Injectable({
  providedIn: 'root',
})
export class OrderService
{
  private apiUrl = 'https://localhost:44395/api/orders';

  constructor(private http: HttpClient) { }

  getUserOrders(): Observable<OrderHistory[]> {
    return this.http.get<OrderHistory[]>(`${this.apiUrl}/my-orders`);
  }
  
}

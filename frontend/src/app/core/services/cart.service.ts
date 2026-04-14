import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CartResponse, CartItemRequest } from '../models/cart.model';

import { DEFAULT_API_BASE_URL  } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly baseUrl = `${DEFAULT_API_BASE_URL }/cart`;

  // Signal للـ cart count في الـ navbar
  private _cart = signal<CartResponse | null>(null);
  readonly cart = this._cart.asReadonly();
  readonly itemCount = computed(() => this._cart()?.totalItems ?? 0);

  constructor(private http: HttpClient) {}

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.baseUrl).pipe(
      tap(cart => this._cart.set(cart))
    );
  }

  addItem(dto: CartItemRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.baseUrl}/items`, dto).pipe(
      tap(cart => this._cart.set(cart))
    );
  }

  updateItem(productId: number, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(
      `${this.baseUrl}/items/${productId}?quantity=${quantity}`, {}
    ).pipe(tap(cart => this._cart.set(cart)));
  }

  removeItem(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/items/${productId}`).pipe(
      tap(() => {
        const current = this._cart();
        if (current) {
          this._cart.set({
            ...current,
            items: current.items.filter(i => i.productId !== productId),
            totalPrice: current.items
              .filter(i => i.productId !== productId)
              .reduce((s, i) => s + i.subTotal, 0),
            totalItems: current.items
              .filter(i => i.productId !== productId)
              .reduce((s, i) => s + i.quantity, 0)
          });
        }
      })
    );
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(this.baseUrl).pipe(
      tap(() => this._cart.set(null))
    );
  }
}
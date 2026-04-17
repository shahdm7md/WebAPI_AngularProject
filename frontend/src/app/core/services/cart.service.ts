import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { CartResponse, CartItemRequest } from '../models/cart.model';

import { DEFAULT_API_BASE_URL  } from '../config/api.config';
import { AuthService } from './auth.service';
import { StorefrontService } from './storefront.service';
import { StoreProduct } from '../models/store-product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly baseUrl = `${DEFAULT_API_BASE_URL}/api/cart`;
  private readonly guestStorageKey = 'guest_cart_items';

  // Signal للـ cart count في الـ navbar
  private _cart = signal<CartResponse | null>(null);
  readonly cart = this._cart.asReadonly();
  readonly itemCount = computed(() => this._cart()?.totalItems ?? 0);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private storefrontService: StorefrontService,
  ) {}

  private isAuthenticated(): boolean {
    return this.authService.isLoggedIn();
  }

  private handleAuthFailure<T>(fallback: () => Observable<T>) {
    return (error: unknown): Observable<T> => {
      const httpError = error as { status?: number } | null;

      if (httpError?.status === 401) {
        this.authService.clearSession();
        return fallback();
      }

      return throwError(() => error);
    };
  }

  private getGuestItems(): CartItemRequest[] {
    const raw = localStorage.getItem(this.guestStorageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as CartItemRequest[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => Number(item.productId) > 0 && Number(item.quantity) > 0);
    } catch {
      return [];
    }
  }

  private saveGuestItems(items: CartItemRequest[]): void {
    localStorage.setItem(this.guestStorageKey, JSON.stringify(items));
  }

  private clearGuestItemsStorage(): void {
    localStorage.removeItem(this.guestStorageKey);
  }

  private guestValidationError(message: string): Observable<never> {
    return throwError(() => ({ error: { error: message } }));
  }

  private toGuestCartResponse(items: CartItemRequest[]): CartResponse {
    return {
      id: 0,
      items: items.map(item => ({
        id: item.productId,
        productId: item.productId,
        productName: `Product #${item.productId}`,
        productImage: null,
        unitPrice: 0,
        quantity: item.quantity,
        subTotal: 0,
      })),
      totalPrice: 0,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  private toGuestCartResponseFromProducts(
    items: CartItemRequest[],
    products: StoreProduct[],
  ): CartResponse {
    const productsById = new Map(products.map((product) => [product.id, product]));
    const hydratedItems = items
      .map((item) => {
        const product = productsById.get(item.productId);

        if (!product) {
          return null;
        }

        return {
          id: item.productId,
          productId: item.productId,
          productName: product.name,
          productImage: product.mainImageUrl ?? null,
          unitPrice: product.price,
          quantity: item.quantity,
          subTotal: product.price * item.quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      id: 0,
      items: hydratedItems,
      totalPrice: hydratedItems.reduce((sum, item) => sum + item.subTotal, 0),
      totalItems: hydratedItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  private hydrateGuestCart(items: CartItemRequest[]): Observable<CartResponse> {
    if (items.length === 0) {
      return of(this.toGuestCartResponse([]));
    }

    return forkJoin(items.map((item) => this.storefrontService.getProductById(item.productId))).pipe(
      map((products) => this.toGuestCartResponseFromProducts(items, products)),
      catchError(() => of(this.toGuestCartResponse(items)))
    );
  }

  private getGuestCart(): Observable<CartResponse> {
    const guestItems = this.getGuestItems();

    return this.hydrateGuestCart(guestItems).pipe(
      tap((cart) => this._cart.set(cart))
    );
  }

  private addGuestItem(dto: CartItemRequest): Observable<CartResponse> {
    return this.storefrontService.getProductById(dto.productId).pipe(
      switchMap((product) => {
        if (!product.isActive || !product.isAvailable || product.stockQuantity <= 0) {
          return this.guestValidationError(`${product.name} is currently unavailable.`);
        }

        const guestItems = this.getGuestItems();
        const existing = guestItems.find(i => i.productId === dto.productId);
        const currentQty = existing?.quantity ?? 0;
        const desiredQty = currentQty + dto.quantity;

        if (desiredQty > product.stockQuantity) {
          return this.guestValidationError(`Only ${product.stockQuantity} unit(s) available for ${product.name}.`);
        }

        if (existing) {
          existing.quantity = desiredQty;
        } else {
          guestItems.push({ ...dto, quantity: Math.max(1, dto.quantity) });
        }

        this.saveGuestItems(guestItems);
        return this.hydrateGuestCart(guestItems).pipe(
          tap((cart) => this._cart.set(cart))
        );
      })
    );
  }

  private updateGuestItem(productId: number, quantity: number): Observable<CartResponse> {
    return this.storefrontService.getProductById(productId).pipe(
      switchMap((product) => {
        const guestItems = this.getGuestItems();
        const item = guestItems.find(i => i.productId === productId);

        if (!item) {
          return this.hydrateGuestCart(guestItems).pipe(
            tap((cart) => this._cart.set(cart))
          );
        }

        if (!product.isActive || !product.isAvailable || product.stockQuantity <= 0) {
          return this.guestValidationError(`${product.name} is currently unavailable.`);
        }

        if (quantity > product.stockQuantity) {
          return this.guestValidationError(`Only ${product.stockQuantity} unit(s) available for ${product.name}.`);
        }

        item.quantity = Math.max(1, quantity);
        this.saveGuestItems(guestItems);
        return this.hydrateGuestCart(guestItems).pipe(
          tap((cart) => this._cart.set(cart))
        );
      }),
      catchError((error) => {
        const status = (error as { status?: number } | null)?.status;

        if (status === 404) {
          return this.removeGuestItem(productId).pipe(
            switchMap(() => this.guestValidationError('This product is no longer available.'))
          );
        }

        return throwError(() => error);
      })
    );
  }

  private removeGuestItem(productId: number): Observable<void> {
    const guestItems = this.getGuestItems().filter(i => i.productId !== productId);
    this.saveGuestItems(guestItems);
    return this.hydrateGuestCart(guestItems).pipe(
      tap((cart) => this._cart.set(cart)),
      map(() => void 0)
    );
  }

  private clearGuestCart(): Observable<void> {
    this.clearGuestItemsStorage();
    this._cart.set(this.toGuestCartResponse([]));
    return of(void 0);
  }

  mergeGuestCartIntoUserCart(): Observable<void> {
    if (!this.isAuthenticated()) {
      return of(void 0);
    }

    const guestItems = this.getGuestItems();
    if (guestItems.length === 0) {
      return this.getCart().pipe(map(() => void 0));
    }

    const mergeOps = guestItems.map((item) =>
      this.http.post<CartResponse>(`${this.baseUrl}/items`, item).pipe(
        catchError(() => of(null))
      )
    );

    return forkJoin(mergeOps).pipe(
      tap(() => this.clearGuestItemsStorage()),
      switchMap(() => this.getCart().pipe(map(() => void 0))),
      catchError(() => {
        this.clearGuestItemsStorage();
        return of(void 0);
      })
    );
  }

  getCart(): Observable<CartResponse> {
    if (!this.isAuthenticated()) {
      return this.getGuestCart();
    }

    return this.http.get<CartResponse>(this.baseUrl).pipe(
      tap(cart => this._cart.set(cart)),
      catchError(this.handleAuthFailure(() => this.getGuestCart()))
    );
  }

  addItem(dto: CartItemRequest): Observable<CartResponse> {
    if (!this.isAuthenticated()) {
      return this.addGuestItem(dto);
    }

    return this.http.post<CartResponse>(`${this.baseUrl}/items`, dto).pipe(
      tap(cart => this._cart.set(cart)),
      catchError(this.handleAuthFailure(() => this.addGuestItem(dto)))
    );
  }

  updateItem(productId: number, quantity: number): Observable<CartResponse> {
    if (!this.isAuthenticated()) {
      return this.updateGuestItem(productId, quantity);
    }

    return this.http.put<CartResponse>(
      `${this.baseUrl}/items/${productId}?quantity=${quantity}`, {}
    ).pipe(
      tap(cart => this._cart.set(cart)),
      catchError(this.handleAuthFailure(() => this.updateGuestItem(productId, quantity)))
    );
  }

  removeItem(productId: number): Observable<void> {
    if (!this.isAuthenticated()) {
      return this.removeGuestItem(productId);
    }

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
      }),
      catchError(this.handleAuthFailure(() => this.removeGuestItem(productId)))
    );
  }

  clearCart(): Observable<void> {
    if (!this.isAuthenticated()) {
      return this.clearGuestCart();
    }

    return this.http.delete<void>(this.baseUrl).pipe(
      tap(() => this._cart.set(null)),
      catchError(this.handleAuthFailure(() => this.clearGuestCart()))
    );
  }
}
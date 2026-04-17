import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { DEFAULT_API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth.service';
import { StoreProduct } from '../models/store-product.model';
import { StorefrontService } from './storefront.service';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly guestStorageKey = 'guest_wishlist_product_ids';
  private readonly apiUrl = `${DEFAULT_API_BASE_URL}/api/Wishlist`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private storefrontService: StorefrontService,
  ) {}

  isAuthenticated(): boolean {
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

  getGuestWishlistIds(): number[] {
    const raw = localStorage.getItem(this.guestStorageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as number[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveGuestWishlistIds(ids: number[]): void {
    localStorage.setItem(this.guestStorageKey, JSON.stringify(ids));
  }

  private toggleGuestWishlist(productId: number): Observable<boolean> {
    const ids = this.getGuestWishlistIds();
    const exists = ids.includes(productId);
    const updated = exists ? ids.filter((id) => id !== productId) : [...ids, productId];

    this.saveGuestWishlistIds(updated);
    return of(!exists);
  }

  private clearGuestWishlist(): Observable<void> {
    localStorage.removeItem(this.guestStorageKey);
    return of(void 0);
  }

  mergeGuestWishlistIntoUserWishlist(): Observable<void> {
    if (!this.isAuthenticated()) {
      return of(void 0);
    }

    const guestIds = this.getGuestWishlistIds();
    if (guestIds.length === 0) {
      return of(void 0);
    }

    const mergeOps = guestIds.map((productId) =>
      this.http.post(`${this.apiUrl}/${productId}`, {}).pipe(
        catchError(() => of(null))
      )
    );

    return forkJoin(mergeOps).pipe(
      switchMap(() => this.clearGuestWishlist()),
      catchError(() => this.clearGuestWishlist())
    );
  }

  private getItemsGuest(): Observable<StoreProduct[]> {
    const ids = this.getGuestWishlistIds();

    if (ids.length === 0) {
      return of([]);
    }

    return forkJoin(ids.map((id) => this.storefrontService.getProductById(id)));
  }

  isInWishlist(productId: number): Observable<boolean> {
    if (this.isAuthenticated()) {
      return this.http.get<{ productId: number; isInWishlist: boolean }>(`${this.apiUrl}/contains/${productId}`)
        .pipe(
          map(response => response.isInWishlist),
          catchError(this.handleAuthFailure(() => of(this.getGuestWishlistIds().includes(productId))))
        );
    }

    return of(this.getGuestWishlistIds().includes(productId));
  }

  toggle(productId: number): Observable<boolean> {
    if (this.isAuthenticated()) {
      return this.http.get<{ productId: number; isInWishlist: boolean }>(`${this.apiUrl}/contains/${productId}`)
        .pipe(
          switchMap((response) => {
            if (response.isInWishlist) {
              return this.http.delete<void>(`${this.apiUrl}/${productId}`).pipe(
                map(() => false),
                catchError(this.handleAuthFailure(() => this.toggleGuestWishlist(productId)))
              );
            }

            return this.http.post(`${this.apiUrl}/${productId}`, {}).pipe(
              map(() => true),
              catchError(this.handleAuthFailure(() => this.toggleGuestWishlist(productId)))
            );
          }),
          catchError(this.handleAuthFailure(() => this.toggleGuestWishlist(productId)))
        );
    }

    return this.toggleGuestWishlist(productId);
  }

  getCount(): Observable<number> {
    if (this.isAuthenticated()) {
      return this.http.get<any[]>(this.apiUrl).pipe(
        map(items => items.length),
        catchError(this.handleAuthFailure(() => of(this.getGuestWishlistIds().length)))
      );
    }

    return of(this.getGuestWishlistIds().length);
  }

  getWishlistIdSet(): Observable<Set<number>> {
    if (this.isAuthenticated()) {
      return this.http.get<Array<{ productId: number }>>(this.apiUrl).pipe(
        map((items) => new Set(items.map(item => item.productId))),
        catchError(this.handleAuthFailure(() => of(new Set(this.getGuestWishlistIds()))))
      );
    }

    return of(new Set(this.getGuestWishlistIds()));
  }

  getItems(): Observable<StoreProduct[]> {
    if (this.isAuthenticated()) {
      return this.http.get<Array<any>>(this.apiUrl).pipe(
        map((items) =>
          items.map((item) => ({
            id: item.productId,
            name: item.name,
            description: item.description,
            price: item.price,
            stockQuantity: item.stockQuantity,
            categoryName: 'Wishlist',
            mainImageUrl: item.mainImageUrl,
            isActive: true,
            averageRating: item.averageRating,
            reviewCount: item.reviewCount,
          } as StoreProduct)),
        ),
        catchError(this.handleAuthFailure(() => this.getItemsGuest()))
      );
    }

    return this.getItemsGuest();
  }

  remove(productId: number): Observable<void> {
    if (this.isAuthenticated()) {
      return this.http.delete<void>(`${this.apiUrl}/${productId}`).pipe(
        catchError(this.handleAuthFailure(() => this.remove(productId)))
      );
    }

    const updated = this.getGuestWishlistIds().filter((id) => id !== productId);
    this.saveGuestWishlistIds(updated);
    return of(void 0);
  }

  clearAll(): Observable<void> {
    if (this.isAuthenticated()) {
      return this.getWishlistIdSet().pipe(
        switchMap((ids) => {
          const ops = Array.from(ids).map((id) => this.http.delete<void>(`${this.apiUrl}/${id}`));
          return ops.length > 0 ? forkJoin(ops).pipe(map(() => void 0)) : of(void 0);
        }),
        catchError(this.handleAuthFailure(() => this.clearGuestWishlist()))
      );
    }

    return this.clearGuestWishlist();
  }
}

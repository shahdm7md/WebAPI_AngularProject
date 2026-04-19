import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { StorefrontService } from '../../core/services/storefront.service';
import { StoreProduct } from '../../core/models/store-product.model';
import { WishlistService } from '../../core/services/wishlist.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly storefrontService = inject(StorefrontService);
  private readonly wishlistService = inject(WishlistService);
  readonly cartService = inject(CartService);

  protected products: StoreProduct[] = [];
  protected loading = false;
  protected error = '';
  protected notice = '';
  protected readonly wishlistIds = new Set<number>();
  protected readonly imageBaseUrl = 'https://localhost:44395';

  ngOnInit(): void {
    this.loadStorefront();
    this.cartService.getCart().subscribe();
    this.wishlistService.getWishlistIdSet().subscribe(ids => {
      this.wishlistIds.clear();
      ids.forEach(id => this.wishlistIds.add(id));
    });
  }

  protected loadStorefront(): void {
    this.loading = true;
    this.error = '';

    this.storefrontService
      .getActiveProducts()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (products) => {
          this.products = products;
        },
        error: () => {
          this.error = 'Unable to load products right now.';
        },
      });
  }

  protected addToCart(product: StoreProduct): void {
    if (!product.isActive || !product.isAvailable || product.stockQuantity <= 0) {
      this.error = `${product.name} is currently unavailable.`;
      setTimeout(() => (this.error = ''), 2200);
      return;
    }

    const currentCart = this.cartService.cart();
    const existingQty = currentCart?.items.find(i => i.productId === product.id)?.quantity ?? 0;

    if (existingQty >= product.stockQuantity) {
      this.error = `Only ${product.stockQuantity} unit(s) available for ${product.name}.`;
      setTimeout(() => (this.error = ''), 2500);
      return;
    }

    this.cartService.addItem({ productId: product.id, quantity: 1 }).subscribe({
      next: () => {
        this.notice = `${product.name} added to cart.`;
        setTimeout(() => (this.notice = ''), 2200);
      },
      error: () => {
        this.error = 'Unable to add product to cart.';
      },
    });
  }

  protected toggleWishlist(product: StoreProduct): void {
    this.wishlistService.toggle(product.id).subscribe({
      next: (isNowInWishlist) => {
        if (isNowInWishlist) {
          this.wishlistIds.add(product.id);
          this.notice = `${product.name} added to wishlist.`;
        } else {
          this.wishlistIds.delete(product.id);
          this.notice = `${product.name} removed from wishlist.`;
        }

        setTimeout(() => (this.notice = ''), 2200);
      },
      error: () => {
        this.error = 'Unable to update wishlist.';
      },
    });
  }

  protected isInWishlist(productId: number): boolean {
    return this.wishlistIds.has(productId);
  }

  protected productImageUrl(product: StoreProduct): string {
    if (!product.mainImageUrl) {
      return 'https://placehold.co/800x1000?text=No+Image';
    }

    return `${this.imageBaseUrl}${product.mainImageUrl}`;
  }

  protected stars(average: number): Array<'full' | 'empty'> {
    const normalized = Math.max(0, Math.min(5, Math.round(average)));
    return Array.from({ length: 5 }, (_, index) => (index < normalized ? 'full' : 'empty'));
  }

  protected wishlistCount(): number {
    return this.wishlistIds.size;
  }

  protected isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  protected currentUserName(): string {
    const fullName = this.authService.getCurrentUserName();
    return fullName.trim().length > 0
      ? fullName
      : this.authService.getCurrentUserEmail() || 'My account';
  }

  protected logout(): void {
    this.authService.clearSession();
    this.router.navigateByUrl('/auth/login');
  }
}
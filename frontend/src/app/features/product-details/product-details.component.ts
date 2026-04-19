import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { StorefrontService } from '../../core/services/storefront.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ProductDetailResponse, ProductReviewItem } from '../../core/models/store-product.model';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  private readonly storefrontService = inject(StorefrontService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);

  protected readonly imageBaseUrl = 'https://localhost:44395';

  protected loading = false;
  protected savingReview = false;
  protected error = '';
  protected notice = '';
  protected product: ProductDetailResponse | null = null;
  protected currentImageIndex = 0;
  protected hasPurchased = false;
  protected readonly wishlistIds = new Set<number>();
  protected reviewRating = 5;
  protected reviewComment = '';

  ngOnInit(): void {
    this.cartService.getCart().subscribe();

    this.wishlistService.getWishlistIdSet().subscribe(ids => {
      this.wishlistIds.clear();
      ids.forEach(id => this.wishlistIds.add(id));
    });

    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(productId) || productId <= 0) {
      this.router.navigateByUrl('/shop');
      return;
    }

    this.loadProduct(productId);
  }

  protected loadProduct(productId: number): void {
    this.loading = true;
    this.error = '';

    this.storefrontService
      .getProductDetails(productId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: product => {
          this.product = product;
          this.currentImageIndex = 0;
          if (this.authService.isLoggedIn()) {
            this.loadPurchaseStatus(product.id);
          }
        },
        error: () => {
          this.error = 'Unable to load product details.';
        },
      });
  }

  protected loadPurchaseStatus(productId: number): void {
    this.storefrontService.getPurchaseStatus(productId).subscribe({
      next: status => {
        this.hasPurchased = status.hasPurchased;
      },
      error: () => {
        this.hasPurchased = false;
      },
    });
  }

  protected get images() {
    return this.product?.images?.length ? this.product.images : [];
  }

  protected activeImageUrl(): string {
    const currentImage = this.images[this.currentImageIndex] ?? this.images[0];
    if (!currentImage) {
      return 'https://placehold.co/1200x1200?text=No+Image';
    }

    if (currentImage.imageUrl.startsWith('http://') || currentImage.imageUrl.startsWith('https://')) {
      return currentImage.imageUrl;
    }

    return `${this.imageBaseUrl}${currentImage.imageUrl}`;
  }

  protected thumbUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    return `${this.imageBaseUrl}${imageUrl}`;
  }

  protected setImage(index: number): void {
    this.currentImageIndex = index;
  }

  protected nextImage(): void {
    if (!this.images.length) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
  }

  protected prevImage(): void {
    if (!this.images.length) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
  }

  protected canBuy(product?: ProductDetailResponse | null): boolean {
    return !!product && product.isActive && product.isAvailable && product.stockQuantity > 0;
  }

  protected addToCart(): void {
    if (!this.product || !this.canBuy(this.product)) {
      this.error = 'This product is currently unavailable.';
      return;
    }

    const cart = this.cartService.cart();
    const existingQty = cart?.items.find(item => item.productId === this.product!.id)?.quantity ?? 0;
    if (existingQty >= this.product.stockQuantity) {
      this.error = `Only ${this.product.stockQuantity} unit(s) available.`;
      return;
    }

    this.cartService.addItem({ productId: this.product.id, quantity: 1 }).subscribe({
      next: () => {
        this.notice = 'Added to cart.';
        setTimeout(() => (this.notice = ''), 1800);
      },
      error: err => {
        this.error = err?.error?.error ?? 'Unable to add to cart.';
      },
    });
  }

  protected toggleWishlist(): void {
    if (!this.product) return;

    this.wishlistService.toggle(this.product.id).subscribe({
      next: isIn => {
        if (isIn) {
          this.wishlistIds.add(this.product!.id);
          this.notice = 'Saved to wishlist.';
        } else {
          this.wishlistIds.delete(this.product!.id);
          this.notice = 'Removed from wishlist.';
        }

        setTimeout(() => (this.notice = ''), 1800);
      },
      error: () => {
        this.error = 'Unable to update wishlist.';
      },
    });
  }

  protected isInWishlist(): boolean {
    return !!this.product && this.wishlistIds.has(this.product.id);
  }

  protected stars(average: number): Array<'full' | 'empty'> {
    const normalized = Math.max(0, Math.min(5, Math.round(average)));
    return Array.from({ length: 5 }, (_, index) => (index < normalized ? 'full' : 'empty'));
  }

  protected submitReview(): void {
    if (!this.product) return;

    if (!this.authService.isLoggedIn()) {
      this.error = 'Please log in to leave a review.';
      return;
    }

    if (!this.hasPurchased) {
      this.error = 'You can review this product only after purchasing it.';
      return;
    }

    this.savingReview = true;
    this.storefrontService
      .addReview(this.product.id, {
        rating: this.reviewRating,
        comment: this.reviewComment.trim() || null,
      })
      .pipe(finalize(() => (this.savingReview = false)))
      .subscribe({
        next: () => {
          this.notice = 'Review submitted successfully.';
          this.reviewComment = '';
          this.reviewRating = 5;
          this.loadProduct(this.product!.id);
          setTimeout(() => (this.notice = ''), 1800);
        },
        error: err => {
          this.error = err?.error ?? 'Unable to submit review.';
        },
      });
  }

  protected trackByReview(_: number, review: ProductReviewItem): number {
    return review.id;
  }

  protected currentBadge(): string {
    if (!this.product) {
      return '';
    }

    if (!this.product.isAvailable || this.product.stockQuantity === 0) {
      return 'Out of stock';
    }

    return `${this.product.stockQuantity} left`;
  }
}

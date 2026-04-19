import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { StoreProduct } from '../../core/models/store-product.model';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
})
export class WishlistComponent implements OnInit {
  items: StoreProduct[] = [];
  selectedCategory = 'All Items';
  inStockOnly = false;
  loading = false;
  actionLoading = false;
  error = '';
  notice = '';
  readonly imageBaseUrl = 'https://localhost:44395';

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.loading = true;
    this.error = '';

    this.wishlistService
      .getItems()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (items) => {
          this.items = items;
        },
        error: () => {
          this.error = 'Failed to load wishlist.';
        },
      });
  }

  remove(productId: number): void {
    this.actionLoading = true;
    this.wishlistService
      .remove(productId)
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: () => {
          this.items = this.items.filter((x) => x.id !== productId);
          this.notice = 'Item removed from wishlist.';
          setTimeout(() => (this.notice = ''), 1800);
        },
        error: () => {
          this.error = 'Unable to remove item from wishlist.';
        },
      });
  }

  moveToCart(item: StoreProduct): void {
    if (!item.isAvailable || item.stockQuantity <= 0 || !item.isActive) {
      this.error = `${item.name} is currently unavailable.`;
      return;
    }

    this.actionLoading = true;
    this.cartService
      .addItem({ productId: item.id, quantity: 1 })
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: () => {
          this.remove(item.id);
          this.notice = `${item.name} moved to cart.`;
          setTimeout(() => (this.notice = ''), 1800);
        },
        error: () => {
          this.error = 'Unable to move item to cart.';
        },
      });
  }

  clearAll(): void {
    if (this.items.length === 0) return;
    if (!confirm('Clear your wishlist?')) return;

    this.actionLoading = true;
    this.wishlistService
      .clearAll()
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: () => {
          this.items = [];
          this.notice = 'Wishlist cleared.';
          setTimeout(() => (this.notice = ''), 1800);
        },
        error: () => {
          this.error = 'Unable to clear wishlist.';
        },
      });
  }

  filteredItems(): StoreProduct[] {
    return this.items.filter((item) => {
      const category = this.categoryLabel(item);
      const categoryMatches =
        this.selectedCategory === 'All Items' || this.selectedCategory === category;
      const stockMatches = !this.inStockOnly || item.stockQuantity > 0;
      return categoryMatches && stockMatches;
    });
  }

  categoryEntries(): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();

    for (const item of this.items) {
      const category = this.categoryLabel(item);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
  }

  onStockFilterChange(event: Event): void {
    this.inStockOnly = (event.target as HTMLInputElement).checked;
  }

  categoryLabel(item: StoreProduct): string {
    return (item.categoryName || 'General').trim();
  }

  imageUrl(item: StoreProduct): string {
    if (!item.mainImageUrl) return 'https://placehold.co/600x400?text=No+Image';
    return `${this.imageBaseUrl}${item.mainImageUrl}`;
  }
}

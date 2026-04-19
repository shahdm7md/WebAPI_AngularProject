import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { StoreProduct } from '../../core/models/store-product.model';
import { CartService } from '../../core/services/cart.service';
import { StorefrontService } from '../../core/services/storefront.service';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css',
})
export class ShopComponent {
  private readonly storefrontService = inject(StorefrontService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);

  protected readonly imageBaseUrl = 'http://localhost:44395';

  protected loading = false;
  protected error = '';
  protected notice = '';
  protected products: StoreProduct[] = [];
  protected readonly wishlistIds = new Set<number>();

  protected searchTerm = '';
  protected selectedCategories = new Set<string>();
  protected minRating = 0;
  protected maxPriceCap = 0;
  protected maxPriceFilter = 0;
  protected sortBy: 'popularity' | 'priceAsc' | 'priceDesc' | 'rating' = 'popularity';
  protected currentPage = 1;
  protected readonly pageSize = 9;
  protected showFiltersOnMobile = false;

  ngOnInit(): void {
    this.cartService.getCart().subscribe();

    this.wishlistService.getWishlistIdSet().subscribe(ids => {
      this.wishlistIds.clear();
      ids.forEach(id => this.wishlistIds.add(id));
    });

    this.loadProducts();
  }

  protected loadProducts(): void {
    this.loading = true;
    this.error = '';

    this.storefrontService
      .getActiveProductsPaged({ page: 1, size: 500 })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: response => {
          this.products = response.data ?? [];
          const highestPrice = this.products.reduce((max, product) => Math.max(max, product.price), 0);
          this.maxPriceCap = Math.ceil(highestPrice || 1);
          this.maxPriceFilter = this.maxPriceCap;
        },
        error: () => {
          this.error = 'Unable to load products right now.';
        },
      });
  }

  protected categories(): string[] {
    return Array.from(new Set(this.products.map(p => p.categoryName || 'General'))).sort((a, b) =>
      a.localeCompare(b),
    );
  }

  protected toggleCategory(name: string): void {
    if (this.selectedCategories.has(name)) {
      this.selectedCategories.delete(name);
    } else {
      this.selectedCategories.add(name);
    }

    this.currentPage = 1;
  }

  protected updateSearch(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
  }

  protected updateRating(rating: number): void {
    this.minRating = rating;
    this.currentPage = 1;
  }

  protected updatePriceFilter(value: string): void {
    this.maxPriceFilter = Number(value);
    this.currentPage = 1;
  }

  protected updateSort(value: string): void {
    if (value === 'priceAsc' || value === 'priceDesc' || value === 'rating' || value === 'popularity') {
      this.sortBy = value;
      this.currentPage = 1;
    }
  }

  protected clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategories.clear();
    this.minRating = 0;
    this.sortBy = 'popularity';
    this.maxPriceFilter = this.maxPriceCap;
    this.currentPage = 1;
  }

  protected filteredProducts(): StoreProduct[] {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    const filtered = this.products.filter(product => {
      const category = product.categoryName || 'General';
      const categoryPass =
        this.selectedCategories.size === 0 || this.selectedCategories.has(category);
      const searchPass =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.description || '').toLowerCase().includes(normalizedSearch) ||
        category.toLowerCase().includes(normalizedSearch);
      const ratingPass = product.averageRating >= this.minRating;
      const pricePass = product.price <= this.maxPriceFilter;

      return categoryPass && searchPass && ratingPass && pricePass;
    });

    switch (this.sortBy) {
      case 'priceAsc':
        return [...filtered].sort((a, b) => a.price - b.price);
      case 'priceDesc':
        return [...filtered].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...filtered].sort((a, b) => b.averageRating - a.averageRating);
      default:
        return [...filtered].sort((a, b) => b.reviewCount - a.reviewCount);
    }
  }

  protected pagedProducts(): StoreProduct[] {
    const from = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts().slice(from, from + this.pageSize);
  }

  protected totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize));
  }

  protected pageNumbers(): number[] {
    const total = this.totalPages();
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(total, start + 4);
    const pages: number[] = [];

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  }

  protected setPage(page: number): void {
    const total = this.totalPages();
    this.currentPage = Math.max(1, Math.min(total, page));
  }

  protected toggleFiltersOnMobile(): void {
    this.showFiltersOnMobile = !this.showFiltersOnMobile;
  }

  protected canAddToCart(product: StoreProduct): boolean {
    return product.isActive && product.isAvailable && product.stockQuantity > 0;
  }

  protected addToCart(product: StoreProduct): void {
    if (!this.canAddToCart(product)) {
      this.error = `${product.name} is not available right now.`;
      setTimeout(() => (this.error = ''), 2000);
      return;
    }

    const currentCart = this.cartService.cart();
    const existingQty = currentCart?.items.find(item => item.productId === product.id)?.quantity ?? 0;

    if (existingQty >= product.stockQuantity) {
      this.error = `Only ${product.stockQuantity} unit(s) available for ${product.name}.`;
      setTimeout(() => (this.error = ''), 2400);
      return;
    }

    this.cartService.addItem({ productId: product.id, quantity: 1 }).subscribe({
      next: () => {
        this.notice = `${product.name} added to cart.`;
        setTimeout(() => (this.notice = ''), 1800);
      },
      error: err => {
        this.error = err?.error?.error ?? 'Unable to add item to cart.';
      },
    });
  }

  protected toggleWishlist(product: StoreProduct): void {
    this.wishlistService.toggle(product.id).subscribe({
      next: isIn => {
        if (isIn) {
          this.wishlistIds.add(product.id);
          this.notice = `${product.name} added to wishlist.`;
        } else {
          this.wishlistIds.delete(product.id);
          this.notice = `${product.name} removed from wishlist.`;
        }

        setTimeout(() => (this.notice = ''), 1700);
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
      return 'https://placehold.co/700x850?text=No+Image';
    }

    if (product.mainImageUrl.startsWith('http://') || product.mainImageUrl.startsWith('https://')) {
      return product.mainImageUrl;
    }

    return `${this.imageBaseUrl}${product.mainImageUrl}`;
  }

  protected stockLabel(product: StoreProduct): string {
    if (!product.isAvailable || product.stockQuantity <= 0) {
      return 'Out of stock';
    }

    return `${product.stockQuantity} in stock`;
  }

  protected stars(average: number): Array<'full' | 'empty'> {
    const normalized = Math.max(0, Math.min(5, Math.round(average)));
    return Array.from({ length: 5 }, (_, index) => (index < normalized ? 'full' : 'empty'));
  }
}

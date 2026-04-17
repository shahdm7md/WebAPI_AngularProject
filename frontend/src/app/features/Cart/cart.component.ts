import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CartResponse, CartItemResponse } from '../../core/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart: CartResponse | null = null;
  loading = false;
  error: string | null = null;
  removingId: number | null = null;
  private readonly imageBaseUrl = 'http://localhost:5199';

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: cart => { this.cart = cart; this.loading = false; },
      error: () => { this.error = 'Failed to load cart.'; this.loading = false; }
    });
  }

  updateQuantity(item: CartItemResponse, delta: number): void {
    const newQty = item.quantity + delta;
    if (newQty < 1) { this.removeItem(item.productId); return; }

    this.cartService.updateItem(item.productId, newQty).subscribe({
      next: cart => this.cart = cart,
      error: err => alert(err.error?.error ?? 'Update failed')
    });
  }

  removeItem(productId: number): void {
    this.removingId = productId;
    this.cartService.removeItem(productId).subscribe({
      next: () => {
        this.cart = this.cartService.cart();
        this.removingId = null;
      },
      error: () => this.removingId = null
    });
  }

  clearCart(): void {
    if (!confirm('Clear entire cart?')) return;
    this.cartService.clearCart().subscribe({
      next: () => this.cart = null
    });
  }

  trackByProduct(_: number, item: CartItemResponse): number {
    return item.productId;
  }

  imageUrl(item: CartItemResponse): string {
    if (!item.productImage) {
      return 'https://placehold.co/400x500?text=No+Image';
    }

    if (item.productImage.startsWith('http://') || item.productImage.startsWith('https://')) {
      return item.productImage;
    }

    return `${this.imageBaseUrl}${item.productImage}`;
  }
}
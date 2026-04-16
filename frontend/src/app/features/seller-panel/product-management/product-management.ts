import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  SellerProductResponse,
  SellerProfileResponse,
  SellerService,
} from '../../../core/services/seller.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, CurrencyPipe],
  templateUrl: './product-management.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerProductsComponent implements OnInit {
  private readonly sellerService = inject(SellerService);
  private readonly authService   = inject(AuthService);
  private readonly cdr           = inject(ChangeDetectorRef);

  loading       = true;
  sidebarOpen   = false;
  error: string | null = null;

  profile: SellerProfileResponse | null = null;
  products: SellerProductResponse[]     = [];
  searchQuery   = '';

  // Delete confirmation modal
  showDeleteModal  = false;
  deletingProduct: SellerProductResponse | null = null;
  deleteLoading    = false;

  // Stock edit modal
  showStockModal  = false;
  editingProduct: SellerProductResponse | null = null;
  newStockValue   = 0;
  stockLoading    = false;

  get userName(): string { return this.authService.getCurrentUserName(); }

  get totalItems(): number   { return this.products.length; }
  get lowStockCount(): number { return this.products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length; }
  get outOfStockCount(): number { return this.products.filter(p => p.stockQuantity === 0).length; }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.sellerService.getProfile().subscribe({
      next: (p) => { this.profile = p; this.cdr.markForCheck(); },
      error: () => {},
    });

    this.sellerService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error   = 'Failed to load products.';
        this.loading = false;
        this.cdr.markForCheck();
        console.error(err);
      },
    });
  }

  onSearch(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.sellerService.getProducts(this.searchQuery || undefined).subscribe({
      next: (products) => {
        this.products = products;
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.markForCheck();
  }

  getStockClass(qty: number): string {
    if (qty === 0) return 'text-red-600';
    if (qty <= 5)  return 'text-amber-600';
    return 'text-emerald-700';
  }

  getStockDot(qty: number): string {
    if (qty === 0) return 'bg-red-500';
    if (qty <= 5)  return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  getStockLabel(qty: number): string {
    if (qty === 0) return 'Out of Stock';
    if (qty <= 5)  return `Low Stock (${qty})`;
    return `In Stock (${qty})`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  openDeleteModal(product: SellerProductResponse): void {
    this.deletingProduct = product;
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    this.showDeleteModal  = false;
    this.deletingProduct  = null;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.deletingProduct) return;
    this.deleteLoading = true;
    this.cdr.markForCheck();

    this.sellerService.deleteProduct(this.deletingProduct.id).subscribe({
      next: () => {
        this.products     = this.products.filter(p => p.id !== this.deletingProduct?.id);
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.cdr.markForCheck();
      },
      error: () => {
        this.deleteLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Stock Edit ────────────────────────────────────────────────────────────

  openStockModal(product: SellerProductResponse): void {
    this.editingProduct = product;
    this.newStockValue  = product.stockQuantity;
    this.showStockModal = true;
    this.cdr.markForCheck();
  }

  closeStockModal(): void {
    this.showStockModal = false;
    this.editingProduct = null;
    this.cdr.markForCheck();
  }

  saveStock(): void {
    if (!this.editingProduct) return;
    this.stockLoading = true;
    this.cdr.markForCheck();

    this.sellerService.updateStock(this.editingProduct.id, this.newStockValue).subscribe({
      next: (updated) => {
        const idx = this.products.findIndex(p => p.id === updated.id);
        if (idx !== -1) this.products[idx] = updated;
        this.products = [...this.products];
        this.stockLoading = false;
        this.closeStockModal();
        this.cdr.markForCheck();
      },
      error: () => {
        this.stockLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
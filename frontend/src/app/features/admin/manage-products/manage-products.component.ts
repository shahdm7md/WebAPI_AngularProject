import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  AdminProductResponse,
  PaginatedResponse,
  DeactivateProductResult,
  CategoryResponse,
  CreateProductRequest,
} from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin-api.service';
import { DEFAULT_API_BASE_URL } from '../../../core/config/api.config';

@Component({
  selector: 'app-manage-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-products.component.html',
  styleUrls: ['./manage-products.component.css'],
})
export class ManageProductsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly imageBaseUrl = DEFAULT_API_BASE_URL;

  // ===== State =====
  isLoading      = false;
  isSubmitting   = false;
  actionLoading: Record<number, boolean> = {};
  successMessage = '';
  errorMessage   = '';

  // ===== Modal =====
  showAddModal = false;
  modalError   = '';
  newProduct: CreateProductRequest = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: 0,
  };

  // ===== Data =====
  products:   AdminProductResponse[] = [];
  categories: CategoryResponse[]     = [];

  // ===== Filters =====
  searchTerm     = '';
  filterSellerId = '';

  // ===== Pagination =====
  currentPage = 1;
  pageSize    = 10;
  totalCount  = 0;

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end   = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  get filteredProducts(): AdminProductResponse[] {
    if (!this.searchTerm.trim()) return this.products;
    const term = this.searchTerm.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.categoryName.toLowerCase().includes(term) ||
      p.sellerName.toLowerCase().includes(term)
    );
  }

  get lowStockCount(): number {
    return this.products.filter(p => p.stock > 0 && p.stock < 5).length;
  }

  get outOfStockCount(): number {
    return this.products.filter(p => p.stock === 0).length;
  }

  get activeCount(): number {
    return this.products.filter(p => p.isActive).length;
  }

  navItems = [
    { icon: 'dashboard',     label: 'Dashboard', route: '/admin/dashboard', active: false },
    { icon: 'group',         label: 'Users',     route: '/admin/users',     active: false },
    { icon: 'storefront',    label: 'Vendors',   route: '/admin/users',     active: false },
    { icon: 'inventory_2',   label: 'Products',  route: '/admin/products',  active: true  },
    { icon: 'shopping_cart', label: 'Orders',    route: '/admin/orders',    active: false },
    { icon: 'sell',      label: 'Coupons',   route: '/admin/coupons',   active: false },
        { icon: 'ad_units',      label: 'Banners',   route: '/admin/banners',   active: false },
    { icon: 'settings',      label: 'Settings',  route: '/admin/settings',  active: false },
  ];
private readonly cdr = inject(ChangeDetectorRef);
  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  // ===== Load Products =====
  loadProducts(): void {
    this.isLoading    = true;
    this.errorMessage = '';

    this.adminService.getAllProducts(
      this.filterSellerId || undefined,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (res: PaginatedResponse<AdminProductResponse>) => {
        this.products   = res.data;
        this.totalCount = res.totalCount;
        this.isLoading  = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load products.');
        this.isLoading    = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ===== Load Categories =====
  loadCategories(): void {
    this.adminService.getCategories().subscribe({
      next: (res: CategoryResponse[]) => {
        this.categories = res;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to load categories', err);
        this.cdr.detectChanges();
      },
    });
  }

  // ===== Add Product =====
  openAddModal(): void {
    this.newProduct = { name: '', description: '', price: 0, stock: 0, categoryId: 0 };
    this.modalError  = '';
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.modalError   = '';
  }

  submitAddProduct(): void {
    if (!this.newProduct.name.trim()) {
      this.modalError = 'Product name is required.';
      return;
    }
    if (this.newProduct.price <= 0) {
      this.modalError = 'Price must be greater than 0.';
      return;
    }
    if (this.newProduct.categoryId === 0) {
      this.modalError = 'Please select a category.';
      return;
    }

    this.isSubmitting = true;
    this.modalError   = '';

    this.adminService.createProduct(this.newProduct).subscribe({
      next: () => {
        this.showSuccess('Product added successfully!');
        this.closeAddModal();
        this.loadProducts();
        this.isSubmitting = false;
      },
      error: (err: unknown) => {
        this.modalError   = this.extractError(err, 'Failed to add product.');
        this.isSubmitting = false;
      },
    });
  }

  // ===== Deactivate =====
  deactivate(productId: number): void {
    if (!confirm('Are you sure you want to deactivate this product?')) return;
    this.actionLoading[productId] = true;

    this.adminService.deactivateProduct(productId).subscribe({
      next: (res: DeactivateProductResult) => {
        this.showSuccess(res.message);
        this.loadProducts();
        this.actionLoading[productId] = false;
      },
      error: (err: unknown) => {
        this.showError(this.extractError(err, 'Failed to deactivate product.'));
        this.actionLoading[productId] = false;
      },
    });
  }

  // ===== Pagination =====
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
  }

  // ===== Helpers =====
  getStockClass(product: AdminProductResponse): string {
    if (product.stock <= 0) return 'stock-out';
    if (product.stock < 5) return 'stock-low';
    return 'stock-in';
  }

  getStockLabel(product: AdminProductResponse): string {
    if (product.stock <= 0) return 'Out of Stock';
    if (product.stock < 5) return 'Low Stock';
    return 'In Stock';
  }

  getProductImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) return null;

    const p = imagePath.replace(/\\/g, '/');
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `${this.imageBaseUrl}${p.startsWith('/') ? p : `/${p}`}`;
  }

  isActionLoading(id: number): boolean {
    return !!this.actionLoading[id];
  }

  protected readonly Math = Math;

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => (this.errorMessage = ''), 4000);
  }

  private extractError(error: unknown, fallback: string): string {
    const e = error as { error?: unknown } | null;
    const p = e?.error;
    if (typeof p === 'string' && p.trim().length > 0) return p;
    return fallback;
  }
}
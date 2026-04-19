import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  AdminProductResponse,
  PaginatedResponse,
  DeactivateProductResult,
  CategoryResponse,
} from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin-api.service';
import { DEFAULT_API_BASE_URL } from '../../../core/config/api.config';
import { ProductService } from '../../../core/services/product.service';

// ── Product Form Interface ─────────────────────────────────────────────────
interface ProductForm {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number | string;
  mainImageFile: File | null;
  mainImagePreview: string | null;
  extraFiles: { file: File | null; preview: string; existingUrl?: string }[];
}

@Component({
  selector: 'app-manage-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-products.component.html',
  styleUrls: ['./manage-products.component.css'],
})
export class ManageProductsComponent implements OnInit {
  private readonly adminService   = inject(AdminService);
  private readonly productService = inject(ProductService);
  private readonly imageBaseUrl   = DEFAULT_API_BASE_URL;
  private readonly cdr            = inject(ChangeDetectorRef);

  // ===== State =====
  isLoading      = false;
  actionLoading: Record<number, boolean> = {};
  successMessage = '';
  errorMessage   = '';

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

  // ===== Add / Edit Modal =====
  showModal    = false;
  isEditMode   = false;
  modalLoading = false;
  modalError: string | null = null;
  form: ProductForm = this.emptyForm();

  // ===== Delete Modal =====
  showDeleteModal  = false;
  deleteLoading    = false;
  deletingProduct: AdminProductResponse | null = null;

  // ===== Nav =====
  navItems = [
    { icon: 'dashboard',     label: 'Dashboard', route: '/admin/dashboard', active: false },
    { icon: 'group',         label: 'Users',     route: '/admin/users',     active: false },
    { icon: 'inventory_2',   label: 'Products',  route: '/admin/products',  active: true  },
    { icon: 'shopping_cart', label: 'Orders',    route: '/admin/orders',    active: false },
    { icon: 'sell',          label: 'Coupons',   route: '/admin/coupons',   active: false },
    { icon: 'ad_units',      label: 'Banners',   route: '/admin/banners',   active: false },
  ];

  // ===== Computed =====
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

  // ===== Lifecycle =====
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
    this.productService.getCategories().subscribe({
      next: (res) => {
        this.categories = res;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to load categories', err);
      },
    });
  }

  // ===== Add Modal =====
  openAddModal(): void {
    this.isEditMode = false;
    this.modalError = null;
    this.form       = this.emptyForm();
    this.showModal  = true;
    this.cdr.detectChanges();
  }

  // ===== Edit Modal =====
  openEditModal(product: AdminProductResponse, event: Event): void {
    event.stopPropagation();
    this.isEditMode = true;
    this.modalError = null;

    this.productService.getProductById(product.id).subscribe({
      next: fullProduct => {
        this.form = {
          id:               fullProduct.id,
          name:             fullProduct.name,
          description:      fullProduct.description ?? '',
          price:            fullProduct.price,
          stockQuantity:    fullProduct.stockQuantity,
          categoryId:       this.categories.find(c => c.name === fullProduct.categoryName)?.id ?? '',
          mainImageFile:    null,
          mainImagePreview: fullProduct.mainImageUrl
            ? this.getProductImageUrl(fullProduct.mainImageUrl)
            : null,
          extraFiles: (fullProduct.images ?? [])
            .filter(img => !img.isMain)
            .map(img => ({
              file:        null as any,
              preview:     this.getProductImageUrl(img.imageUrl) ?? '',
              existingUrl: img.imageUrl,
            })),
        };
        this.showModal = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showError('Failed to load product details.');
      },
    });
  }

  closeModal(): void {
    this.showModal  = false;
    this.modalError = null;
    this.cdr.detectChanges();
  }

  // ===== Image Handlers =====
  onMainImageSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.form.mainImageFile = file;
    const r = new FileReader();
    r.onload = ev => {
      this.form.mainImagePreview = ev.target?.result as string;
      this.cdr.detectChanges();
    };
    r.readAsDataURL(file);
  }

  onExtraImagesSelected(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    files.forEach(file => {
      const r = new FileReader();
      r.onload = ev => {
        this.form.extraFiles.push({ file, preview: ev.target?.result as string });
        this.cdr.detectChanges();
      };
      r.readAsDataURL(file);
    });
  }

  removeExtraImage(idx: number): void {
    this.form.extraFiles.splice(idx, 1);
    this.cdr.detectChanges();
  }

  // ===== Submit Form =====
  submitForm(): void {
    this.modalError = null;
    if (!this.form.name.trim()) { this.modalError = 'Product name is required.';    return; }
    if (this.form.price <= 0)   { this.modalError = 'Price must be greater than 0.'; return; }
    if (!this.form.categoryId)  { this.modalError = 'Please select a category.';    return; }

    this.modalLoading = true;
    this.cdr.detectChanges();

    if (this.isEditMode) {
      // ── Edit: update text fields ────────────────────────────────────────
      this.productService.updateProduct(this.form.id, {
        name:          this.form.name,
        description:   this.form.description,
        price:         this.form.price,
        stockQuantity: this.form.stockQuantity,
        categoryId:    Number(this.form.categoryId),
      }).subscribe({
        next: () => {
          if (this.form.mainImageFile) {
            this.productService.addProductImage(this.form.id, this.form.mainImageFile, true)
              .subscribe({
                next:  () => this.afterSave('Product updated successfully!'),
                error: () => this.afterSave('Product updated successfully!'),
              });
          } else {
            this.afterSave('Product updated successfully!');
          }
        },
        error: (err: unknown) => {
          this.modalError   = this.extractError(err, 'Update failed. Please try again.');
          this.modalLoading = false;
          this.cdr.detectChanges();
        },
      });

    } else {
      // ── Add: create product + images ────────────────────────────────────
      this.productService.addProductWithImages({
        name:          this.form.name,
        description:   this.form.description,
        price:         this.form.price,
        stockQuantity: this.form.stockQuantity,
        categoryId:    Number(this.form.categoryId),
        mainImage:     this.form.mainImageFile ?? undefined,
        extraImages:   this.form.extraFiles
          .map(f => f.file)
          .filter((f): f is File => f !== null),
      }).subscribe({
        next: () => this.afterSave('Product added successfully!'),
        error: (err: unknown) => {
          this.modalError   = this.extractError(err, 'Failed to create product. Please try again.');
          this.modalLoading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  private afterSave(message: string): void {
    this.modalLoading = false;
    this.showModal    = false;
    this.showSuccess(message);
    this.loadProducts();
    this.cdr.detectChanges();
  }

  // ===== Delete =====
  openDeleteModal(product: AdminProductResponse, event: Event): void {
    event.stopPropagation();
    this.deletingProduct = product;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingProduct = null;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.deletingProduct) return;
    this.deleteLoading = true;
    this.cdr.detectChanges();

    this.productService.deleteProduct(this.deletingProduct.id).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.showSuccess('Product deleted successfully!');
        this.loadProducts();
      },
      error: (err: unknown) => {
        this.showError(this.extractError(err, 'Failed to delete product.'));
        this.deleteLoading = false;
        this.cdr.detectChanges();
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
    if (product.stock < 5)  return 'stock-low';
    return 'stock-in';
  }

  getStockLabel(product: AdminProductResponse): string {
    if (product.stock <= 0) return 'Out of Stock';
    if (product.stock < 5)  return 'Low Stock';
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

  private emptyForm(): ProductForm {
    return {
      id: 0, name: '', description: '', price: 0,
      stockQuantity: 0, categoryId: '',
      mainImageFile: null, mainImagePreview: null, extraFiles: [],
    };
  }
}
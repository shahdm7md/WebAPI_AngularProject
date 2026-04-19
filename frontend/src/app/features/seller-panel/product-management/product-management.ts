import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, inject, OnInit,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CategoryResponse, ProductImageResponse,
  ProductResponse, ProductService,
} from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';

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
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, CurrencyPipe],
  templateUrl: './product-management.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  private readonly svc = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── State ──────────────────────────────────────────────────────────────────
  loading = true;
  sidebarOpen = false;
  error: string | null = null;

  products: ProductResponse[] = [];
  categories: CategoryResponse[] = [];
  totalCount = 0;
  searchQuery = '';
  selectedCategoryFilter = 0;

  // ── Detail Panel ───────────────────────────────────────────────────────────
  selectedProduct: ProductResponse | null = null;
  detailLoading = false;

  // ── Add/Edit Modal ─────────────────────────────────────────────────────────
  showModal = false;
  isEditMode = false;
  modalLoading = false;
  modalError: string | null = null;

  form: ProductForm = this.emptyForm();

  // ── Delete Modal ───────────────────────────────────────────────────────────
  showDeleteModal = false;
  deleteLoading = false;
  deletingProduct: ProductResponse | null = null;

  // ── Category Manager ───────────────────────────────────────────────────────
  showCatPanel = false;
  newCatName = '';
  catLoading = false;
  catError: string | null = null;

  // ── Getters ────────────────────────────────────────────────────────────────
  get userName() { return this.auth.getCurrentUserName(); }
  get outOfStock() { return this.products.filter(p => p.stockQuantity === 0).length; }
  get lowStock() { return this.products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length; }
  get inStock() { return this.products.filter(p => p.stockQuantity > 6).length; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.svc.getCategories().subscribe({
      next: c => { this.categories = c; this.cdr.markForCheck(); },
    });
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.loading = true; this.error = null; this.cdr.markForCheck();
    this.svc.getProducts(this.searchQuery || undefined, this.selectedCategoryFilter || undefined).subscribe({
      next: res => {
        this.products = res.data;
        this.totalCount = res.totalCount;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Failed to load products.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Detail Panel ───────────────────────────────────────────────────────────
  openDetail(product: ProductResponse): void {
    this.detailLoading = true;
    this.selectedProduct = product;
    this.cdr.markForCheck();
    this.svc.getProductById(product.id).subscribe({
      next: p => {
        this.selectedProduct = p;
        this.detailLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.detailLoading = false; this.cdr.markForCheck(); },
    });
  }

  closeDetail(): void { this.selectedProduct = null; this.cdr.markForCheck(); }

  // ── Add / Edit ─────────────────────────────────────────────────────────────
  openAddModal(): void {
    this.isEditMode = false;
    this.modalError = null;
    this.form = this.emptyForm();
    this.showModal = true;
    this.cdr.markForCheck();

  }
  openEditModal(p: ProductResponse, event: Event): void {
    event.stopPropagation();
    this.isEditMode = true;
    this.modalError = null;

    // جيب الداتا الكاملة مع الصور
    this.svc.getProductById(p.id).subscribe({
      next: fullProduct => {
        this.form = {
          id: fullProduct.id,
          name: fullProduct.name,
          description: fullProduct.description ?? '',
          price: fullProduct.price,
          stockQuantity: fullProduct.stockQuantity,
          categoryId: this.categories.find(c => c.name === fullProduct.categoryName)?.id ?? '',
          mainImageFile: null,
          // ✅ الصورة الرئيسية: ضيف base URL لو ناقصه
          mainImagePreview: fullProduct.mainImageUrl
            ? 'https://localhost:44395/' + fullProduct.mainImageUrl
            : null,
          // ✅ الصور الإضافية من الـ API
          extraFiles: (fullProduct.images ?? [])
            .filter(img => !img.isMain)
            .map(img => ({
              file: null as any,
              preview: 'https://localhost:44395/' + img.imageUrl,
              existingUrl: img.imageUrl,  // تحتفظ بيها عشان ما تحذفهاش
            })),
        };
        this.showModal = true;
        this.cdr.markForCheck();
      },
    });
  }

  closeModal(): void { this.showModal = false; this.cdr.markForCheck(); }

  onMainImageSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.form.mainImageFile = file;
    const r = new FileReader();
    r.onload = ev => {
      this.form.mainImagePreview = ev.target?.result as string;
      this.cdr.markForCheck();
    };
    r.readAsDataURL(file);
  }

  onExtraImagesSelected(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    files.forEach(file => {
      const r = new FileReader();
      r.onload = ev => {
        this.form.extraFiles.push({ file, preview: ev.target?.result as string });
        this.cdr.markForCheck();
      };
      r.readAsDataURL(file);
    });
  }

  removeExtraImage(idx: number): void {
    this.form.extraFiles.splice(idx, 1);
    this.cdr.markForCheck();
  }

  // استبدل الـ submitForm() الموجود بالكامل بالكود ده

  submitForm(): void {
    this.modalError = null;
    if (!this.form.name.trim()) { this.modalError = 'Product name is required.'; return; }
    if (this.form.price <= 0) { this.modalError = 'Price must be greater than 0.'; return; }
    if (!this.form.categoryId) { this.modalError = 'Please select a category.'; return; }

    this.modalLoading = true;
    this.cdr.markForCheck();

    if (this.isEditMode) {
      // ── Edit: update text fields only ──────────────────────────────────────
      this.svc.updateProduct(this.form.id, {
        name: this.form.name,
        description: this.form.description,
        price: this.form.price,
        stockQuantity: this.form.stockQuantity,
        categoryId: Number(this.form.categoryId),
      }).subscribe({
        next: () => {
          // If a new main image was selected during edit, upload it too
          if (this.form.mainImageFile) {
            this.svc.addProductImage(this.form.id, this.form.mainImageFile, true)
              .subscribe({ next: () => this.afterSave(), error: () => this.afterSave() });
          } else {
            this.afterSave();
          }
        },
        error: () => {
          this.modalError = 'Update failed. Please try again.';
          this.modalLoading = false;
          this.cdr.markForCheck();
        },
      });

    } else {
      // ── Add: create product + all images in one call ───────────────────────
      this.svc.addProductWithImages({
        name: this.form.name,
        description: this.form.description,
        price: this.form.price,
        stockQuantity: this.form.stockQuantity,
        categoryId: Number(this.form.categoryId),
        mainImage: this.form.mainImageFile ?? undefined,
        extraImages: this.form.extraFiles
          .map(f => f.file)
          .filter((f): f is File => f !== null),
      }).subscribe({
        next: () => this.afterSave(),
        error: () => {
          this.modalError = 'Failed to create product. Please try again.';
          this.modalLoading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  private afterSave(): void {
    this.modalLoading = false;
    this.showModal = false;
    this.fetchProducts();
    this.cdr.markForCheck();
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  openDeleteModal(p: ProductResponse, event: Event): void {
    event.stopPropagation();
    this.deletingProduct = p;
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void { this.showDeleteModal = false; this.deletingProduct = null; this.cdr.markForCheck(); }

  confirmDelete(): void {
    if (!this.deletingProduct) return;
    this.deleteLoading = true; this.cdr.markForCheck();
    this.svc.deleteProduct(this.deletingProduct.id).subscribe({
      next: () => {
        if (this.selectedProduct?.id === this.deletingProduct?.id) this.selectedProduct = null;
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.fetchProducts();
      },
      error: () => { this.deleteLoading = false; this.cdr.markForCheck(); },
    });
  }

  // ── Category Manager ───────────────────────────────────────────────────────
  toggleCatPanel(): void { this.showCatPanel = !this.showCatPanel; this.cdr.markForCheck(); }

  addCategory(): void {
    if (!this.newCatName.trim()) return;
    this.catLoading = true; this.catError = null; this.cdr.markForCheck();
    this.svc.addCategory(this.newCatName.trim()).subscribe({
      next: (res) => {
        this.categories = [...this.categories, { id: res.id, name: this.newCatName.trim() }];
        this.newCatName = '';
        this.catLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.catError = 'Failed to add category.'; this.catLoading = false; this.cdr.markForCheck(); },
    });
  }

  removeCategory(cat: CategoryResponse): void {
    this.svc.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== cat.id);
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; this.cdr.markForCheck(); }

  getStockDot(qty: number): string {
    if (qty === 0) return 'bg-red-500';
    if (qty <= 5) return 'bg-amber-500';
    return 'bg-emerald-500';
  }
  getStockClass(qty: number): string {
    if (qty === 0) return 'text-red-600';
    if (qty <= 5) return 'text-amber-600';
    return 'text-emerald-700';
  }
  getStockLabel(qty: number): string {
    if (qty === 0) return 'Out of Stock';
    if (qty <= 5) return `Low (${qty})`;
    return `In Stock (${qty})`;
  }
  getInitials(name: string): string {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  private emptyForm(): ProductForm {
    return {
      id: 0, name: '', description: '', price: 0, stockQuantity: 0,
      categoryId: '', mainImageFile: null, mainImagePreview: null, extraFiles: []
    };
  }
}
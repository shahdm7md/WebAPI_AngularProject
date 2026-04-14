import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  BannerResponse,
  CreateBannerRequest,
  UpdateBannerRequest,
  BannerResult,
} from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin-api.service';
import { API_BASE_URL } from '../../../core/config/api.config';

@Component({
  selector: 'app-manage-banners',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-banners.component.html',
  styleUrls: ['./manage-banners.component.css'],
})
export class ManageBannersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly cdr          = inject(ChangeDetectorRef);

  // ===== State =====
  isLoading    = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage   = '';
  modalError     = '';

  // ===== Data =====
  banners: BannerResponse[] = [];

  // ===== Modal =====
  showModal = false;
  editMode  = false;
  editId: number | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  form: CreateBannerRequest = this.emptyForm();
  baseUrl: string = inject(API_BASE_URL);

  // ===== Computed =====
  get activeCount(): number   { return this.banners.filter(b => b.isActive).length; }
  get inactiveCount(): number { return this.banners.filter(b => !b.isActive).length; }
  get sortedBanners(): BannerResponse[] {
    return [...this.banners].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  navItems = [
    { icon: 'dashboard',     label: 'Dashboard', route: '/admin/dashboard', active: false },
    { icon: 'group',         label: 'Users',     route: '/admin/users',     active: false },
    { icon: 'storefront',    label: 'Vendors',   route: '/admin/users',     active: false },
    { icon: 'inventory_2',   label: 'Products',  route: '/admin/products',  active: false },
    { icon: 'shopping_cart', label: 'Orders',    route: '/admin/orders',    active: false },
    { icon: 'sell',          label: 'Coupons',   route: '/admin/coupons',   active: false },
    { icon: 'ad_units',      label: 'Banners',   route: '/admin/banners',   active: true  },
    { icon: 'settings',      label: 'Settings',  route: '/admin/settings',  active: false },
  ];

  ngOnInit(): void { this.loadBanners(); }

  // ===== Load =====
  loadBanners(): void {
    this.isLoading    = true;
    this.errorMessage = '';

    this.adminService.getBanners().subscribe({
      next: (res: BannerResponse[]) => {
        this.banners   = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load banners.');
        this.isLoading    = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ===== Modal: Create =====
  openCreate(): void {
    this.editMode     = false;
    this.editId       = null;
    this.form         = this.emptyForm();
    this.selectedFile = null;
    this.previewUrl   = null;
    this.modalError   = '';
    this.showModal    = true;
  }

  // ===== Modal: Edit =====
  openEdit(b: BannerResponse): void {
    this.editMode   = true;
    this.editId     = b.id;
    this.form       = { title: b.title, link: b.link, displayOrder: b.displayOrder };
    this.previewUrl = b.imageUrl || null;
    this.selectedFile = null;
    this.modalError = '';
    this.showModal  = true;
  }

  closeModal(): void { this.showModal = false; this.modalError = ''; }

  // ===== File picker =====
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  // ===== Submit =====
  submit(): void {
    if (!this.form.title.trim()) { this.modalError = 'Title is required.'; return; }
    if (!this.editMode && !this.selectedFile) { this.modalError = 'Please select an image.'; return; }

    this.isSubmitting = true;
    this.modalError   = '';

    if (this.editMode && this.editId !== null) {
      const payload: UpdateBannerRequest = {
        title:        this.form.title,
        link:         this.form.link,
        isActive:     true,
        displayOrder: this.form.displayOrder,
      };
      this.adminService.updateBanner(this.editId, payload).subscribe({
        next: (res: BannerResult) => { this.onSuccess(res.message || 'Banner updated.'); },
        error: (err: unknown) => { this.onModalError(err); },
      });
    } else {
      this.adminService.createBanner(this.form, this.selectedFile ?? undefined).subscribe({
        next: (res: BannerResult) => { this.onSuccess(res.message || 'Banner created.'); },
        error: (err: unknown) => { this.onModalError(err); },
      });
    }
  }

  // ===== Toggle Active =====
  toggleActive(b: BannerResponse): void {
    const payload: UpdateBannerRequest = {
      title: b.title, link: b.link,
      isActive: !b.isActive, displayOrder: b.displayOrder,
    };
    this.adminService.updateBanner(b.id, payload).subscribe({
      next: () => { this.showSuccess(`Banner ${!b.isActive ? 'activated' : 'deactivated'}.`); this.loadBanners(); },
      error: (err: unknown) => { this.showError(this.extractError(err, 'Failed to update.')); },
    });
  }

  // ===== Delete =====
  deleteBanner(id: number, title: string): void {
    if (!confirm(`Delete banner "${title}"?`)) return;
    this.adminService.deleteBanner(id).subscribe({
      next: () => { this.showSuccess('Banner deleted.'); this.loadBanners(); },
      error: (err: unknown) => { this.showError(this.extractError(err, 'Failed to delete.')); },
    });
  }

  // ===== Helpers =====
  private emptyForm(): CreateBannerRequest {
    return { title: '', link: '', displayOrder: this.banners.length + 1 };
  }

  private onSuccess(msg: string): void {
    this.isSubmitting = false;
    this.closeModal();
    this.showSuccess(msg);
    this.loadBanners();
  }

  private onModalError(err: unknown): void {
    this.modalError   = this.extractError(err, 'Operation failed.');
    this.isSubmitting = false;
  }

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

import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  CouponResponse,
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponResult,
} from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-manage-coupons',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-coupons.component.html',
  styleUrls: ['./manage-coupons.component.css'],
})
export class ManageCouponsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly cdr          = inject(ChangeDetectorRef);

  isLoading      = false;
  isSubmitting   = false;
  successMessage = '';
  errorMessage   = '';
  modalError     = '';
  searchTerm     = '';

  coupons: CouponResponse[] = [];

  showModal = false;
  editMode  = false;
  editId: number | null = null;
  form: CreateCouponRequest = this.emptyForm();

  get filtered(): CouponResponse[] {
    if (!this.searchTerm.trim()) return this.coupons;
    const q = this.searchTerm.toLowerCase();
    return this.coupons.filter(c => c.code.toLowerCase().includes(q));
  }

  get totalCount(): number   { return this.coupons.length; }
  get activeCount(): number  { return this.coupons.filter(c => c.isActive && !this.isExpired(c)).length; }
  get expiredCount(): number { return this.coupons.filter(c => this.isExpired(c)).length; }
  get usedToday(): number    { return 0; }

  navItems = [
    { icon: 'dashboard',     label: 'Dashboard', route: '/admin/dashboard', active: false },
    { icon: 'group',         label: 'Users',     route: '/admin/users',     active: false },
   { icon: 'storefront',    label: 'Vendors',   route: '/admin/users',     active: false },
    { icon: 'inventory_2',   label: 'Products',  route: '/admin/products',  active: false },
    { icon: 'shopping_cart', label: 'Orders',    route: '/admin/orders',    active: false },
    { icon: 'sell',          label: 'Coupons',   route: '/admin/coupons',   active: true  },
    { icon: 'ad_units',      label: 'Banners',   route: '/admin/banners',   active: false },
    { icon: 'settings',      label: 'Settings',  route: '/admin/settings',  active: false },
  ];

  ngOnInit(): void { this.loadCoupons(); }

  loadCoupons(): void {
    this.isLoading    = true;
    this.errorMessage = '';
    this.adminService.getCoupons().subscribe({
      next: (res: CouponResponse[]) => {
        this.coupons   = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load coupons.');
        this.isLoading    = false;
        this.cdr.detectChanges();
      },
    });
  }

  openCreate(): void {
    this.editMode = false; this.editId = null;
    this.form = this.emptyForm(); this.modalError = ''; this.showModal = true;
  }

  openEdit(c: CouponResponse): void {
    console.log('Coupon data from API:', c);
    this.editMode = true; this.editId = c.id;
    this.form = {
      code:           c.code,
      discountType:   this.resolveType(c.discountType),
      Value: c.value,
      minOrderAmount: c.minOrderAmount,
      usageLimit:     c.usageLimit,
      expiryDate:     c.expiryDate.substring(0, 10),
    };
    this.modalError = ''; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.modalError = ''; }

  submit(): void {
    if (!this.form.code.trim())        { this.modalError = 'Coupon code is required.'; return; }
    if (this.form.Value <= 0)  { this.modalError = 'Discount value must be > 0.'; return; }
    if (!this.form.expiryDate)         { this.modalError = 'Expiry date is required.'; return; }

    this.isSubmitting = true;
    this.modalError   = '';

    if (this.editMode && this.editId !== null) {
      const payload: any = {
discountType: this.form.discountType === 'Percentage' ? 0 : 1,
        Value: this.form.Value,    
     minOrderAmount: this.form.minOrderAmount,
        usageLimit:     this.form.usageLimit,
        expiryDate:     new Date(this.form.expiryDate).toISOString(),
        isActive:       true,
      };
      this.adminService.updateCoupon(this.editId, payload).subscribe({
        next: (res: CouponResult) => { this.onSuccess(res.message || 'Coupon updated.'); },
        error: (err: unknown) => { this.onModalError(err); 
          this.isSubmitting = false;
        },
      });
    } else {
      const raw = {
        code:           this.form.code.toUpperCase().trim(),
        discountType:   this.form.discountType === 'Percentage' ? 0 : 1,
        Value:  this.form.Value,
        minOrderAmount: this.form.minOrderAmount ?? 0,
        usageLimit:     this.form.usageLimit,
        expiryDate:     new Date(this.form.expiryDate).toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.adminService.createCoupon(raw as any).subscribe({
        next: (res: CouponResult) => { this.onSuccess(res.message || 'Coupon created.'); },
        error: (err: unknown) => { this.onModalError(err); },
      });
    }
  }

  deleteCoupon(id: number, code: string): void {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    this.adminService.deleteCoupon(id).subscribe({
      next: () => { this.showSuccess('Coupon deleted.'); this.loadCoupons(); },
      error: (err: unknown) => { this.showError(this.extractError(err, 'Failed to delete.')); },
    });
  }

  isExpired(c: CouponResponse): boolean {
    return new Date(c.expiryDate) < new Date();
  }

  getUsagePercent(c: CouponResponse): number {
    if (!c.usageLimit) return 0;
    return Math.min(100, Math.round((c.usedCount / c.usageLimit) * 100));
  }

  getStatusClass(c: CouponResponse): string {
    if (this.isExpired(c)) return 'status-expired';
    return c.isActive ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(c: CouponResponse): string {
    if (this.isExpired(c)) return 'Expired';
    return c.isActive ? 'Active' : 'Inactive';
  }

  resolveType(val: string | number): 'Percentage' | 'Fixed' {
    if (val === 0 || val === '0' || val === 'Percentage') return 'Percentage';
    return 'Fixed';
  }

  formatValue(c: CouponResponse): string {
    const isPercent = this.resolveType(c.discountType) === 'Percentage';
    return isPercent ? `${c.value}%` : `$${Number(c.value).toFixed(2)}`;
  }

  getTypeLabel(c: CouponResponse): string {
    return this.resolveType(c.discountType) === 'Percentage' ? 'Percentage' : 'Fixed Amount';
  }

  private emptyForm(): CreateCouponRequest {
    return { code: '', discountType: 'Percentage', Value: 0, usageLimit: 100, expiryDate: '' };
  }

  private onSuccess(msg: string): void {
    this.isSubmitting = false; this.closeModal();
    this.showSuccess(msg); this.loadCoupons();
  }

  private onModalError(err: unknown): void {
    this.modalError = this.extractError(err, 'Operation failed.');
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
    if (typeof p === 'string' && p.trim()) return p;
    if (typeof p === 'object' && p !== null) {
      const msgs = Object.values(p as Record<string, unknown>)
        .flat().filter((v): v is string => typeof v === 'string');
      if (msgs.length) return msgs.join(' ');
    }
    return fallback;
  }
}
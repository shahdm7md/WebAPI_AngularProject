import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  UserSummaryResponse,
  SellerSummaryResponse,
  PaginatedResponse,
} from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin-api.service';

type ActiveTab = 'all' | 'customers' | 'sellers-pending' | 'sellers-active';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css'],
})
export class ManageUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  // بدل cdr: any; اكتب السطر ده:
private readonly cdr = inject(ChangeDetectorRef);

  // ===== State =====
  activeTab: ActiveTab = 'all';
  isLoading   = false;
  actionLoading: Record<string, boolean> = {};
  errorMessage  = '';
  successMessage = '';

  // ===== Data =====
  users: UserSummaryResponse[]     = [];
  pendingSellers: SellerSummaryResponse[] = [];

  // ===== Pagination =====
  currentPage = 1;
  pageSize    = 10;
  totalCount  = 0;
Math = Math;

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

  get pendingCount(): number {
    return this.pendingSellers.length;
  }

  navItems = [
    { icon: 'dashboard',     label: 'Dashboard', route: '/admin/dashboard', active: false },
    { icon: 'group',         label: 'Users',     route: '/admin/users',     active: true  },
    { icon: 'storefront',    label: 'Vendors',   route: '/admin/users',     active: false },
    { icon: 'inventory_2',   label: 'Products',  route: '/admin/products',  active: false },
    { icon: 'shopping_cart', label: 'Orders',    route: '/admin/orders',    active: false },
    { icon: 'sell',      label: 'Coupons',   route: '/admin/coupons',   active: false },
    { icon: 'ad_units',      label: 'Banners',   route: '/admin/banners',   active: false }, 
    { icon: 'settings',      label: 'Settings',  route: '/admin/settings',  active: false },
  ];

  ngOnInit(): void {
    this.loadData();
    this.loadPendingSellers();
  }

  // ===== Load =====
  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.activeTab === 'sellers-pending') {
      this.loadPendingSellers();
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const role = this.activeTab === 'customers'      ? 'Customer'
               : this.activeTab === 'sellers-active' ? 'Seller'
               : undefined;

    this.adminService.getAllUsers(role, this.currentPage, this.pageSize).subscribe({
      next: (res: PaginatedResponse<UserSummaryResponse>) => {
        this.users      = res.data;
        this.totalCount = res.totalCount;
        this.isLoading  = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load users.');
        this.isLoading    = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadPendingSellers(): void {
    this.adminService.getPendingSellers().subscribe({
      next: (res: SellerSummaryResponse[]) => {
        this.pendingSellers = res;
        if (this.activeTab === 'sellers-pending') {
          this.totalCount = res.length;
        }
      },
      error: (err: unknown) => {
        console.error('Failed to load pending sellers', err);
      },
    });
  }

  // ===== Actions =====
  toggleActive(userId: string): void {
    this.actionLoading[userId] = true;
    this.adminService.toggleActive(userId).subscribe({
      next: (res) => {
        this.showSuccess(res.message);
        this.loadData();
        this.actionLoading[userId] = false;
      },
      error: (err: unknown) => {
        this.showError(this.extractError(err, 'Failed to update user status.'));
        this.actionLoading[userId] = false;
      },
    });
  }

  approveSeller(userId: string): void {
    this.actionLoading[userId] = true;
    this.adminService.approveSeller(userId).subscribe({
      next: (res) => {
        this.showSuccess(res.message);
        this.loadPendingSellers();
        this.actionLoading[userId] = false;
      },
      error: (err: unknown) => {
        this.showError(this.extractError(err, 'Failed to approve seller.'));
        this.actionLoading[userId] = false;
      },
    });
  }

  rejectSeller(userId: string): void {
    this.actionLoading[userId] = true;
    this.adminService.rejectSeller(userId).subscribe({
      next: (res) => {
        this.showSuccess(res.message);
        this.loadPendingSellers();
        this.actionLoading[userId] = false;
      },
      error: (err: unknown) => {
        this.showError(this.extractError(err, 'Failed to reject seller.'));
        this.actionLoading[userId] = false;
      },
    });
  }

  // ===== Tabs =====
  setTab(tab: ActiveTab): void {
    this.activeTab   = tab;
    this.currentPage = 1;
    this.users       = [];
    this.loadData();
  }

  // ===== Pagination =====
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadData();
  }

  // ===== Helpers =====
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getRoleClass(role: string): string {
    const map: Record<string, string> = {
      Admin:    'role-admin',
      Seller:   'role-seller',
      Customer: 'role-customer',
    };
    return map[role] ?? 'role-customer';
  }

  isActionLoading(id: string): boolean {
    return !!this.actionLoading[id];
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
    const maybeError = error as { error?: unknown } | null;
    const payload    = maybeError?.error;
    if (typeof payload === 'string' && payload.trim().length > 0) return payload;
    return fallback;
  }
}

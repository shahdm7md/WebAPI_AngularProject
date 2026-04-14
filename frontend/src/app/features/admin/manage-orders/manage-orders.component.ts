import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  AdminOrderResponse,
  PaginatedResponse,
  UpdateOrderStatusResult,
} from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin-api.service';

type OrderStatus = 'All' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

@Component({
  selector: 'app-manage-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-orders.component.html',
  styleUrls: ['./manage-orders.component.css'],
})
export class ManageOrdersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly cdr          = inject(ChangeDetectorRef);

  // ===== State =====
  isLoading      = false;
  actionLoading: Record<number, boolean> = {};
  successMessage = '';
  errorMessage   = '';

  // ===== Data =====
  orders: AdminOrderResponse[] = [];

  // ===== Filters =====
  searchTerm     = '';
  selectedStatus: OrderStatus = 'All';

  // ===== Pagination =====
  currentPage = 1;
  pageSize    = 10;
  totalCount  = 0;
  protected readonly Math = Math;

  readonly statusOptions: OrderStatus[] = [
    'All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled',
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

  get filteredOrders(): AdminOrderResponse[] {
    if (!this.searchTerm.trim()) return this.orders;
    const q = this.searchTerm.toLowerCase();
    return this.orders.filter(o =>
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      String(o.id).includes(q)
    );
  }

  get pendingCount(): number  { return this.orders.filter(o => o.status === 'Pending').length; }
  get deliveredCount(): number { return this.orders.filter(o => o.status === 'Delivered').length; }
  get cancelledCount(): number { return this.orders.filter(o => o.status === 'Cancelled').length; }

  navItems = [
    { icon: 'dashboard',     label: 'Dashboard', route: '/admin/dashboard', active: false },
    { icon: 'group',         label: 'Users',     route: '/admin/users',     active: false },
    { icon: 'storefront',    label: 'Vendors',   route: '/admin/users',     active: false },
    { icon: 'inventory_2',   label: 'Products',  route: '/admin/products',  active: false },
    { icon: 'shopping_cart', label: 'Orders',    route: '/admin/orders',    active: true  },
    { icon: 'sell',          label: 'Coupons',   route: '/admin/coupons',   active: false },
    { icon: 'ad_units',      label: 'Banners',   route: '/admin/banners',   active: false },
    { icon: 'settings',      label: 'Settings',  route: '/admin/settings',  active: false },
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  // ===== Load =====
  loadOrders(): void {
    this.isLoading    = true;
    this.errorMessage = '';

    const status = this.selectedStatus === 'All' ? undefined : this.selectedStatus;

    this.adminService.getAllOrders(status, this.currentPage, this.pageSize).subscribe({
      next: (res: PaginatedResponse<AdminOrderResponse>) => {
        this.orders     = res.data;
        this.totalCount = res.totalCount;
        this.isLoading  = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load orders.');
        this.isLoading    = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ===== Filter by status tab =====
  setStatus(status: OrderStatus): void {
    this.selectedStatus = status;
    this.currentPage    = 1;
    this.loadOrders();
  }

  // ===== Update Status =====
  updateStatus(orderId: number, newStatus: string): void {
    this.actionLoading[orderId] = true;

    this.adminService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (res: UpdateOrderStatusResult) => {
        this.showSuccess(res.message || 'Order status updated.');
        this.loadOrders();
        this.actionLoading[orderId] = false;
      },
      error: (err: unknown) => {
        this.showError(this.extractError(err, 'Failed to update order status.'));
        this.actionLoading[orderId] = false;
      },
    });
  }

  // ===== Pagination =====
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadOrders();
  }

  // ===== Helpers =====
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Pending:    'status-pending',
      Processing: 'status-processing',
      Shipped:    'status-shipped',
      Delivered:  'status-delivered',
      Cancelled:  'status-cancelled',
    };
    return map[status] ?? 'status-pending';
  }

  getNextStatuses(current: string): string[] {
    const flow: Record<string, string[]> = {
      Pending:    ['Processing', 'Cancelled'],
      Processing: ['Shipped',    'Cancelled'],
      Shipped:    ['Delivered',  'Cancelled'],
      Delivered:  [],
      Cancelled:  [],
    };
    return flow[current] ?? [];
  }

  isActionLoading(id: number): boolean {
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
    const e = error as { error?: unknown } | null;
    const p = e?.error;
    if (typeof p === 'string' && p.trim().length > 0) return p;
    return fallback;
  }
}

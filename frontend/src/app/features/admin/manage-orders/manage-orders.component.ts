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

// ✅ C# OrderStatus enum — غيّر الأرقام لو الباك بتاعك مختلف
const STATUS_MAP: Record<number, string> = {
  0: 'Pending',
  1: 'Processing',
  2: 'Shipped',
  3: 'Delivered',
  4: 'Cancelled',
};

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

  isLoading      = false;
  actionLoading: Record<number, boolean> = {};
  successMessage = '';
  errorMessage   = '';

  orders: AdminOrderResponse[] = [];

  searchTerm     = '';
  selectedStatus: OrderStatus = 'All';

  currentPage = 1;
  pageSize    = 10;
  totalCount  = 0;
  protected readonly Math = Math;

  readonly statusOptions: OrderStatus[] = [
    'All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled',
  ];

  get totalPages(): number { return Math.ceil(this.totalCount / this.pageSize); }

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

  get pendingCount(): number   { return this.orders.filter(o => this.resolveStatus(o.status) === 'Pending').length; }
  get deliveredCount(): number { return this.orders.filter(o => this.resolveStatus(o.status) === 'Delivered').length; }
  get cancelledCount(): number { return this.orders.filter(o => this.resolveStatus(o.status) === 'Cancelled').length; }

  navItems = [
    { icon: 'dashboard',     label: 'Dashboard', route: '/admin/dashboard', active: false },
    { icon: 'group',         label: 'Users',     route: '/admin/users',     active: false },
    { icon: 'inventory_2',   label: 'Products',  route: '/admin/products',  active: false },
    { icon: 'shopping_cart', label: 'Orders',    route: '/admin/orders',    active: true  },
    { icon: 'sell',          label: 'Coupons',   route: '/admin/coupons',   active: false },
    { icon: 'ad_units',      label: 'Banners',   route: '/admin/banners',   active: false },
     ];

  ngOnInit(): void { 
    console.log('Component Initialized');
    this.loadOrders(); }
// تأكدي إن الخريطة (Map) مطابقة للأرقام اللي في الداتا بيز عندك
statusMap: Record<string, string> = {
  'Pending': '0',
  'Processing': '1',
  'Shipped': '2',
  'Delivered': '3',
  'Cancelled': '4'
};

loadOrders(): void {
  this.isLoading = true;
  
  // بنجيب القيمة النصية للرقم من الخريطة
  const statusToSend = this.selectedStatus === 'All' ? undefined : this.statusMap[this.selectedStatus];

  this.adminService.getAllOrders(statusToSend, this.currentPage, this.pageSize).subscribe({
    next: (res) => {
      this.orders = res.data; // الداتا هتنزل هنا مظبوطة
      this.totalCount = res.totalCount;
      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.isLoading = false;
    }
  });
}


  setStatus(status: OrderStatus): void {
    this.selectedStatus = status;
    this.currentPage    = 1;
    this.loadOrders();
  }

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

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadOrders();
  }

  // ✅ يتعامل مع رقم (0-4) أو string ('Pending'...)
  resolveStatus(val: string | number): string {
    if (typeof val === 'number') return STATUS_MAP[val] ?? 'Pending';
    const n = Number(val);
    if (!isNaN(n) && STATUS_MAP[n]) return STATUS_MAP[n];
    return String(val);
  }

  getStatusClass(status: string | number): string {
    const s = this.resolveStatus(status);
    const map: Record<string, string> = {
      Pending:    'status-pending',
      Processing: 'status-processing',
      Shipped:    'status-shipped',
      Delivered:  'status-delivered',
      Cancelled:  'status-cancelled',
    };
    return map[s] ?? 'status-pending';
  }

  getNextStatuses(current: string | number): string[] {
    const s = this.resolveStatus(current);
    const flow: Record<string, string[]> = {
      Pending:    ['Processing', 'Cancelled'],
      Processing: ['Shipped',    'Cancelled'],
      Shipped:    ['Delivered',  'Cancelled'],
      Delivered:  [],
      Cancelled:  [],
    };
    return flow[s] ?? [];
  }

  isActionLoading(id: number): boolean { return !!this.actionLoading[id]; }

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
    return fallback;
  }
}
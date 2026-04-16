import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  SellerOrderResponse,
  SellerProfileResponse,
  SellerService,
} from '../../../core/services/seller.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './order-management.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerOrdersComponent implements OnInit {
  private readonly sellerService = inject(SellerService);
  private readonly authService   = inject(AuthService);
  private readonly cdr           = inject(ChangeDetectorRef);

  loading      = true;
  sidebarOpen  = false;
  error: string | null = null;

  profile: SellerProfileResponse | null = null;
  orders: SellerOrderResponse[]         = [];
  selectedStatus = '';

  // Status update
  updatingOrderId: number | null = null;

  readonly statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  readonly filterOptions = [
    { label: 'All Orders', value: '' },
    { label: 'Pending',    value: 'Pending' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Shipped',    value: 'Shipped' },
    { label: 'Delivered',  value: 'Delivered' },
    { label: 'Cancelled',  value: 'Cancelled' },
  ];

  get userName(): string { return this.authService.getCurrentUserName(); }

  get totalOrders(): number   { return this.orders.length; }
  get pendingCount(): number  { return this.orders.filter(o => o.status === 'Pending').length; }
  get shippedCount(): number  { return this.orders.filter(o => o.status === 'Shipped').length; }
  get avgValue(): number {
    if (!this.orders.length) return 0;
    return this.orders.reduce((s, o) => s + o.totalAmount, 0) / this.orders.length;
  }

  ngOnInit(): void {
    this.sellerService.getProfile().subscribe({
      next: (p) => { this.profile = p; this.cdr.markForCheck(); },
      error: () => {},
    });
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.sellerService.getOrders(this.selectedStatus || undefined).subscribe({
      next: (orders) => {
        this.orders  = orders;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error   = 'Failed to load orders.';
        this.loading = false;
        this.cdr.markForCheck();
        console.error(err);
      },
    });
  }

  onStatusFilterChange(): void {
    this.loadOrders();
  }

  updateOrderStatus(order: SellerOrderResponse, newStatus: string): void {
    if (!newStatus || newStatus === order.status) return;
    this.updatingOrderId = order.id;
    this.cdr.markForCheck();

    this.sellerService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updated) => {
        const idx = this.orders.findIndex(o => o.id === updated.id);
        if (idx !== -1) this.orders[idx] = updated;
        this.orders          = [...this.orders];
        this.updatingOrderId = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.updatingOrderId = null;
        this.cdr.markForCheck();
      },
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.markForCheck();
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Delivered:  'bg-emerald-100 text-emerald-700',
      Shipped:    'bg-blue-100 text-blue-700',
      Processing: 'bg-amber-100 text-amber-700',
      Pending:    'bg-orange-100 text-orange-700',
      Cancelled:  'bg-slate-100 text-slate-600',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
  }

  getStatusDot(status: string): string {
    const map: Record<string, string> = {
      Delivered:  'bg-emerald-500',
      Shipped:    'bg-blue-500',
      Processing: 'bg-amber-500',
      Pending:    'bg-orange-500',
      Cancelled:  'bg-slate-400',
    };
    return map[status] ?? 'bg-slate-400';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarBg(name: string): string {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  }

  getAvailableStatuses(currentStatus: string): string[] {
    return this.statusOptions.filter(s => s !== currentStatus);
  }
}
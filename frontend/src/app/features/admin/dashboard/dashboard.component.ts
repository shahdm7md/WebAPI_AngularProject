import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DashboardStatsResponse } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin-api.service';

interface RecentOrder {
  id: string;
  customerName: string;
  initials: string;
  avatarColor: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Processing' | 'Shipped' | 'Cancelled';
}

interface TopSeller {
  rank: number;
  name: string;
  category: string;
  revenue: string;
  growth: string;
  rankColor: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {

  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  stats: DashboardStatsResponse = {
    totalUsers: 0,
    activeSellers: 0,
    pendingSellers: 0,
    totalOrders: 0,
    totalOrdersToday: 0,
    netRevenue: 0,
    lowStockProducts: 0,
  };

  recentOrders: RecentOrder[] = [];

  isLoading = true;
  hasError = false;
  errorMessage = '';

  topSellers: TopSeller[] = [];

  chartBars = [45, 65, 55, 85, 75, 95, 60, 40, 50, 70];
  chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];

  navItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard', active: true },
    { icon: 'group', label: 'Users', route: '/admin/users', active: false },
    { icon: 'inventory_2', label: 'Products', route: '/admin/products', active: false },
    { icon: 'shopping_cart', label: 'Orders', route: '/admin/orders', active: false },
    { icon: 'sell', label: 'Coupons', route: '/admin/coupons', active: false },
    { icon: 'ad_units', label: 'Banners', route: '/admin/banners', active: false },
  ];
getRankColor(rank: number): string {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return '';
}
  ngOnInit(): void {
    this.loadStats();
    this.loadRecentOrders();
     this.loadTopSellers();
  }

  // ================== API CALLS ==================

  loadStats(): void {
    this.isLoading = true;
    this.hasError = false;

    this.adminService.getDashboardStats().subscribe({
      next: (data: DashboardStatsResponse) => {
        this.stats = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err);
        this.hasError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
loadTopSellers(): void {
  this.adminService.getAllOrders(undefined, 1, 100).subscribe({
    next: (res: any) => {
      const orders = res.data || res.items || [];

      const sellerMap = new Map<string, any>();

      orders.forEach((order: any) => {
        const sellerName = order.sellerName || 'Unknown Seller';
        const category = order.categoryName || 'General';
        const amount = order.totalAmount || 0;

        if (!sellerMap.has(sellerName)) {
          sellerMap.set(sellerName, {
            name: sellerName,
            category: category,
            revenue: 0,
          });
        }

        sellerMap.get(sellerName).revenue += amount;
      });

      const sorted = Array.from(sellerMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      this.topSellers = sorted.map((seller, index) => ({
        rank: index + 1,
        name: seller.name,
        category: seller.category,
        revenue: `$${seller.revenue.toLocaleString()}`,
        growth: '↑ 0%', // مؤقت لحد ما تعملي API حقيقي
        rankColor: this.getRankColor(index + 1)
      }));

      this.cdr.detectChanges();
    },
    error: () => {
      console.error('Error loading top sellers');
    }
  });
}
  loadRecentOrders(): void {
    this.adminService.getAllOrders(undefined, 1, 5).subscribe({
      next: (res: any) => {
        const orders = res.data || res.items || [];

        this.recentOrders = orders.map((order: any) => ({
          id: order.id,
          customerName: order.customerName,
          initials: this.getInitials(order.customerName),
          avatarColor: 'blue',
          date: new Date(order.createdAt).toLocaleDateString(),
          amount: order.totalAmount,
          status: this.mapStatus(order.status)
        }));

        this.cdr.detectChanges();
      },
      error: () => {
        console.error('Error loading orders');
      }
    });
  }

  // ================== HELPERS ==================

  getInitials(name: string): string {
    return name
      ?.split(' ')
      ?.map(n => n[0])
      ?.join('')
      ?.toUpperCase() || '';
  }

  mapStatus(status: string): 'Completed' | 'Processing' | 'Shipped' | 'Cancelled' {
    const map: any = {
      completed: 'Completed',
      pending: 'Processing',
      processing: 'Processing',
      shipped: 'Shipped',
      cancelled: 'Cancelled'
    };

    return map[status?.toLowerCase()] || 'Processing';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Completed: 'status-completed',
      Processing: 'status-processing',
      Shipped: 'status-shipped',
      Cancelled: 'status-cancelled',
    };
    return map[status] ?? '';
  }

  getAvatarClass(color: string): string {
    const map: Record<string, string> = {
      blue: 'av-blue',
      purple: 'av-purple',
      green: 'av-green',
    };
    return map[color] ?? 'av-blue';
  }

  private extractError(error: unknown): string {
    const maybeError = error as { error?: unknown } | null;
    const payload = maybeError?.error;
    if (typeof payload === 'string' && payload.trim().length > 0) return payload;
    return 'Failed to load dashboard stats';
  }
}
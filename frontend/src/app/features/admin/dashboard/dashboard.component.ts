import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DashboardStatsResponse } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin-api.service';
import { ChangeDetectorRef } from '@angular/core';




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

  stats: DashboardStatsResponse = {
    totalUsers: 0,
    activeSellers: 0,
    pendingSellers: 0,
    totalOrders: 0,
    totalOrdersToday: 0,
    netRevenue: 0,
    lowStockProducts: 0,
  };

  isLoading = true;
  hasError  = false;
  errorMessage = '';
  

  // Mock data — هيتبدل لما Dev 3 يخلص
  recentOrders: RecentOrder[] = [
    { id: '#ORD-9421', customerName: 'James Wilson',  initials: 'JW', avatarColor: 'blue',   date: 'Oct 24, 2023', amount: 1240.00, status: 'Completed'  },
    { id: '#ORD-9422', customerName: 'Sarah Miller',  initials: 'SM', avatarColor: 'purple', date: 'Oct 24, 2023', amount: 450.50,  status: 'Processing' },
    { id: '#ORD-9423', customerName: 'Tom Baker',     initials: 'TB', avatarColor: 'green',  date: 'Oct 23, 2023', amount: 2890.00, status: 'Shipped'    },
  ];

  topSellers: TopSeller[] = [
    { rank: 1, name: 'Lumina Decor',  category: 'Home & Living', revenue: '$45,210', growth: '↑ 14%', rankColor: 'gold'   },
    { rank: 2, name: 'Urban Threads', category: 'Apparel',       revenue: '$38,900', growth: '↑ 8%',  rankColor: 'silver' },
    { rank: 3, name: 'Pure Organics', category: 'Beauty',        revenue: '$31,450', growth: '↑ 22%', rankColor: 'bronze' },
  ];

  chartBars = [45, 65, 55, 85, 75, 95, 60, 40, 50, 70];
  chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];

  navItems = [
    { icon: 'dashboard',     label: 'Dashboard', route: '/admin/dashboard', active: true  },
   { icon: 'group',         label: 'Users',     route: '/admin/users',     active: false },
    { icon: 'storefront',    label: 'Vendors',   route: '/admin/users',     active: false },
    { icon: 'inventory_2',   label: 'Products',  route: '/admin/products',  active: false },
    { icon: 'shopping_cart', label: 'Orders',    route: '/admin/orders',    active: false },
    { icon: 'sell',  label: 'Coupons',   route: '/admin/coupons',   active: false },
    { icon: 'ad_units',      label: 'Banners',   route: '/admin/banners',   active: false },
    { icon: 'settings',      label: 'Settings',  route: '/admin/settings',  active: false },
  ];
  // بدل cdr: any; اكتب السطر ده:
private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadStats();
  }

loadStats(): void {
  this.isLoading = true;
  this.hasError  = false;

  this.adminService.getDashboardStats().subscribe({
    next: (data: DashboardStatsResponse) => {
      this.stats     = data;
      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: (err: unknown) => {
      this.errorMessage = this.extractError(err);
      this.hasError     = true;
      this.isLoading    = false;
      this.cdr.detectChanges();
    },
  });
}


  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Completed:  'status-completed',
      Processing: 'status-processing',
      Shipped:    'status-shipped',
      Cancelled:  'status-cancelled',
    };
    return map[status] ?? '';
  }

  getAvatarClass(color: string): string {
    const map: Record<string, string> = {
      blue:   'av-blue',
      purple: 'av-purple',
      green:  'av-green',
    };
    return map[color] ?? 'av-blue';
  }

  private extractError(error: unknown): string {
    const maybeError = error as { error?: unknown } | null;
    const payload    = maybeError?.error;
    if (typeof payload === 'string' && payload.trim().length > 0) return payload;
    return 'Failed to load dashboard stats. Make sure the API is running.';
  }
}
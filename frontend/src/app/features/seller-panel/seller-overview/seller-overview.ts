import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, inject, OnInit,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  EarningsSummaryResponse,
  SellerOrderResponse,
  SellerProfileResponse,
  SellerService,
} from '../../../core/services/seller.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, CurrencyPipe, DatePipe],
  templateUrl: './seller-overview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerOverviewComponent implements OnInit {
  private readonly sellerService = inject(SellerService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  sidebarOpen = false;
  error: string | null = null;

  profile: SellerProfileResponse | null = null;
  earnings: EarningsSummaryResponse | null = null;
  recentOrders: SellerOrderResponse[] = [];

  get userName() { return this.authService.getCurrentUserName(); }

  ngOnInit(): void {
    forkJoin({
      profile: this.sellerService.getProfile(),
      earnings: this.sellerService.getEarningsSummary(),
      orders: this.sellerService.getOrders(),
    }).subscribe({
      next: ({ profile, earnings, orders }) => {
        this.profile = profile;
        this.earnings = earnings;
        this.recentOrders = orders.slice(0, 5);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Failed to load dashboard data.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.markForCheck();
  }

  getInitials(name: string): string {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Delivered: 'bg-emerald-100 text-emerald-700',
      Shipped: 'bg-blue-100 text-blue-700',
      Processing: 'bg-amber-100 text-amber-700',
      Pending: 'bg-orange-100 text-orange-700',
      Cancelled: 'bg-slate-100 text-slate-500',
    };
    return map[status] ?? 'bg-slate-100 text-slate-500';
  }

  getStatusDot(status: string): string {
    const map: Record<string, string> = {
      Delivered: 'bg-emerald-500',
      Shipped: 'bg-blue-500',
      Processing: 'bg-amber-500',
      Pending: 'bg-orange-500',
      Cancelled: 'bg-slate-400',
    };
    return map[status] ?? 'bg-slate-400';
  }


  // حساب نسبة التغيير بين الشهر الحالي والشهر اللي فات
  getEarningsGrowth(): string {
    if (!this.earnings) return '0%';
    const last = this.earnings.lastMonthEarnings;
    if (!last || last === 0) return this.earnings.thisMonthEarnings > 0 ? '+100%' : '0%';
    const pct = ((this.earnings.thisMonthEarnings - last) / last) * 100;
    return (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%';
  }

  getEarningsGrowthClass(): string {
    if (!this.earnings || this.earnings.lastMonthEarnings === 0) return 'text-emerald-600 bg-emerald-50';
    const pct = this.earnings.thisMonthEarnings - this.earnings.lastMonthEarnings;
    return pct >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
  }

  getOrdersGrowth(): string {
    if (!this.earnings) return '0%';
    if (!this.earnings.thisMonthOrders || this.earnings.totalOrders === 0) return '0%';
    // نسبة الأوردرات الشهر ده من الإجمالي
    const pct = (this.earnings.thisMonthOrders / this.earnings.totalOrders) * 100;
    return '+' + pct.toFixed(0) + '%';
  }

  getAvgOrderGrowthClass(): string {
    return 'text-blue-600 bg-blue-50';
  }
}
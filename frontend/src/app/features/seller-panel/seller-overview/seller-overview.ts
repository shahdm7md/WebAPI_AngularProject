import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
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
  imports: [CommonModule, RouterLink, RouterLinkActive, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './seller-overview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerOverviewComponent implements OnInit {
  private readonly sellerService = inject(SellerService);
  private readonly authService   = inject(AuthService);
  private readonly cdr           = inject(ChangeDetectorRef);

  loading      = true;
  sidebarOpen  = false;
  error: string | null = null;

  profile: SellerProfileResponse | null       = null;
  earnings: EarningsSummaryResponse | null    = null;
  recentOrders: SellerOrderResponse[]         = [];

  get userName(): string { return this.authService.getCurrentUserName(); }

  ngOnInit(): void {
    forkJoin({
      profile:  this.sellerService.getProfile(),
      earnings: this.sellerService.getEarningsSummary(),
      orders:   this.sellerService.getOrders(),
    }).subscribe({
      next: ({ profile, earnings, orders }) => {
        this.profile      = profile;
        this.earnings     = earnings;
        this.recentOrders = orders.slice(0, 5);
        this.loading      = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error   = 'Failed to load dashboard data.';
        this.loading = false;
        this.cdr.markForCheck();
        console.error(err);
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
}
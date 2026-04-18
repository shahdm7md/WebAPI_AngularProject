import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { OrderResponse, OrderStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.scss']
})
export class OrderSuccessComponent implements OnInit {
  orderId: number | null = null;
  loading = true;
  isSuccess = false;
  error: string | null = null;
  detailsWarning: string | null = null;
  orderData: OrderResponse | null = null;
  readonly OrderStatus = OrderStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private checkoutService: CheckoutService
  ) {}

  ngOnInit(): void {
    const orderIdParam = this.route.snapshot.queryParamMap.get('orderId');
    const sessionId = this.route.snapshot.queryParamMap.get('session_id') ?? undefined;
    const parsedOrderId = Number(orderIdParam);

    if (!orderIdParam || Number.isNaN(parsedOrderId) || parsedOrderId <= 0) {
      this.loading = false;
      this.error = 'Missing order id.';
      this.router.navigate(['/checkout']);
      return;
    }

    this.orderId = parsedOrderId;
    this.paymentService.confirmPayment(parsedOrderId, sessionId).subscribe({
      next: () => {
        this.isSuccess = true;
        this.fetchOrderDetails(parsedOrderId);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.error ?? 'Payment could not be confirmed yet.';
      }
    });
  }

  private fetchOrderDetails(orderId: number): void {
    const navigationOrder = history.state?.order as OrderResponse | undefined;
    if (navigationOrder?.id === orderId) {
      this.orderData = navigationOrder;
      this.loading = false;
      return;
    }

    this.checkoutService.getSummary().subscribe({
      next: (summary) => {
        if (summary?.id === orderId) {
          this.orderData = summary;
        } else {
          this.detailsWarning = 'Order details are not available yet. Please refresh after a few seconds.';
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.detailsWarning = 'Payment confirmed, but order details are temporarily unavailable.';
      }
    });
  }
}

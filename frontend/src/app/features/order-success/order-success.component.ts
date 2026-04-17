import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
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
        this.loading = false;
        this.isSuccess = true;
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.error ?? 'Payment could not be confirmed yet.';
      }
    });
  }
}

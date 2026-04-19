import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CheckoutService } from '../../core/services/checkout.service';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';
import {
  OrderResponse, PaymentMethod, CheckoutRequest,
  Governorate, CouponValidationResponse, OrderStatus, PaymentStatus
} from '../../core/models/order.model';
import { CartResponse } from '../../core/models/cart.model';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { loadScript } from '@paypal/paypal-js';
import { firstValueFrom } from 'rxjs';
import { PAYPAL_CLIENT_ID } from '../../core/config/paypal.config';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  currentStep = 1;
  shippingForm!: FormGroup;
  paymentForm!: FormGroup;
  summary: OrderResponse | null = null;
  governorates: Governorate[] = [];
  couponValidation: CouponValidationResponse | null = null;
  couponLoading = false;
  couponError: string | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  paypalError: string | null = null;
  paypalLoading = false;
  systemOrderId: number | null = null;

  // Tracks whether PayPal buttons are already rendered in the DOM
  private paypalButtonsRendered = false;

  private readonly imageBaseUrl = 'https://localhost:44395';
  PaymentMethod = PaymentMethod;

  paymentMethods = [
    { value: PaymentMethod.Cash,   label: 'Cash on Delivery' },
    { value: PaymentMethod.Card,   label: 'Pay with Stripe'  },
    { value: PaymentMethod.PayPal, label: 'Pay with PayPal'  },
  ];

  constructor(
    private fb: FormBuilder,
    private checkoutService: CheckoutService,
    private cartService: CartService,
    private paymentService: PaymentService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.shippingForm = this.fb.group({
      firstName:   ['', Validators.required],
      lastName:    ['', Validators.required],
      phone:       ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
      address:     ['', [Validators.required, Validators.minLength(5)]],
      city:        ['', Validators.required],
      state:       ['', Validators.required],
      zip:         ['', Validators.required],
      governorate: ['', Validators.required],
    });

    this.paymentForm = this.fb.group({
      paymentMethod: [PaymentMethod.Card, Validators.required],
      couponCode:    ['', [Validators.pattern(/^[A-Z0-9_-]{3,30}$/i)]],
    });

    this.couponCodeControl.valueChanges.subscribe(() => {
      this.couponValidation = null;
      this.couponError = null;
    });

    this.loadGovernorates();
    this.syncCartAndLoadSummary();
  }

  private syncCartAndLoadSummary(): void {
    this.cartService.mergeGuestCartIntoUserCart().subscribe({
      next:  () => this.loadSummary(),
      error: () => this.loadSummary(),
    });
  }

  loadGovernorates(): void {
    this.checkoutService.getGovernorates().subscribe({
      next:  govs => { this.governorates = govs; },
      error: err  => console.error('Failed to load governorates:', err),
    });
  }

  loadSummary(): void {
    this.loading = true;
    this.checkoutService.getSummary().subscribe({
      next: s => {
        this.cartService.getCart().subscribe({
          next: cart => {
            this.summary = (s.items?.length ?? 0) === 0 && cart.items.length > 0
              ? this.mapCartToSummary(cart)
              : this.mergeSummaryWithCart(s, cart);
            this.loading = false;
          },
          error: () => { this.summary = s; this.loading = false; },
        });
      },
      error: () => {
        this.cartService.getCart().subscribe({
          next:  cart => { this.summary = this.mapCartToSummary(cart); this.loading = false; },
          error: err  => {
            this.loading = false;
            this.error = err.status === 403
              ? 'Checkout is available for Customer accounts only.'
              : 'Unable to load cart summary. Please return to cart and try again.';
          },
        });
      },
    });
  }

  private mapCartToSummary(cart: CartResponse): OrderResponse {
    return {
      id: 0,
      subtotalAmount: cart.totalPrice,
      totalAmount:    cart.totalPrice,
      shippingCost:   0,
      discountAmount: 0,
      shippingFirstName: '', shippingLastName: '', shippingPhone: '',
      shippingAddress: '', shippingCity: '', shippingState: '', shippingZipCode: '',
      status: 1,
      createdAt: new Date().toISOString(),
      items: cart.items.map(item => ({
        productId:    item.productId,
        productName:  item.productName,
        productImage: item.productImage,
        quantity:     item.quantity,
        price:        item.unitPrice,
        subTotal:     item.subTotal,
      })),
      payment: null,
    };
  }

  private mergeSummaryWithCart(summary: OrderResponse, cart: CartResponse): OrderResponse {
    const cartMap = new Map(cart.items.map(i => [i.productId, i]));
    return {
      ...summary,
      items: summary.items.map(item => {
        const c = cartMap.get(item.productId);
        return {
          ...item,
          productName:  item.productName  || c?.productName  || `Product #${item.productId}`,
          productImage: item.productImage ?? c?.productImage  ?? null,
          subTotal:     item.subTotal     || c?.subTotal      || item.price * item.quantity,
        };
      }),
    };
  }

  goToStep(step: number): void {
    if (step === 2 && this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render PayPal buttons when arriving at the review step with PayPal selected
    if (step === 3 && this.paymentForm.value.paymentMethod === PaymentMethod.PayPal) {
      // Wait one tick for the DOM to render the container
      setTimeout(() => void this.ensurePayPalButtonsRendered(), 0);
    }
  }

  selectPayment(method: PaymentMethod): void {
    this.paymentForm.get('paymentMethod')?.setValue(method);

    if (method !== PaymentMethod.PayPal) {
      this.paypalError = null;
      this.paypalLoading = false;
      this.paypalButtonsRendered = false;
      this.systemOrderId = null;
      const container = document.getElementById('paypal-button-container');
      if (container) container.innerHTML = '';
    }
  }

  getSelectedGovernorate(): Governorate | undefined {
    const govId = this.shippingForm.get('governorate')?.value;
    return this.governorates.find(g => g.id === Number(govId));
  }

  getFullAddress(): string {
    const v = this.shippingForm.value;
    return `${v.address}, ${v.city}, ${v.state} ${v.zip}`;
  }

  private getShippingPayload() {
    const v = this.shippingForm.value;
    return {
      shippingFirstName: v.firstName,
      shippingLastName:  v.lastName,
      shippingPhone:     v.phone,
      shippingAddress:   v.address,
      shippingCity:      v.city,
      shippingState:     v.state,
      shippingZipCode:   v.zip,
      governorateId:     Number(v.governorate),
    };
  }

  get couponCodeControl(): FormControl {
    return this.paymentForm.get('couponCode') as FormControl;
  }

  applyCoupon(showReviewAfterSuccess = false): void {
    const couponCode = (this.couponCodeControl.value ?? '').trim();
    if (!couponCode) { this.couponValidation = null; this.couponError = null; return; }
    if (this.couponCodeControl.invalid) { this.couponCodeControl.markAsTouched(); return; }

    this.couponLoading = true;
    this.couponError = null;

    this.checkoutService.validateCoupon(couponCode).subscribe({
      next: result => {
        this.couponValidation = result;
        this.couponLoading = false;
        if (showReviewAfterSuccess) this.goToStep(3);
      },
      error: err => {
        this.couponLoading = false;
        this.couponValidation = null;
        this.couponError = err.error?.error ?? 'Coupon is invalid.';
      },
    });
  }

  continueToReview(): void {
    const couponCode    = (this.couponCodeControl.value ?? '').trim();
    const normalizedCode = couponCode.toUpperCase();

    if (couponCode && (!this.couponValidation || this.couponValidation.couponCode !== normalizedCode)) {
      this.applyCoupon(true);
      return;
    }

    this.goToStep(3);
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getSubtotal():    number { return this.summary?.subtotalAmount ?? 0; }
  getShippingCost():number { return this.getSelectedGovernorate()?.shippingCost ?? 0; }
  getDiscount():    number { return this.couponValidation?.discountAmount ?? this.summary?.discountAmount ?? 0; }
  getGrandTotal():  number {
    return Math.max(0, this.getSubtotal() + this.getShippingCost() - this.getDiscount());
  }

  checkoutImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return 'https://placehold.co/240x240?text=No+Image';
    const p = imagePath.replace(/\\/g, '/');
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `${this.imageBaseUrl}${p.startsWith('/') ? p : '/' + p}`;
  }

  // ─── Place Order (Cash / Stripe) ───────────────────────────────────────────
  placeOrder(): void {
    this.submitting = true;
    this.error = null;
    this.paypalError = null;

    const selectedMethod = this.paymentForm.value.paymentMethod as PaymentMethod;

    // PayPal is handled entirely by the PayPal button — this button only triggers loading
    if (selectedMethod === PaymentMethod.PayPal) {
      this.submitting = false;
      setTimeout(() => void this.ensurePayPalButtonsRendered(), 0);
      return;
    }

    const dto: CheckoutRequest = {
      ...this.getShippingPayload(),
      paymentMethod: selectedMethod,
      couponCode:    this.paymentForm.value.couponCode || undefined,
    };

    this.checkoutService.checkout(dto).subscribe({
      next: order => {
        if (selectedMethod === PaymentMethod.Cash) {
          this.paymentService.cashPayment(order.id).subscribe({
            next: () => {
              this.cartService.getCart().subscribe();
              this.router.navigate(['/success'], {
                queryParams: { orderId: order.id },
                state: { order },
              });
            },
            error: err => {
              this.error = err.error?.error ?? 'Cash payment could not be processed.';
              this.submitting = false;
            },
          });
          return;
        }

        // Stripe
        this.paymentService.createStripeSession(order.id).subscribe({
          next: session => {
            if (!session.checkoutUrl) {
              this.error = 'Stripe session was created without a checkout URL.';
              this.submitting = false;
              return;
            }
            window.location.href = session.checkoutUrl;
          },
          error: err => {
            this.error = err.error?.error ?? 'Unable to start Stripe checkout.';
            this.submitting = false;
          },
        });
      },
      error: err => {
        this.error = err.status === 403
          ? 'Your account is not allowed to place orders.'
          : (err.error?.error ?? 'Checkout failed. Please try again.');
        this.submitting = false;
      },
    });
  }

  // ─── PayPal helpers ────────────────────────────────────────────────────────

  private async ensurePayPalButtonsRendered(): Promise<void> {
    if (this.currentStep !== 3) return;
    if (this.paymentForm.value.paymentMethod !== PaymentMethod.PayPal) return;
    if (this.paypalButtonsRendered || this.paypalLoading) return;
    await this.renderPayPalButtons();
  }

  private async renderPayPalButtons(): Promise<void> {
    this.paypalLoading = true;
    this.paypalError   = null;

    try {
      const paypal = await loadScript({
        clientId: PAYPAL_CLIENT_ID,
        currency:  'USD',
        intent:    'capture',
      });

      if (!paypal?.Buttons) throw new Error('PayPal SDK failed to load.');

      // Wait one tick so @if renders the container
      await new Promise(r => setTimeout(r, 0));

      const container = document.getElementById('paypal-button-container');
      if (!container) throw new Error('PayPal button container not found in DOM.');

      container.innerHTML = '';

      const buttons = paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 48 },

        createOrder: async () => {
          const response = await firstValueFrom(
            this.paymentService.createPayPalOrder(this.getGrandTotal())
          );
          return response.paypalOrderId;
        },

        onApprove: async (data) => {
          try {
            if (!data.orderID) {
              this.ngZone.run(() => { this.paypalError = 'PayPal approval did not return an order id.'; });
              return;
            }

            const captureResult = await firstValueFrom(
              this.paymentService.capturePayPalOrder({
                paypalOrderId: data.orderID,
                systemOrderId: 0,
              })
            );

            if (!captureResult.success) {
              this.ngZone.run(() => {
                this.paypalError = this.formatPayPalError(captureResult.message);
              });
              return;
            }

            const dto: CheckoutRequest = {
              ...this.getShippingPayload(),
              paymentMethod: PaymentMethod.PayPal,
              couponCode: this.paymentForm.value.couponCode || undefined,
            };

            const order = await firstValueFrom(this.checkoutService.checkout(dto));
            this.systemOrderId = order.id;

            const syncResult = await firstValueFrom(
              this.paymentService.capturePayPalOrder({
                paypalOrderId: data.orderID,
                systemOrderId: order.id,
              })
            );

            if (!syncResult.success) {
              this.ngZone.run(() => {
                this.paypalError = this.formatPayPalError(syncResult.message ?? 'PayPal payment captured, but order sync failed.');
              });
              return;
            }

            const completedOrder: OrderResponse = {
              ...order,
              status: OrderStatus.Paid,
              payment: order.payment
                ? {
                    ...order.payment,
                    status: PaymentStatus.Completed,
                    transactionId: syncResult.transactionId ?? data.orderID,
                    paidAt: new Date().toISOString(),
                  }
                : {
                    id: 0,
                    paymentMethod: PaymentMethod.PayPal,
                    status: PaymentStatus.Completed,
                    transactionId: syncResult.transactionId ?? data.orderID,
                    paidAt: new Date().toISOString(),
                  },
            };

            this.ngZone.run(() => {
              this.cartService.getCart().subscribe();
              this.router.navigate(['/success'], {
                queryParams: { orderId: order.id },
                state: { order: completedOrder },
              });
            });

          } catch (err: any) {
            this.ngZone.run(() => {
              this.paypalError = this.formatPayPalError(
                err?.error?.error ?? err?.error?.message ?? err?.message ?? 'PayPal capture failed unexpectedly.'
              );
            });
          }
        },

        onError: () => {
          this.ngZone.run(() => { this.paypalError = 'PayPal checkout could not be completed.'; });
        },

        onCancel: () => {
          this.ngZone.run(() => { this.paypalError = 'PayPal payment was cancelled. You can try again.'; });
        },
      });

      await buttons.render('#paypal-button-container');

      this.ngZone.run(() => {
        this.paypalButtonsRendered = true;
        this.paypalLoading         = false;
      });

    } catch (error) {
      this.ngZone.run(() => {
        this.paypalLoading         = false;
        this.paypalButtonsRendered = false;
        this.paypalError = error instanceof Error ? error.message : 'Unable to load PayPal.';
      });
    }
  }

  private formatPayPalError(message?: string): string {
    const text = (message ?? '').toString();

    if (text.includes('COMPLIANCE_VIOLATION') || text.includes('UNPROCESSABLE_ENTITY')) {
      return 'PayPal rejected this sandbox transaction because of a compliance restriction. Try another sandbox buyer account, verify the business sandbox account, or contact PayPal support with the debug id.';
    }

    return text || 'PayPal checkout could not be completed.';
  }
}

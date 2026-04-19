import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CheckoutService } from '../../core/services/checkout.service';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';
import { OrderResponse, PaymentMethod, CheckoutRequest, Governorate, CouponValidationResponse, OrderStatus } from '../../core/models/order.model';
import { CartResponse } from '../../core/models/cart.model';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  currentStep = 1;  // 1=Shipping, 2=Payment, 3=Review
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
  private readonly imageBaseUrl = 'http://localhost:44395';
  PaymentMethod = PaymentMethod;

  paymentMethods = [
    { value: PaymentMethod.Cash, label: 'Cash on Delivery' },
    { value: PaymentMethod.Card, label: 'Pay with Stripe' }
  ];

  constructor(
    private fb: FormBuilder,
    private checkoutService: CheckoutService,
    private cartService: CartService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.shippingForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      phone:     ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
      address:   ['', [Validators.required, Validators.minLength(5)]],
      city:      ['', Validators.required],
      state:     ['', Validators.required],
      zip:       ['', Validators.required],
      governorate: ['', Validators.required]
    });

    this.paymentForm = this.fb.group({
      paymentMethod: [PaymentMethod.Card, Validators.required],
      couponCode: ['', [Validators.pattern(/^[A-Z0-9_-]{3,30}$/i)]]
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
      next: () => this.loadSummary(),
      error: () => this.loadSummary()
    });
  }

  loadGovernorates(): void {
    this.checkoutService.getGovernorates().subscribe({
      next: govs => { this.governorates = govs; },
      error: (err) => console.error('Failed to load governorates:', err)
    });
  }

  loadSummary(): void {
    this.loading = true;
    this.checkoutService.getSummary().subscribe({
      next: s => {
        this.cartService.getCart().subscribe({
          next: cart => {
            if ((s.items?.length ?? 0) === 0 && cart.items.length > 0) {
              this.summary = this.mapCartToSummary(cart);
            } else {
              this.summary = this.mergeSummaryWithCart(s, cart);
            }
            this.loading = false;
          },
          error: () => {
            this.summary = s;
            this.loading = false;
          }
        });
      },
      error: () => {
        this.cartService.getCart().subscribe({
          next: cart => {
            this.summary = this.mapCartToSummary(cart);
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.error = err.status === 403
              ? 'Checkout is available for Customer accounts only. Please sign in with a Customer account.'
              : 'Unable to load cart summary. Please return to cart and try again.';
          }
        });
      }
    });
  }

  private mapCartToSummary(cart: CartResponse): OrderResponse {
    return {
      id: 0,
      subtotalAmount: cart.totalPrice,
      totalAmount: cart.totalPrice,
      shippingCost: 0,
      discountAmount: 0,
      shippingFirstName: '',
      shippingLastName: '',
      shippingPhone: '',
      shippingAddress: '',
      shippingCity: '',
      shippingState: '',
      shippingZipCode: '',
      status: OrderStatus.Pending,
      createdAt: new Date().toISOString(),
      items: cart.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        price: item.unitPrice,
        subTotal: item.subTotal
      })),
      payment: null
    };
  }

  private mergeSummaryWithCart(summary: OrderResponse, cart: CartResponse): OrderResponse {
    const cartByProductId = new Map(cart.items.map(item => [item.productId, item]));

    return {
      ...summary,
      items: summary.items.map(item => {
        const cartItem = cartByProductId.get(item.productId);

        return {
          ...item,
          productName: item.productName || cartItem?.productName || `Product #${item.productId}`,
          productImage: item.productImage ?? cartItem?.productImage ?? null,
          subTotal: item.subTotal || cartItem?.subTotal || (item.price * item.quantity),
        };
      })
    };
  }

  goToStep(step: number): void {
    if (step === 2 && this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectPayment(method: PaymentMethod): void {
    this.paymentForm.get('paymentMethod')?.setValue(method);
  }

  getSelectedGovernorate(): Governorate | undefined {
    const govId = this.shippingForm.get('governorate')?.value;
    return this.governorates.find(g => g.id === Number(govId));
  }

  getFullAddress(): string {
    const v = this.shippingForm.value;
    return `${v.address}, ${v.city}, ${v.state} ${v.zip}`;
  }

  getShippingPayload() {
    const v = this.shippingForm.value;
    return {
      shippingFirstName: v.firstName,
      shippingLastName: v.lastName,
      shippingPhone: v.phone,
      shippingAddress: v.address,
      shippingCity: v.city,
      shippingState: v.state,
      shippingZipCode: v.zip,
      governorateId: Number(v.governorate)
    };
  }

  get couponCodeControl(): FormControl {
    return this.paymentForm.get('couponCode') as FormControl;
  }

  applyCoupon(showReviewAfterSuccess = false): void {
    const couponCode = (this.couponCodeControl.value ?? '').trim();
    if (!couponCode) {
      this.couponValidation = null;
      this.couponError = null;
      return;
    }

    if (this.couponCodeControl.invalid) {
      this.couponCodeControl.markAsTouched();
      return;
    }

    this.couponLoading = true;
    this.couponError = null;

    this.checkoutService.validateCoupon(couponCode).subscribe({
      next: result => {
        this.couponValidation = result;
        this.couponLoading = false;
        if (showReviewAfterSuccess) {
          this.goToStep(3);
        }
      },
      error: err => {
        this.couponLoading = false;
        this.couponValidation = null;
        this.couponError = err.error?.error ?? 'Coupon is invalid.';
      }
    });
  }

  continueToReview(): void {
    const couponCode = (this.couponCodeControl.value ?? '').trim();
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

  // Calculate totals for review
  getSubtotal(): number {
    return this.summary?.subtotalAmount ?? 0;
  }

  getShippingCost(): number {
    const gov = this.getSelectedGovernorate();
    return gov?.shippingCost ?? 0;
  }

  getDiscount(): number {
    return this.couponValidation?.discountAmount ?? this.summary?.discountAmount ?? 0;
  }

  getGrandTotal(): number {
    const subtotal = this.getSubtotal();
    const shipping = this.getShippingCost();
    const discount = this.getDiscount();
    return Math.max(0, (subtotal + shipping) - discount);
  }

  checkoutImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return 'https://placehold.co/240x240?text=No+Image';
    }

    const normalizedPath = imagePath.replace(/\\/g, '/');

    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
      return normalizedPath;
    }

    const pathWithSlash = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${this.imageBaseUrl}${pathWithSlash}`;
  }

  placeOrder(): void {
    this.submitting = true;
    this.error = null;

    const shipping = this.getShippingPayload();
    const dto: CheckoutRequest = {
      ...shipping,
      paymentMethod:   this.paymentForm.value.paymentMethod,
      couponCode:      this.paymentForm.value.couponCode || undefined
    };

    this.checkoutService.checkout(dto).subscribe({
      next: order => {
        const selectedMethod = this.paymentForm.value.paymentMethod as PaymentMethod;

        if (selectedMethod === PaymentMethod.Cash) {
          this.paymentService.cashPayment(order.id).subscribe({
            next: () => {
              this.cartService.getCart().subscribe();
              this.router.navigate(['/success'], { queryParams: { orderId: order.id }, state: { order } });
            },
            error: err => {
              this.error = err.error?.error ?? 'Cash payment could not be processed. Please try again.';
              this.submitting = false;
            }
          });
          return;
        }

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
            this.error = err.error?.error ?? 'Unable to start Stripe checkout. Please try again.';
            this.submitting = false;
          }
        });
      },
      error: err => {
        this.error = err.status === 403
          ? 'Your account is not allowed to place orders. Please sign in as Customer.'
          : (err.error?.error ?? 'Checkout failed. Please try again.');
        this.submitting = false;
      }
    });
  }
}

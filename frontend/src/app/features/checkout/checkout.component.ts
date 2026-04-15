import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CheckoutService } from '../../core/services/checkout.service';
import { CartService } from '../../core/services/cart.service';
import { OrderResponse, PaymentMethod, CheckoutRequest } from '../../core/models/order.model';
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
  loading = false;
  submitting = false;
  error: string | null = null;
  PaymentMethod = PaymentMethod;

  paymentMethods = [
   
    { value: PaymentMethod.PayPal,     label: 'PayPal' },
    { value: PaymentMethod.Cash,       label: 'Cash on Delivery' },
    { value: PaymentMethod.Card,     label: 'Credit Card' }
  ];

  constructor(
    private fb: FormBuilder,
    private checkoutService: CheckoutService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.shippingForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      address:   ['', [Validators.required, Validators.minLength(5)]],
      city:      ['', Validators.required],
      state:     ['', Validators.required],
      zip:       ['', Validators.required],
    });

    this.paymentForm = this.fb.group({
      paymentMethod: [PaymentMethod.Card, Validators.required],
      couponCode: ['']
    });

    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.checkoutService.getSummary().subscribe({
      next: s => { this.summary = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
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

  getFullAddress(): string {
    const v = this.shippingForm.value;
    return `${v.address}, ${v.city}, ${v.state} ${v.zip}`;
  }

    get couponCodeControl(): FormControl {
    return this.paymentForm.get('couponCode') as FormControl;
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  placeOrder(): void {
    this.submitting = true;
    this.error = null;

    const dto: CheckoutRequest = {
      shippingAddress: this.getFullAddress(),
      paymentMethod:   this.paymentForm.value.paymentMethod,
      couponCode:      this.paymentForm.value.couponCode || undefined
    };

    this.checkoutService.checkout(dto).subscribe({
      next: order => {
        this.cartService.getCart().subscribe();
        this.router.navigate(['/order-success', order.id],
          { state: { order } }   // بنبعت الـ order في الـ state
        );
      },
      error: err => {
        this.error = err.error?.error ?? 'Checkout failed. Please try again.';
        this.submitting = false;
      }
    });
  }
}
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

type AccountType = 'customer' | 'seller';

const passwordPolicyValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = String(control.value ?? '');
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasMinLength = password.length >= 8;

  return hasUppercase && hasLowercase && hasDigit && hasMinLength
    ? null
    : {
        passwordPolicy: true,
      };
};

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected accountType: AccountType = 'customer';
  protected loading = false;
  protected errorMessage = '';

  protected readonly customerForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordPolicyValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] },
  );

  protected readonly sellerForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordPolicyValidator]],
      confirmPassword: ['', [Validators.required]],
      storeName: ['', [Validators.required]],
      storeDescription: ['', [Validators.required, Validators.minLength(10)]],
    },
    { validators: [passwordMatchValidator] },
  );

  protected selectType(type: AccountType): void {
    this.accountType = type;
    this.errorMessage = '';
  }

  protected submitCustomer(): void {
    this.errorMessage = '';

    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService
      .registerCustomer(this.customerForm.getRawValue())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate(['/auth/verify-otp'], {
          queryParams: { email: this.customerForm.getRawValue().email, source: 'register' },
        }),
        error: (error) => {
          this.errorMessage = this.authService.extractErrorMessage(
            error,
            'Customer registration failed.',
          );
        },
      });
  }

  protected submitSeller(): void {
    this.errorMessage = '';

    if (this.sellerForm.invalid) {
      this.sellerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService
      .registerSeller(this.sellerForm.getRawValue())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate(['/auth/verify-otp'], {
          queryParams: { email: this.sellerForm.getRawValue().email, source: 'register' },
        }),
        error: (error) => {
          this.errorMessage = this.authService.extractErrorMessage(
            error,
            'Seller registration failed.',
          );
        },
      });
  }

  protected customerControlInvalid(controlName: 'email' | 'password' | 'confirmPassword'): boolean {
    const control = this.customerForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected sellerControlInvalid(
    controlName: 'email' | 'password' | 'confirmPassword' | 'storeName' | 'storeDescription',
  ): boolean {
    const control = this.sellerForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected passwordPolicyInvalid(form: 'customer' | 'seller'): boolean {
    const targetForm = form === 'customer' ? this.customerForm : this.sellerForm;
    return !!targetForm.controls.password.errors?.['passwordPolicy'] && targetForm.controls.password.touched;
  }
}

import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
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
import { AuthResponse } from '../../../core/models/auth.models';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';

type AccountType = 'customer' | 'seller';
// register.component.ts
const GOOGLE_CLIENT_ID = '429102089004-op47mj85bbe9s278h9bc8vld6v9o9ugs.apps.googleusercontent.com';

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
    : { passwordPolicy: true };
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
  private readonly googleIdentityService = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  @ViewChild('googleButtonHost') private googleButtonHost?: ElementRef<HTMLDivElement>;

  protected accountType: AccountType = 'customer';
  protected loading = false;
  protected errorMessage = '';
  protected customerSubmitted = false;
  protected sellerSubmitted = false;

  private readonly handleGoogleCredential = (response: { credential?: string }) => {
    if (!response.credential) {
      this.errorMessage = 'Unable to retrieve Google ID token.';
      return;
    }

    this.authService.googleLogin({ idToken: response.credential }).subscribe({
      next: (loginResponse: AuthResponse) => {
        this.authService.storeSession(loginResponse);
        this.router.navigateByUrl('/');
      },
      error: (error: unknown) => {
        this.errorMessage = this.authService.extractErrorMessage(
          error,
          'Google login failed. Please try again.',
        );
      },
    });
  };

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
    this.customerSubmitted = false;
    this.sellerSubmitted = false;

    if (type === 'customer') {
      window.setTimeout(() => this.renderGoogleButton(), 0);
    }
  }

  ngAfterViewInit(): void {
    if (this.accountType === 'customer') {
      this.renderGoogleButton();
    }
  }

  protected submitCustomer(): void {
    this.customerSubmitted = true;
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
        next: () =>
          this.router.navigate(['/auth/verify-otp'], {
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
    this.sellerSubmitted = true;
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
        next: () =>
          this.router.navigate(['/auth/verify-otp'], {
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
    return control.invalid && (control.touched || this.customerSubmitted);
  }

  protected sellerControlInvalid(
    controlName: 'email' | 'password' | 'confirmPassword' | 'storeName' | 'storeDescription',
  ): boolean {
    const control = this.sellerForm.controls[controlName];
    return control.invalid && (control.touched || this.sellerSubmitted);
  }

  protected passwordPolicyInvalid(form: 'customer' | 'seller'): boolean {
    const targetForm = form === 'customer' ? this.customerForm : this.sellerForm;
    const submitted = form === 'customer' ? this.customerSubmitted : this.sellerSubmitted;
    return (
      !!targetForm.controls.password.errors?.['passwordPolicy'] &&
      (targetForm.controls.password.touched || submitted)
    );
  }

  private async renderGoogleButton(): Promise<void> {
    await this.googleIdentityService.ensureInitialized(GOOGLE_CLIENT_ID, this.handleGoogleCredential);

    const googleClient = window.google?.accounts?.id;
    if (!googleClient) {
      this.errorMessage = 'Google sign-in is not available right now.';
      return;
    }

    const host = this.googleButtonHost?.nativeElement;
    if (!host) {
      return;
    }

    host.innerHTML = '';
    googleClient.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: host.clientWidth > 0 ? host.clientWidth : 360,
    });
  }
}
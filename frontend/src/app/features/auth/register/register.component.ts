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
const GOOGLE_CLIENT_ID = '215693797532-gqo9s8f998jgdb5r3ingol2bmm4h5est.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

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
  protected googleLoading = false;
  protected errorMessage = '';

  private googleScriptPromise: Promise<void> | null = null;

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

  protected async continueWithGoogle(): Promise<void> {
    this.errorMessage = '';
    this.googleLoading = true;

    try {
      const idToken = await this.requestGoogleIdTokenAsync();

      this.authService.googleLogin({ idToken }).subscribe({
        next: (response) => {
          this.authService.storeSession(response);
          this.router.navigateByUrl('/');
        },
        error: (error) => {
          this.errorMessage = this.authService.extractErrorMessage(
            error,
            'Google login failed. Please try again.',
          );
          this.googleLoading = false;
        },
        complete: () => {
          this.googleLoading = false;
        },
      });
    } catch (error) {
      this.googleLoading = false;
      this.errorMessage = this.authService.extractErrorMessage(
        error,
        'Unable to complete Google sign in.',
      );
    }
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

  private async requestGoogleIdTokenAsync(): Promise<string> {
    await this.ensureGoogleScriptAsync();

    const googleClient = window.google?.accounts?.id;
    if (!googleClient) {
      throw new Error('Google identity script is not available.');
    }

    return new Promise<string>((resolve, reject) => {
      let completed = false;
      const timeoutId = window.setTimeout(() => {
        if (!completed) {
          completed = true;
          reject(new Error('Google sign in timed out. Please try again.'));
        }
      }, 60000);

      googleClient.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (completed) {
            return;
          }

          completed = true;
          window.clearTimeout(timeoutId);

          if (!response.credential) {
            reject(new Error('Unable to retrieve Google ID token.'));
            return;
          }

          resolve(response.credential);
        },
      });

      googleClient.prompt();
    });
  }

  private ensureGoogleScriptAsync(): Promise<void> {
    if (this.googleScriptPromise) {
      return this.googleScriptPromise;
    }

    this.googleScriptPromise = new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google identity script.')), {
          once: true,
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset['googleIdentity'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google identity script.'));
      document.head.appendChild(script);
    });

    return this.googleScriptPromise;
  }
}

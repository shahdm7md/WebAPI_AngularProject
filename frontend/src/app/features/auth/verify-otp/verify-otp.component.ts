import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.css',
})
export class VerifyOtpComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected loading = false;
  protected resendLoading = false;
  protected message = '';
  protected errorMessage = '';
  protected submitted = false;

  protected readonly otpForm = this.fb.nonNullable.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
    otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  protected submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.message = '';

    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService
      .verifyEmailOtp(this.otpForm.getRawValue())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: string) => {
          this.message = response;
          this.router.navigate(['/auth/login'], {
            queryParams: { email: this.otpForm.controls.email.value },
          });
        },
        error: (error: unknown) => {
          this.errorMessage = this.authService.extractErrorMessage(
            error,
            'OTP verification failed. Please check the code and try again.',
          );
        },
      });
  }

  protected resendOtp(): void {
    this.errorMessage = '';
    this.message = '';

    if (this.otpForm.controls.email.invalid) {
      this.otpForm.controls.email.markAsTouched();
      return;
    }

    this.resendLoading = true;
    this.authService
      .resendOtp({ email: this.otpForm.controls.email.value })
      .pipe(finalize(() => (this.resendLoading = false)))
      .subscribe({
        next: (response: string) => {
          this.message = response;
        },
        error: (error: unknown) => {
          this.errorMessage = this.authService.extractErrorMessage(
            error,
            'Unable to resend OTP right now.',
          );
        },
      });
  }
}

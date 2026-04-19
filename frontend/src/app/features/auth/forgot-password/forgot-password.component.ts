import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected submittingEmail = false;
  protected resettingPassword = false;
  protected showPassword = false;
  protected message = '';
  protected errorMessage = '';
  protected submitted = false;
  protected otpRequested = false;

  protected readonly resetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    otpCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    newPassword: ['', [Validators.required]],
  });

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected submitReset(): void {
    this.submitted = true;
    this.clearFeedback();

    if (this.resetForm.controls.email.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.submittingEmail = true;
    const email = this.resetForm.controls.email.value;

    this.authService
      .forgotPassword({ email })
      .pipe(finalize(() => (this.submittingEmail = false)))
      .subscribe({
        next: (response) => {
          this.otpRequested = true;
          this.message = response.message || 'If the email exists, an OTP was sent.';
          this.errorMessage = '';
        },
        error: (error: unknown) => {
          this.errorMessage = this.authService.extractErrorMessage(
            error,
            'Unable to send OTP.',
          );
        },
      });
  }

  protected confirmReset(): void {
    this.submitted = true;
    this.clearFeedback();

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.resettingPassword = true;
    const payload = this.resetForm.getRawValue();

    this.authService
      .resetPassword({
        email: payload.email,
        otpCode: payload.otpCode,
        newPassword: payload.newPassword,
      })
      .pipe(finalize(() => (this.resettingPassword = false)))
      .subscribe({
        next: (responseMessage: string) => {
          this.message = responseMessage || 'Password reset successful.';
          this.router.navigateByUrl('/auth/login');
        },
        error: (error: unknown) => {
          this.errorMessage = this.authService.extractErrorMessage(
            error,
            'Password reset failed.',
          );
        },
      });
  }

  private clearFeedback(): void {
    this.message = '';
    this.errorMessage = '';
  }
}

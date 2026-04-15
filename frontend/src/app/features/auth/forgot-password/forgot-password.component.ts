import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
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

  protected resettingPassword = false;
  protected showPassword = false;
  protected message = '';
  protected errorMessage = '';
  protected submitted = false;

  protected readonly resetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    newPassword: ['', [Validators.required]],
  });

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected submitReset(): void {
    this.submitted = true;
    this.clearFeedback();

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.resettingPassword = true;
    const payload = this.resetForm.getRawValue();

    this.authService
      .forgotPassword({ email: payload.email })
      .pipe(
        switchMap((response) =>
          this.authService.resetPassword({
            email: payload.email,
            token: response.resetToken,
            newPassword: payload.newPassword,
          }),
        ),
        finalize(() => (this.resettingPassword = false)),
      )
      .subscribe({
        next: (responseMessage: string) => {
          this.message = responseMessage || 'Password reset successful.';
          this.resetForm.controls.newPassword.reset('');
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

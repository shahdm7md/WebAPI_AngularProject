import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected showPassword = false;
  protected loading = false;
  protected errorMessage = '';

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected submit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.authService.storeSession(response);
          this.router.navigateByUrl('/');
        },
        error: (error) => {
          const message = this.authService.extractErrorMessage(
            error,
            'Login failed. Please verify your email and password.',
          );

          if (message.toLowerCase().includes('not verified')) {
            this.router.navigate(['/auth/verify-otp'], {
              queryParams: {
                email: this.loginForm.controls.email.value,
                source: 'login',
              },
            });
            return;
          }

          this.errorMessage = message;
        },
      });
  }
}

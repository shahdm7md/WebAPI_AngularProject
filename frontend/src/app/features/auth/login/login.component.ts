import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';
import { AuthResponse } from '../../../core/models/auth.models';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';

const GOOGLE_CLIENT_ID = '429102089004-op47mj85bbe9s278h9bc8vld6v9o9ugs.apps.googleusercontent.com';

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
  private readonly googleIdentityService = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  @ViewChild('googleButtonHost') private googleButtonHost?: ElementRef<HTMLDivElement>;

  protected showPassword = false;
  protected loading = false;
  protected errorMessage = '';
  protected submitted = false;
  protected googleMessage = '';

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngAfterViewInit(): void {
    this.renderGoogleButton();
  }

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.googleMessage = '';

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
          this.handlePostLogin(response);
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

  protected loginWithGoogle(): void {
    this.renderGoogleButton();
  }

  private async renderGoogleButton(): Promise<void> {
    await this.googleIdentityService.ensureInitialized(GOOGLE_CLIENT_ID, (response) => {
      if (!response.credential) {
        this.googleMessage = 'Unable to retrieve Google ID token.';
        return;
      }

      this.authService.googleLogin({ idToken: response.credential }).subscribe({
        next: (loginResponse: AuthResponse) => {
          this.handlePostLogin(loginResponse);
        },
        error: (error: unknown) => {
          this.googleMessage = this.authService.extractErrorMessage(
            error,
            'Google login failed. Please try again.',
          );
        },
      });
    });

    const googleClient = window.google?.accounts?.id;
    if (!googleClient) {
      this.googleMessage = 'Google sign-in is not available right now.';
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
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: host.clientWidth > 0 ? host.clientWidth : 360,
    });
  }

  private handlePostLogin(response: AuthResponse): void {
    this.authService.storeSession(response);

    const redirectUrl = this.getPostLoginRedirectUrl();

    if (redirectUrl !== '/') {
      this.router.navigateByUrl(redirectUrl);
      return;
    }

    forkJoin([
      this.cartService.mergeGuestCartIntoUserCart(),
      this.wishlistService.mergeGuestWishlistIntoUserWishlist(),
    ]).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/'),
    });
  }

  private getPostLoginRedirectUrl(): string {
    if (this.authService.hasAnyRole(['Admin'])) {
      return '/admin/dashboard';
    }

    if (this.authService.hasAnyRole(['Seller'])) {
      return '/seller/dashboard';
    }

    return '/';
  }
}
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AuthResponse,
  GoogleLoginRequest,
  LoginRequest,
  RegisterCustomerRequest,
  RegisterSellerRequest,
  ResendOtpRequest,
  VerifyEmailOtpRequest,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly tokenStorageKey = 'auth_token';
  private readonly emailStorageKey = 'auth_user_email';
  private readonly fullNameStorageKey = 'auth_user_full_name';

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/login`, payload);
  }

  googleLogin(payload: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/google-login`, payload);
  }

  registerCustomer(payload: RegisterCustomerRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/api/auth/register/customer`, payload, {
      responseType: 'text',
    });
  }

  registerSeller(payload: RegisterSellerRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/api/auth/register/seller`, payload, {
      responseType: 'text',
    });
  }

  verifyEmailOtp(payload: VerifyEmailOtpRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/api/auth/verify-email-otp`, payload, {
      responseType: 'text',
    });
  }

  resendOtp(payload: ResendOtpRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/api/auth/resend-otp`, payload, {
      responseType: 'text',
    });
  }

  storeSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenStorageKey, response.token);
    localStorage.setItem(this.emailStorageKey, response.email);
    localStorage.setItem(this.fullNameStorageKey, response.fullName);
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.emailStorageKey);
    localStorage.removeItem(this.fullNameStorageKey);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenStorageKey);
  }

  getCurrentUserEmail(): string {
    return localStorage.getItem(this.emailStorageKey) ?? '';
  }

  getCurrentUserName(): string {
    return localStorage.getItem(this.fullNameStorageKey) ?? '';
  }

  extractErrorMessage(error: unknown, fallback: string): string {
    const maybeError = error as { error?: unknown } | null;
    const payload = maybeError?.error;

    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }

    if (Array.isArray(payload) && payload.length > 0) {
      return payload.join(' ');
    }

    if (payload && typeof payload === 'object') {
      const values = Object.values(payload as Record<string, unknown>).flatMap((value) =>
        Array.isArray(value) ? value : [value],
      );
      const messages = values.filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0,
      );

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    return fallback;
  }
}

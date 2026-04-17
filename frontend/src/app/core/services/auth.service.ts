import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AuthResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GoogleLoginRequest,
  LoginRequest,
  RegisterCustomerRequest,
  RegisterSellerRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
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

  forgotPassword(payload: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.baseUrl}/api/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/api/auth/reset-password`, payload, {
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
    const token = this.getAccessToken();

    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  getCurrentUserRoles(): string[] {
    const token = this.getAccessToken();

    if (!token || this.isTokenExpired(token)) {
      return [];
    }

    const payload = this.decodeTokenPayload(token);
    if (!payload) {
      return [];
    }

    const roleKeys = ['role', 'roles', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const roles = roleKeys.flatMap((key) => {
      const value = payload[key];

      if (typeof value === 'string') {
        return [value];
      }

      if (Array.isArray(value)) {
        return value.filter((role): role is string => typeof role === 'string');
      }

      return [];
    });

    return Array.from(new Set(roles));
  }

  hasAnyRole(requiredRoles: string[]): boolean {
    if (requiredRoles.length === 0) {
      return true;
    }

    const currentRoles = this.getCurrentUserRoles();
    if (currentRoles.length === 0) {
      return false;
    }

    const normalizedCurrent = new Set(currentRoles.map((role) => this.normalizeRole(role)));
    return requiredRoles.some((requiredRole) =>
      normalizedCurrent.has(this.normalizeRole(requiredRole)),
    );
  }

  private normalizeRole(role: string): string {
    const compact = role.trim().toLowerCase().replace(/[^a-z]/g, '');

    if (compact === 'systemadministrator' || compact === 'superadmin') {
      return 'admin';
    }

    return compact;
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);

    if (!payload) {
      return true;
    }

    const exp = payload['exp'];
    if (typeof exp !== 'number') {
      return true;
    }

    return Date.now() >= exp * 1000;
  }

  private decodeTokenPayload(token: string): Record<string, unknown> | null {
    try {
      const payloadPart = token.split('.')[1];

      if (!payloadPart) {
        return null;
      }

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
      return null;
    }
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

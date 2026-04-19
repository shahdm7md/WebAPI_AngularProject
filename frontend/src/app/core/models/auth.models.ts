export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  email: string;
  fullName: string;
}

export interface RegisterCustomerRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterSellerRequest {
  email: string;
  password: string;
  confirmPassword: string;
  storeName: string;
  storeDescription: string;
}

export interface VerifyEmailOtpRequest {
  email: string;
  otpCode: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

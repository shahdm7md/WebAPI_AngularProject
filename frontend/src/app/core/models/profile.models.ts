export interface UserProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  role: string;  
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
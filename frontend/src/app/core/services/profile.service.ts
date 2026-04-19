import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  UserProfileResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../models/profile.models';
 
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
 
  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseUrl}/api/profile`);
  }
 
  updateProfile(payload: UpdateProfileRequest): Observable<{ message: string; profile: UserProfileResponse }> {
    return this.http.put<{ message: string; profile: UserProfileResponse }>(
      `${this.baseUrl}/api/profile`,
      payload
    );
  }
 
  changePassword(payload: ChangePasswordRequest): Observable<string> {
    return this.http.put(`${this.baseUrl}/api/profile/change-password`, payload, {
      responseType: 'text',
    });
  }
}
 
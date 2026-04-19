import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfileResponse } from '../../core/models/profile.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = false;
  isEditing = false;
  isSaving = false;
  isChangingPwd = false;
  successMessage = '';
  errorMessage = '';
  pwdSuccess = '';
  pwdError = '';
  showPwdSection = false;

  profile: UserProfileResponse | null = null;

  form = { fullName: '', phoneNumber: '', address: '' };
  pwdForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  showCurrentPwd = false;
  showNewPwd = false;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (res: UserProfileResponse) => {
        this.profile = res;
        this.form.fullName = res.fullName;
        this.form.phoneNumber = res.phoneNumber ?? '';
        this.form.address = res.address ?? '';
        this.isEditing = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load profile.');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  saveProfile(): void {
    if (!this.form.fullName.trim()) {
      this.errorMessage = 'Full name is required.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.profileService
      .updateProfile({
        fullName: this.form.fullName.trim(),
        phoneNumber: this.form.phoneNumber || undefined,
        address: this.form.address || undefined,
      })
      .subscribe({
        next: (res) => {
          this.profile = res.profile;
          this.successMessage = res.message;
          this.isEditing = false;
          this.isSaving = false;
          setTimeout(() => (this.successMessage = ''), 3000);
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          this.errorMessage = this.extractError(err, 'Failed to update profile.');
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      });
  }

  changePassword(): void {
    if (!this.pwdForm.currentPassword || !this.pwdForm.newPassword) {
      this.pwdError = 'All password fields are required.';
      return;
    }
    if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) {
      this.pwdError = 'New passwords do not match.';
      return;
    }
    if (this.pwdForm.newPassword.length < 8) {
      this.pwdError = 'New password must be at least 8 characters.';
      return;
    }

    this.isChangingPwd = true;
    this.pwdError = '';
    this.pwdSuccess = '';

    this.profileService
      .changePassword({
        currentPassword: this.pwdForm.currentPassword,
        newPassword: this.pwdForm.newPassword,
      })
      .subscribe({
        next: (msg: string) => {
          this.pwdSuccess = msg || 'Password changed successfully.';
          this.isChangingPwd = false;
          this.pwdForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
          setTimeout(() => {
            this.pwdSuccess = '';
            this.showPwdSection = false;
          }, 3000);
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          this.pwdError = this.extractError(err, 'Failed to change password.');
          this.isChangingPwd = false;
          this.cdr.detectChanges();
        },
      });
  }

  cancelEdit(): void {
    if (!this.profile) return;
    this.form.fullName = this.profile.fullName;
    this.form.phoneNumber = this.profile.phoneNumber ?? '';
    this.form.address = this.profile.address ?? '';
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditing = false;
    this.showPwdSection = false;
    this.pwdError = '';
    this.pwdSuccess = '';
  }

  startEdit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditing = true;
  }

  getInitials(): string {
    if (!this.profile?.fullName) return 'U';
    return this.profile.fullName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getMemberSince(): string {
    if (!this.profile?.createdAt) return '';
    const d = new Date(this.profile.createdAt);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getRoleBadgeClass(): string {
    const map: Record<string, string> = {
      Admin: 'badge-admin',
      Seller: 'badge-seller',
      Customer: 'badge-customer',
    };
    return map[this.profile?.role ?? ''] ?? 'badge-customer';
  }

  private extractError(error: unknown, fallback: string): string {
    const e = error as { error?: unknown } | null;
    const p = e?.error;
    if (typeof p === 'string' && p.trim()) return p;
    if (typeof p === 'object' && p !== null) {
      const msgs = Object.values(p as Record<string, unknown>)
        .flat()
        .filter((v): v is string => typeof v === 'string');
      if (msgs.length) return msgs.join(' ');
    }
    return fallback;
  }
}

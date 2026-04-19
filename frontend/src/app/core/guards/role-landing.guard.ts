import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const RoleLandingGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  if (authService.hasAnyRole(['Admin'])) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  if (authService.hasAnyRole(['Seller'])) {
    return router.createUrlTree(['/seller/dashboard']);
  }

  return true;
};

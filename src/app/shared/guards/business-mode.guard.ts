import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const businessModeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.user();
  const userMode = user?.user_mode || 'client';
  
  // If user is not in business owner mode, redirect to projects
  if (userMode !== 'business_owner') {
    router.navigate(['/dashboard/projects']);
    return false;
  }
  
  return true;
};

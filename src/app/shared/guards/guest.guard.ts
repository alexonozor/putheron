import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const GuestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use observable approach for more reliable state checking
  return authService.isAuthenticated$.pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        // User is already authenticated, redirect to home which will handle mode-based redirection
        router.navigate(['/']);
        return false;
      } else {
        // User is not authenticated, allow access to auth page
        return true;
      }
    })
  );
};

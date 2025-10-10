import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private router = inject(Router);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token directly from localStorage to avoid circular dependency
    const authToken = this.getTokenFromStorage();

    // Clone the request and add the authorization header if we have a token
    let authRequest = request;
    if (authToken) {
      authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
    }

    // Handle the request and catch any 401 errors
    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token might be expired or invalid, redirect to login
          console.warn('Authentication failed, redirecting to login');
          this.clearAuthData();
          this.router.navigate(['/auth'], { 
            queryParams: { message: 'Your session has expired. Please log in again.' }
          });
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get token directly from localStorage to avoid circular dependency
   */
  private getTokenFromStorage(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  /**
   * Clear auth data from localStorage
   */
  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('permissionsTimestamp');
    }
  }
}

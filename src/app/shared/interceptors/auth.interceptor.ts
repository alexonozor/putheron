import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from the auth service
    const authToken = this.authService.getAuthToken();

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
          this.authService.signOut();
          this.router.navigate(['/auth'], { 
            queryParams: { message: 'Your session has expired. Please log in again.' }
          });
        }
        return throwError(() => error);
      })
    );
  }
}

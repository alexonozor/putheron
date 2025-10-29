import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../shared/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for component state
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showResendOption = signal(false);
  readonly unverifiedEmail = signal('');

  // Reactive form
  readonly loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Check for any query parameters or success messages
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.snackBar.open(params['message'], 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-info']
        });
      }
      if (params['email']) {
        this.loginForm.patchValue({
          email: params['email']
        });
      }
    });
  }

  async onSubmit() {
    if (!this.loginForm.valid) {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
      return;
    }

    const { email, password } = this.loginForm.value;
    this.loading.set(true);

    try {
      const response = await this.authService.signIn(email, password);
      
      if (response.data) {
        this.snackBar.open('Login successful! Redirecting...', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        // Navigate to dashboard or intended route
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      } else {
        this.handleLoginError(response.error?.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      this.handleLoginError(error?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private handleLoginError(message: string) {
    // Check if the error is about email verification
    if (message.includes('verify your email') || message.includes('email address before logging')) {
      // Show error in snackbar with resend option
      this.snackBar.open(message + ' Click below to resend verification email.', 'Close', {
        duration: 8000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
      // Extract email from form if available for resend functionality
      const email = this.loginForm.get('email')?.value;
      if (email) {
        this.unverifiedEmail.set(email);
        this.showResendOption.set(true);
      }
    } else {
      this.snackBar.open(message, 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
    }
  }

  async resendVerification() {
    if (!this.unverifiedEmail()) return;

    this.loading.set(true);
    try {
      const response = await this.authService.resendEmailVerification(this.unverifiedEmail());
      
      if (response.success) {
        this.snackBar.open('Verification email sent! Please check your inbox.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        this.showResendOption.set(false);
      } else {
        this.snackBar.open(response.message || 'Failed to resend verification email.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    } catch (error: any) {
      this.snackBar.open(error?.message || 'Failed to resend verification email.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(current => !current);
  }

  // Getters for template convenience
  get emailControl() { 
    return this.loginForm.get('email'); 
  }

  get passwordControl() { 
    return this.loginForm.get('password'); 
  }
}

import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  // Signals for component state
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly authMessage = signal('');
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
        this.authMessage.set(params['message']);
      }
      if (params['email']) {
        this.loginForm.patchValue({
          email: params['email']
        });
      }
    });
  }

  async onSubmit() {
    this.clearMessages();
    
    if (!this.loginForm.valid) {
      this.error.set('Please fill in all required fields correctly');
      return;
    }

    const { email, password } = this.loginForm.value;
    this.loading.set(true);

    try {
      const response = await this.authService.signIn(email, password);
      
      if (response.data) {
        this.successMessage.set('Login successful! Redirecting...');
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
      this.error.set(message);
      // Extract email from form if available for resend functionality
      const email = this.loginForm.get('email')?.value;
      if (email) {
        this.unverifiedEmail.set(email);
        this.showResendOption.set(true);
      }
    } else {
      this.error.set(message);
    }
  }

  async resendVerification() {
    if (!this.unverifiedEmail()) return;

    this.loading.set(true);
    try {
      const response = await this.authService.resendEmailVerification(this.unverifiedEmail());
      
      if (response.success) {
        this.successMessage.set('Verification email sent! Please check your inbox.');
        this.error.set('');
        this.showResendOption.set(false);
      } else {
        this.error.set(response.message || 'Failed to resend verification email.');
      }
    } catch (error: any) {
      this.error.set(error?.message || 'Failed to resend verification email.');
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(current => !current);
  }

  private clearMessages() {
    this.error.set('');
    this.successMessage.set('');
    this.authMessage.set('');
  }

  // Getters for template convenience
  get emailControl() { 
    return this.loginForm.get('email'); 
  }

  get passwordControl() { 
    return this.loginForm.get('password'); 
  }
}

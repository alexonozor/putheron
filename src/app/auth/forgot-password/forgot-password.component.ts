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
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  // Signals for component state
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly loading = signal(false);

  // Reactive form
  readonly forgotPasswordForm: FormGroup;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    // Check for email query parameter and pre-fill
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.forgotPasswordForm.patchValue({
          email: params['email']
        });
      }
    });
  }

  async onSubmit() {
    this.clearMessages();
    
    if (!this.forgotPasswordForm.valid) {
      this.error.set('Please enter a valid email address');
      return;
    }

    const { email } = this.forgotPasswordForm.value;
    this.loading.set(true);

    try {
      const response = await this.authService.forgotPassword(email);
      
      if (response.success) {
        this.successMessage.set(response.message || 'If an account with that email exists, we have sent a password reset link.');
        this.forgotPasswordForm.reset();
      } else {
        this.error.set(response.message || 'Failed to send password reset email. Please try again.');
      }
    } catch (error: any) {
      this.error.set(error?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private clearMessages() {
    this.error.set('');
    this.successMessage.set('');
  }

  // Getter for template convenience
  get emailControl() { 
    return this.forgotPasswordForm.get('email'); 
  }
}
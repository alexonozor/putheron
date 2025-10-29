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
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for component state
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
    if (!this.forgotPasswordForm.valid) {
      this.snackBar.open('Please enter a valid email address', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
      return;
    }

    const { email } = this.forgotPasswordForm.value;
    this.loading.set(true);

    try {
      const response = await this.authService.forgotPassword(email);
      
      if (response.success) {
        this.snackBar.open(response.message || 'If an account with that email exists, we have sent a password reset link.', 'Close', {
          duration: 8000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        this.forgotPasswordForm.reset();
      } else {
        this.snackBar.open(response.message || 'Failed to send password reset email. Please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    } catch (error: any) {
      this.snackBar.open(error?.message || 'An unexpected error occurred. Please try again.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
    } finally {
      this.loading.set(false);
    }
  }

  // Getter for template convenience
  get emailControl() { 
    return this.forgotPasswordForm.get('email'); 
  }
}
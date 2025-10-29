import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../shared/services';

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  
  if (!password || !confirmPassword) {
    return null;
  }
  
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for component state
  readonly loading = signal(false);
  readonly verifyingToken = signal(false);
  readonly tokenValid = signal(false);
  readonly userEmail = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly currentPassword = signal('');
  readonly formValid = signal(false);

  // Token from URL
  private resetToken = '';

  // Reactive form
  readonly resetPasswordForm: FormGroup;

  // Computed signals
  readonly isFormValid = computed(() => this.formValid());

  // Password requirement computed signals
  readonly hasMinLength = computed(() => {
    const password = this.currentPassword();
    return password.length >= 8;
  });

  readonly hasUppercase = computed(() => {
    const password = this.currentPassword();
    return /[A-Z]/.test(password);
  });

  readonly hasLowercase = computed(() => {
    const password = this.currentPassword();
    return /[a-z]/.test(password);
  });

  readonly hasNumber = computed(() => {
    const password = this.currentPassword();
    return /\d/.test(password);
  });

  readonly hasSpecialChar = computed(() => {
    const password = this.currentPassword();
    return /[@$!%*?&]/.test(password);
  });

  constructor() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    // Subscribe to password changes to update the signal
    this.resetPasswordForm.get('newPassword')?.valueChanges.subscribe(value => {
      this.currentPassword.set(value || '');
    });

    // Subscribe to form status changes to update form validity
    this.resetPasswordForm.statusChanges.subscribe(() => {
      this.formValid.set(this.resetPasswordForm.valid);
    });

    // Initial form validity check
    this.formValid.set(this.resetPasswordForm.valid);
  }

  async ngOnInit() {
    // Get token from URL
    this.route.queryParams.subscribe(async params => {
      this.resetToken = params['token'];
      if (this.resetToken) {
        await this.verifyToken();
      } else {
        this.snackBar.open('Invalid reset link. Please request a new password reset.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  private async verifyToken() {
    this.verifyingToken.set(true);
    
    try {
      const response = await this.authService.verifyResetToken(this.resetToken);
      
      if (response.success) {
        this.tokenValid.set(true);
        this.userEmail.set(response?.data?.email || '');
      } else {
        this.snackBar.open(response.message || 'Invalid or expired reset token.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
        this.tokenValid.set(false);
      }
    } catch (error: any) {
      this.snackBar.open(error?.message || 'Invalid or expired reset token.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
      this.tokenValid.set(false);
    } finally {
      this.verifyingToken.set(false);
    }
  }

  async onSubmit() {
    if (!this.resetPasswordForm.valid) {
      if (this.resetPasswordForm.hasError('passwordMismatch')) {
        this.snackBar.open('Passwords do not match', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      } else {
        this.snackBar.open('Please check all fields and try again', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
      return;
    }

    const { newPassword, confirmPassword } = this.resetPasswordForm.value;
    this.loading.set(true);

    try {
      const response = await this.authService.resetPassword(this.resetToken, newPassword, confirmPassword);
      
      if (response.success) {
        this.snackBar.open(response.message || 'Password has been reset successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login'], { 
            queryParams: { message: 'Password reset successful. Please log in with your new password.' }
          });
        }, 2000);
      } else {
        this.snackBar.open(response.message || 'Failed to reset password. Please try again.', 'Close', {
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

  // Password visibility toggle methods
  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  // Getters for template convenience
  get newPasswordControl() { 
    return this.resetPasswordForm.get('newPassword'); 
  }

  get confirmPasswordControl() { 
    return this.resetPasswordForm.get('confirmPassword'); 
  }
}
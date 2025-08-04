import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly user = this.authService.user;
  readonly isLoading = signal(false);

  profileForm: FormGroup;
  passwordForm: FormGroup;

  constructor() {
    const currentUser = this.user();
    
    // Profile form
    this.profileForm = this.fb.group({
      first_name: [currentUser?.first_name || '', [Validators.required]],
      last_name: [currentUser?.last_name || ''],
      email: [currentUser?.email || '', [Validators.required, Validators.email]],
      phone: [currentUser?.phone || ''],
      bio: [currentUser?.bio || ''],
      city: [currentUser?.city || ''],
      country: [currentUser?.country || ''],
      country_of_origin: [currentUser?.country_of_origin || '']
    });

    // Password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
    
    return null;
  }

  async updateProfile() {
    if (this.profileForm.invalid) {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading.set(true);
    
    try {
      const formData = this.profileForm.value;
      // TODO: Implement profile update API call
      // await this.authService.updateProfile(formData);
      
      this.snackBar.open('Profile updated successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      this.snackBar.open('Failed to update profile. Please try again.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async updatePassword() {
    if (this.passwordForm.invalid) {
      this.snackBar.open('Please fill in all fields correctly', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading.set(true);
    
    try {
      const { currentPassword, newPassword } = this.passwordForm.value;
      // TODO: Implement password update API call
      // await this.authService.updatePassword(currentPassword, newPassword);
      
      this.passwordForm.reset();
      this.snackBar.open('Password updated successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      this.snackBar.open('Failed to update password. Please try again.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user) return '';
    
    if (user.first_name || user.last_name) {
      const firstInitial = user.first_name?.charAt(0).toUpperCase() || '';
      const lastInitial = user.last_name?.charAt(0).toUpperCase() || '';
      return firstInitial + lastInitial;
    }
    
    return user.email.charAt(0).toUpperCase();
  }
}

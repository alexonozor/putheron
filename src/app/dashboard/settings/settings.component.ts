import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly user = this.authService.user;
  readonly isLoading = signal(false);

  settingsForm: FormGroup;

  constructor() {
    const currentUser = this.user();
    
    this.settingsForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications: [true],
      marketingEmails: [false],
      projectUpdates: [true],
      messageNotifications: [true],
      language: ['en'],
      timezone: ['UTC'],
      theme: ['light']
    });
  }

  async saveSettings() {
    this.isLoading.set(true);
    
    try {
      const formData = this.settingsForm.value;
      // TODO: Implement settings update API call
      // await this.settingsService.updateSettings(formData);
      
      this.snackBar.open('Settings saved successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      this.snackBar.open('Failed to save settings. Please try again.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async resetSettings() {
    // Reset to default values
    this.settingsForm.patchValue({
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      projectUpdates: true,
      messageNotifications: true,
      language: 'en',
      timezone: 'UTC',
      theme: 'light'
    });

    this.snackBar.open('Settings reset to default values', 'Close', {
      duration: 3000
    });
  }
}

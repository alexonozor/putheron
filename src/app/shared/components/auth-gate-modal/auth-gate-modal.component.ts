import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-gate-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './auth-gate-modal.component.html',
  styleUrls: ['./auth-gate-modal.component.scss']
})
export class AuthGateModalComponent {
  private dialogRef = inject(MatDialogRef<AuthGateModalComponent>);

  username: string = '';
  password: string = '';
  errorMessage: string = '';
  showPassword: boolean = false;

  private readonly CORRECT_USERNAME = 'admin';
  private readonly CORRECT_PASSWORD = 'adminalexolalinsey';

  onSubmit(): void {
    if (this.username === this.CORRECT_USERNAME && this.password === this.CORRECT_PASSWORD) {
      // Store authentication state in sessionStorage
      sessionStorage.setItem('authGateAccess', 'true');
      this.dialogRef.close(true);
    } else {
      this.errorMessage = 'Invalid username or password. Please try again.';
      this.password = '';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}

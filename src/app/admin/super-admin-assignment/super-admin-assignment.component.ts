import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { RoleService } from '../../shared/services/role.service';

@Component({
  selector: 'app-super-admin-assignment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatIconModule
  ],
  template: `
    <div class="super-admin-assignment-container">
      <mat-card class="assignment-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>admin_panel_settings</mat-icon>
            Super Admin Assignment
          </mat-card-title>
          <mat-card-subtitle>
            Assign super admin privileges to a user by User ID
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form (ngSubmit)="assignSuperAdmin()" #assignForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>User ID</mat-label>
              <input 
                matInput 
                [(ngModel)]="userId" 
                name="userId"
                placeholder="Enter user ID (e.g., 687e220f5c54f009db530a0d)"
                required
                #userIdInput="ngModel">
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="userIdInput.invalid && userIdInput.touched">
                User ID is required
              </mat-error>
            </mat-form-field>

            <div class="assignment-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="isLoading() || assignForm.invalid">
                <mat-icon>security</mat-icon>
                Assign Super Admin
              </button>
              
              <button 
                mat-button 
                type="button"
                (click)="clearForm()"
                [disabled]="isLoading()">
                <mat-icon>clear</mat-icon>
                Clear
              </button>
            </div>
          </form>

          <mat-progress-bar 
            *ngIf="isLoading()" 
            mode="indeterminate"
            class="loading-bar">
          </mat-progress-bar>
        </mat-card-content>
      </mat-card>

      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>info</mat-icon>
            Quick Reference
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="info-section">
            <h4>Rachel's User ID:</h4>
            <code class="user-id-code">687e220f5c54f009db530a0d</code>
            <button 
              mat-icon-button 
              (click)="copyRachelId()"
              matTooltip="Copy Rachel's ID">
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
          
          <div class="info-section">
            <h4>Super Admin Privileges:</h4>
            <ul class="privileges-list">
              <li>Full system access</li>
              <li>Manage all users and roles</li>
              <li>Access admin panel</li>
              <li>System configuration</li>
            </ul>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .super-admin-assignment-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
      display: grid;
      gap: 20px;
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 768px) {
      .super-admin-assignment-container {
        grid-template-columns: 1fr;
        padding: 10px;
      }
    }

    .assignment-card {
      height: fit-content;
    }

    .info-card {
      height: fit-content;
    }

    mat-card-header {
      margin-bottom: 20px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .assignment-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .assignment-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .loading-bar {
      margin-top: 16px;
    }

    .info-section {
      margin-bottom: 20px;
    }

    .info-section h4 {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .user-id-code {
      background-color: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      display: inline-block;
      margin-right: 8px;
      border: 1px solid #ddd;
    }

    .privileges-list {
      margin: 0;
      padding-left: 20px;
    }

    .privileges-list li {
      margin-bottom: 4px;
      font-size: 14px;
    }

    .mat-mdc-card-header .mat-mdc-card-title {
      font-size: 20px;
      font-weight: 500;
    }

    .mat-mdc-card-subtitle {
      font-size: 14px;
      color: #666;
    }
  `]
})
export class SuperAdminAssignmentComponent {
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);

  userId = '';
  isLoading = signal(false);
  rachelUserId = '687e220f5c54f009db530a0d';

  async assignSuperAdmin() {
    if (!this.userId.trim()) {
      this.snackBar.open('Please enter a User ID', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);
    
    try {
      await this.roleService.makeSuperAdminAsync(this.userId.trim());
      
      this.snackBar.open(
        `✅ User ${this.userId} has been successfully assigned as Super Admin!`, 
        'Close', 
        { 
          duration: 5000,
          panelClass: ['success-snackbar']
        }
      );
      
      this.clearForm();
    } catch (error: any) {
      console.error('Error assigning super admin:', error);
      
      this.snackBar.open(
        `❌ Failed to assign super admin: ${error.message || 'Unknown error'}`, 
        'Close', 
        { 
          duration: 7000,
          panelClass: ['error-snackbar']
        }
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  clearForm() {
    this.userId = '';
  }

  copyRachelId() {
    navigator.clipboard.writeText(this.rachelUserId).then(() => {
      this.snackBar.open('Rachel\'s User ID copied to clipboard!', 'Close', { duration: 2000 });
    }).catch(err => {
      console.error('Failed to copy:', err);
      this.snackBar.open('Failed to copy User ID', 'Close', { duration: 2000 });
    });
  }
}
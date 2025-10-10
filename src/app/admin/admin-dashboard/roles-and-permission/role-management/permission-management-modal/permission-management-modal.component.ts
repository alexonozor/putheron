import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { RoleService, Role, Permission } from '../../../../../shared/services/role.service';

export interface PermissionManagementDialogData {
  role: Role;
  allPermissions: Permission[];
}

@Component({
  selector: 'app-permission-management-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './permission-management-modal.component.html',
  styleUrl: './permission-management-modal.component.scss'
})
export class PermissionManagementModalComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly snackBar = inject(MatSnackBar);

  currentPermissions: Permission[] = [];
  availablePermissions: Permission[] = [];
  filteredAvailablePermissions: Permission[] = [];
  searchTerm = '';
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<PermissionManagementModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PermissionManagementDialogData
  ) {}

  ngOnInit() {
    this.loadPermissions();
  }

  loadPermissions() {
    // Get current permissions for the role
    this.currentPermissions = this.getRolePermissions(this.data.role);
    
    // Get available permissions (not assigned to this role)
    this.availablePermissions = this.getAvailablePermissions(this.data.role);
    
    // Initialize filtered available permissions
    this.filteredAvailablePermissions = [...this.availablePermissions];
  }

  private getRolePermissions(role: Role): Permission[] {
    if (!Array.isArray(role.permissions)) return [];
    
    return role.permissions
      .map(p => typeof p === 'string' 
        ? this.data.allPermissions.find(perm => perm._id === p)
        : p
      )
      .filter((p): p is Permission => !!p);
  }

  private getAvailablePermissions(role: Role): Permission[] {
    const rolePermissionIds = this.getRolePermissionIds(role);
    return this.data.allPermissions.filter(permission => 
      permission.is_active && !rolePermissionIds.includes(permission._id)
    );
  }

  private getRolePermissionIds(role: Role): string[] {
    if (!Array.isArray(role.permissions)) return [];
    
    return role.permissions.map(p => typeof p === 'string' ? p : p._id);
  }

  filterAvailablePermissions() {
    if (!this.searchTerm.trim()) {
      this.filteredAvailablePermissions = [...this.availablePermissions];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredAvailablePermissions = this.availablePermissions.filter(permission =>
      permission.name.toLowerCase().includes(term) ||
      permission.description?.toLowerCase().includes(term) ||
      permission.module.toLowerCase().includes(term) ||
      permission.action.toLowerCase().includes(term)
    );
  }

  async addPermission(permissionId: string) {
    try {
      this.isLoading = true;
      
      await this.roleService.addPermissionsToRoleAsync(this.data.role._id, [permissionId]);
      
      // Update the role object with new permissions
      const permission = this.data.allPermissions.find(p => p._id === permissionId);
      if (permission) {
        // Add to current permissions
        this.currentPermissions.push(permission);
        
        // Remove from available permissions
        this.availablePermissions = this.availablePermissions.filter(p => p._id !== permissionId);
        this.filterAvailablePermissions();
        
        // Update the role object
        if (Array.isArray(this.data.role.permissions)) {
          (this.data.role.permissions as any[]).push(permissionId);
        } else {
          this.data.role.permissions = [permissionId];
        }
      }
      
      this.showSuccessMessage('Permission added successfully');
    } catch (error: any) {
      console.error('Add permission error:', error);
      this.showErrorMessage(error.message || 'Failed to add permission');
    } finally {
      this.isLoading = false;
    }
  }

  async removePermission(permissionId: string) {
    const permission = this.currentPermissions.find(p => p._id === permissionId);
    if (!permission) return;

    if (!confirm(`Remove "${permission.name}" from this role?`)) {
      return;
    }

    try {
      this.isLoading = true;
      
      await this.roleService.removePermissionsFromRoleAsync(this.data.role._id, [permissionId]);
      
      // Update local state
      this.currentPermissions = this.currentPermissions.filter(p => p._id !== permissionId);
      
      // Add back to available permissions
      this.availablePermissions.push(permission);
      this.availablePermissions.sort((a, b) => a.name.localeCompare(b.name));
      this.filterAvailablePermissions();
      
      // Update the role object
      if (Array.isArray(this.data.role.permissions)) {
        (this.data.role.permissions as any[]) = (this.data.role.permissions as any[]).filter(p => {
          const id = typeof p === 'string' ? p : p._id;
          return id !== permissionId;
        });
      }
      
      this.showSuccessMessage('Permission removed successfully');
    } catch (error: any) {
      console.error('Remove permission error:', error);
      this.showErrorMessage(error.message || 'Failed to remove permission');
    } finally {
      this.isLoading = false;
    }
  }

  closeModal() {
    this.dialogRef.close();
  }

  private showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
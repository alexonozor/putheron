import { Component, OnInit, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { RoleService, Role, Permission } from '../../../../../shared/services/role.service';

export interface RoleFormData {
  role?: Role;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './role-form-modal.component.html'
})
export class RoleFormModalComponent implements OnInit {
  roleForm: FormGroup;
  isEditing: boolean;
  isSaving = false;
  errorMessage = '';
  selectedPermissions: string[] = [];
  
  // Signals for permissions
  allPermissions = signal<Permission[]>([]);

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    public dialogRef: MatDialogRef<RoleFormModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoleFormData
  ) {
    this.isEditing = !!data.role;
    this.allPermissions.set(data.permissions || []);
    
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      display_name: [''],
      description: ['', [Validators.required, Validators.minLength(5)]],
      color: ['#6366f1'],
      priority: [50, [Validators.min(1), Validators.max(100)]],
      permissions: [[]]
    });
  }

  ngOnInit() {
    if (this.data.role) {
      this.loadRoleData();
    }
  }

  loadRoleData() {
    const role = this.data.role!;
    this.selectedPermissions = Array.isArray(role.permissions) 
      ? role.permissions.map(p => typeof p === 'string' ? p : p._id)
      : [];
    
    this.roleForm.patchValue({
      name: role.name,
      display_name: role.display_name || '',
      description: role.description,
      color: role.color || '#6366f1',
      priority: role.priority,
      permissions: this.selectedPermissions
    });
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  togglePermission(permissionId: string) {
    const index = this.selectedPermissions.indexOf(permissionId);
    if (index > -1) {
      this.selectedPermissions.splice(index, 1);
    } else {
      this.selectedPermissions.push(permissionId);
    }
    
    this.roleForm.patchValue({
      permissions: this.selectedPermissions
    });
  }

  async saveRole() {
    if (this.roleForm.invalid) return;

    try {
      this.isSaving = true;
      this.errorMessage = '';

      const formValue = this.roleForm.value;
      const roleData = {
        name: formValue.name.trim(),
        display_name: formValue.display_name?.trim() || undefined,
        description: formValue.description.trim(),
        color: formValue.color,
        priority: formValue.priority,
        permissions: this.selectedPermissions
      };

      let result: Role;
      if (this.isEditing && this.data.role) {
        result = await this.roleService.updateRoleAsync(this.data.role._id, roleData);
      } else {
        result = await this.roleService.createRoleAsync(roleData);
      }

      this.dialogRef.close({ success: true, role: result });
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save role';
    } finally {
      this.isSaving = false;
    }
  }

  onCancel() {
    this.dialogRef.close({ success: false });
  }

  // Group permissions by module for better organization
  getPermissionsByModule(): { [module: string]: Permission[] } {
    const grouped = this.allPermissions().reduce((acc, permission) => {
      const module = permission.module || 'Other';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {} as { [module: string]: Permission[] });

    // Sort permissions within each module
    Object.keys(grouped).forEach(module => {
      grouped[module].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }

  getModuleNames(): string[] {
    return Object.keys(this.getPermissionsByModule()).sort();
  }

  trackByPermissionId(index: number, permission: Permission): string {
    return permission._id;
  }
}
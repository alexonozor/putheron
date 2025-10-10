import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RoleService, Role, Permission } from '../../../../shared/services/role.service';
import { RoleFormModalComponent } from './role-form-modal/role-form-modal.component';
import { RoleUsersModalComponent } from '../role-users-modal/role-users-modal.component';
import { PermissionManagementModalComponent } from './permission-management-modal/permission-management-modal.component';
import { HasPermissionDirective, HasRoleDirective, CanAccessDirective, IsAdminDirective } from '../../../../shared/directives/permission.directive';
import { HasPermissionPipe, HasRolePipe, CanAccessPipe, IsAdminPipe } from '../../../../shared/pipes/permission.pipe';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    HasPermissionDirective
  ],
  templateUrl: './role-management.component.html'
})
export class RoleManagementComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for reactive state
  allRoles = signal<Role[]>([]);
  allPermissions = signal<Permission[]>([]);
  filteredRoles = signal<Role[]>([]);

  // UI state
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // View is always table now (removed card view)
  
  // Filters
  searchTerm = '';
  showOnlyActive = true;
  showSystemRoles = false;

  // UI state
  showPermissionDetails: { [key: string]: boolean } = {};
  
  // Table configuration
  displayedColumns: string[] = ['status', 'name', 'description', 'permissions', 'priority', 'created', 'actions'];
  tableDataSource = signal<Role[]>([]);

  constructor() {}

  async ngOnInit() {
    await this.loadRoles();
    await this.loadPermissions();
  }

  // ============= DATA LOADING =============

  async loadRoles() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      console.log('Loading roles...');
      const roles = await this.roleService.getAllRolesAsync({
        is_active: undefined, // Load all roles initially
        is_system_role: undefined
      });
      
      console.log('Loaded roles:', roles.length);
      this.allRoles.set(roles);
      this.filterRoles();
    } catch (error: any) {
      console.error('Failed to load roles:', error);
      this.errorMessage = error.message || 'Failed to load roles';
    } finally {
      this.isLoading = false;
    }
  }

  async loadPermissions() {
    try {
      const permissions = await this.roleService.getAllPermissionsAsync({
        is_active: true
      });
      this.allPermissions.set(permissions);
    } catch (error: any) {
      console.error('Failed to load permissions:', error);
    }
  }

  // ============= FILTERING =============

  filterRoles() {
    let filtered = [...this.allRoles()];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(role => 
        role.name.toLowerCase().includes(term) ||
        role.description.toLowerCase().includes(term) ||
        (role.display_name?.toLowerCase().includes(term))
      );
    }

    // Apply active filter
    if (this.showOnlyActive) {
      filtered = filtered.filter(role => role.is_active);
    }

    // Apply system role filter
    if (!this.showSystemRoles) {
      filtered = filtered.filter(role => !role.is_system_role);
    }

    // Sort by priority (higher priority first), then by name
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.name.localeCompare(b.name);
    });

    this.filteredRoles.set(filtered);
    this.tableDataSource.set(filtered); // Update table data as well
  }



  // ============= MODAL MANAGEMENT =============

  openCreateRoleModal() {
    const dialogRef = this.dialog.open(RoleFormModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: {
        permissions: this.allPermissions()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showSuccessMessage(result.role ? 'Role created successfully' : 'Role created successfully');
        this.loadRoles();
      }
    });
  }

  editRole(role: Role) {
    const dialogRef = this.dialog.open(RoleFormModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: {
        role: role,
        permissions: this.allPermissions()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showSuccessMessage('Role updated successfully');
        this.loadRoles();
      }
    });
  }

  togglePermissionDetails(roleId: string) {
    this.showPermissionDetails[roleId] = !this.showPermissionDetails[roleId];
  }

  // ============= ROLE OPERATIONS =============

  async addPermissionToRole(role: Role, permissionId: string) {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      await this.roleService.addPermissionsToRoleAsync(role._id, [permissionId]);
      
      this.showSuccessMessage('Permission added to role successfully');
      await this.loadRoles();
    } catch (error: any) {
      console.error('Add permission error:', error);
      this.errorMessage = error.message || 'Failed to add permission to role';
      this.snackBar.open(this.errorMessage, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }

  async removePermissionFromRole(role: Role, permissionId: string) {
    const permission = this.allPermissions().find(p => p._id === permissionId);
    const permissionName = permission ? permission.name : 'Unknown Permission';
    
    if (!confirm(`Remove "${permissionName}" from role "${role.display_name || role.name}"?`)) {
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      await this.roleService.removePermissionsFromRoleAsync(role._id, [permissionId]);
      
      this.showSuccessMessage('Permission removed from role successfully');
      await this.loadRoles();
    } catch (error: any) {
      console.error('Remove permission error:', error);
      this.errorMessage = error.message || 'Failed to remove permission from role';
      this.snackBar.open(this.errorMessage, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }

  async setRolePermissions(role: Role, permissionIds: string[]) {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      await this.roleService.setRolePermissionsAsync(role._id, permissionIds);
      
      this.showSuccessMessage('Role permissions updated successfully');
      await this.loadRoles();
    } catch (error: any) {
      console.error('Set permissions error:', error);
      this.errorMessage = error.message || 'Failed to update role permissions';
      this.snackBar.open(this.errorMessage, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }

  async deleteRole(role: Role) {
    if (!confirm(`Are you sure you want to delete the role "${role.display_name || role.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      console.log('Deleting role:', role._id);
      await this.roleService.deleteRoleAsync(role._id);
      
      this.showSuccessMessage('Role deleted successfully');
      await this.loadRoles();
    } catch (error: any) {
      console.error('Delete role error:', error);
      
      let errorMessage = 'Failed to delete role';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 404) {
        errorMessage = 'Role not found';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to delete this role';
      } else if (error.status === 400) {
        errorMessage = 'Cannot delete role - it may be in use or protected';
      }
      
      this.errorMessage = errorMessage;
      this.snackBar.open(errorMessage, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }

  // ============= PERMISSION MANAGEMENT =============

  manageRolePermissions(role: Role) {
    // This will open a modal to manage permissions for the specific role
    // For now, we'll implement a simple approach with a dialog
    this.openPermissionManagementModal(role);
  }

  openPermissionManagementModal(role: Role) {
    const dialogRef = this.dialog.open(PermissionManagementModalComponent, {
      data: { 
        role: role,
        allPermissions: this.allPermissions()
      },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'permission-management-dialog',
      disableClose: false
    });

    // Refresh roles when modal is closed to reflect any changes
    dialogRef.afterClosed().subscribe(() => {
      this.loadRoles();
    });
  }



  // ============= UTILITY METHODS =============

  showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  viewRoleUsers(role: Role) {
    const dialogRef = this.dialog.open(RoleUsersModalComponent, {
      data: { role },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'role-users-dialog',
      disableClose: false
    });

    // Refresh data when modal is closed to reflect any changes
    dialogRef.afterClosed().subscribe(() => {
      // Optionally refresh roles if needed (e.g., if user counts changed)
      this.loadRoles();
    });
  }

  // ============= UTILITY METHODS =============

  getPermissionCount(role: Role): number {
    return Array.isArray(role.permissions) ? role.permissions.length : 0;
  }

  getRolePermissions(role: Role): Permission[] {
    if (!Array.isArray(role.permissions)) return [];
    
    return role.permissions
      .map(p => typeof p === 'string' 
        ? this.allPermissions().find(perm => perm._id === p)
        : p
      )
      .filter((p): p is Permission => !!p);
  }

  getAvailablePermissions(role: Role): Permission[] {
    const rolePermissionIds = this.getRolePermissionIds(role);
    return this.allPermissions().filter(permission => 
      permission.is_active && !rolePermissionIds.includes(permission._id)
    );
  }

  getRolePermissionIds(role: Role): string[] {
    if (!Array.isArray(role.permissions)) return [];
    
    return role.permissions.map(p => typeof p === 'string' ? p : p._id);
  }

  hasPermission(role: Role, permissionId: string): boolean {
    return this.getRolePermissionIds(role).includes(permissionId);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  trackByRoleId(index: number, role: Role): string {
    return role._id;
  }

  trackByPermissionId(index: number, permission: Permission): string {
    return permission._id;
  }

  // ============= STATISTICS METHODS =============

  getActiveRolesCount(): number {
    return this.allRoles().filter(role => role.is_active).length;
  }

  getSystemRolesCount(): number {
    return this.allRoles().filter(role => role.is_system_role).length;
  }

  getTotalRolesCount(): number {
    return this.allRoles().length;
  }
}
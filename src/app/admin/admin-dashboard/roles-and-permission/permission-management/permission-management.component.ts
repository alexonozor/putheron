import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoleService, Permission, CreatePermissionDto } from '../../../../shared/services/role.service';

@Component({
  selector: 'app-permission-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './permission-management.component.html'
})
export class PermissionManagementComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly fb = inject(FormBuilder);

  // Signals for reactive state
  allPermissions = signal<Permission[]>([]);
  filteredPermissions = signal<Permission[]>([]);

  // Form and UI state
  permissionForm: FormGroup;
  selectedPermission: Permission | null = null;
  showCreateForm = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  
  // Filters
  searchTerm = '';
  selectedModule = '';
  selectedAction = '';
  showOnlyActive = true;

  // Available options
  availableModules: string[] = [];
  availableActions: string[] = [];

  constructor() {
    this.permissionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      module: ['', Validators.required],
      action: ['', Validators.required],
      resource: [''],
      conditions: ['']
    });
  }

  async ngOnInit() {
    await this.loadPermissions();
  }

  // ============= DATA LOADING =============

  async loadPermissions() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      const permissions = await this.roleService.getAllPermissionsAsync({
        is_active: undefined // Load all permissions initially
      });
      
      this.allPermissions.set(permissions);
      this.extractAvailableOptions(permissions);
      this.filterPermissions();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to load permissions';
    } finally {
      this.isLoading = false;
    }
  }

  private extractAvailableOptions(permissions: Permission[]) {
    this.availableModules = [...new Set(permissions.map(p => p.module))].sort();
    this.availableActions = [...new Set(permissions.map(p => p.action))].sort();
  }

  // ============= FILTERING =============

  filterPermissions() {
    let filtered = [...this.allPermissions()];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(permission => 
        permission.name.toLowerCase().includes(term) ||
        permission.description.toLowerCase().includes(term) ||
        permission.module.toLowerCase().includes(term) ||
        permission.action.toLowerCase().includes(term) ||
        (permission.resource?.toLowerCase().includes(term))
      );
    }

    // Apply module filter
    if (this.selectedModule) {
      filtered = filtered.filter(permission => permission.module === this.selectedModule);
    }

    // Apply action filter
    if (this.selectedAction) {
      filtered = filtered.filter(permission => permission.action === this.selectedAction);
    }

    // Apply active filter
    if (this.showOnlyActive) {
      filtered = filtered.filter(permission => permission.is_active);
    }

    // Sort by module, then action, then name
    filtered.sort((a, b) => {
      if (a.module !== b.module) {
        return a.module.localeCompare(b.module);
      }
      if (a.action !== b.action) {
        return a.action.localeCompare(b.action);
      }
      return a.name.localeCompare(b.name);
    });

    this.filteredPermissions.set(filtered);
  }

  // ============= FORM MANAGEMENT =============

  editPermission(permission: Permission) {
    this.selectedPermission = permission;
    
    this.permissionForm.patchValue({
      name: permission.name,
      description: permission.description,
      module: permission.module,
      action: permission.action,
      resource: permission.resource || '',
      conditions: permission.conditions || ''
    });
    
    this.showCreateForm = false;
  }

  closeForm(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal-content')) {
      return;
    }
    
    this.showCreateForm = false;
    this.selectedPermission = null;
    this.permissionForm.reset();
  }

  async savePermission() {
    if (this.permissionForm.invalid) return;

    try {
      this.isSaving = true;
      this.errorMessage = '';

      const formValue = this.permissionForm.value;
      
      // Validate JSON conditions if provided
      if (formValue.conditions?.trim()) {
        try {
          JSON.parse(formValue.conditions);
        } catch {
          this.errorMessage = 'Invalid JSON format in conditions';
          return;
        }
      }

      const permissionData: CreatePermissionDto = {
        name: formValue.name.trim(),
        description: formValue.description.trim(),
        module: formValue.module,
        action: formValue.action,
        resource: formValue.resource?.trim() || undefined,
        conditions: formValue.conditions?.trim() || undefined
      };

      let result: Permission;
      if (this.selectedPermission) {
        result = await this.roleService.updatePermissionAsync(this.selectedPermission._id, permissionData);
        this.successMessage = 'Permission updated successfully';
      } else {
        result = await this.roleService.createPermissionAsync(permissionData);
        this.successMessage = 'Permission created successfully';
      }

      await this.loadPermissions();
      this.closeForm();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save permission';
    } finally {
      this.isSaving = false;
    }
  }

  // ============= PERMISSION OPERATIONS =============

  async togglePermissionStatus(permission: Permission) {
    try {
      const newStatus = !permission.is_active;
      await this.roleService.updatePermissionAsync(permission._id, { 
        name: permission.name,
        description: permission.description,
        module: permission.module,
        action: permission.action,
        resource: permission.resource,
        conditions: permission.conditions
      });
      
      this.successMessage = `Permission ${newStatus ? 'activated' : 'deactivated'} successfully`;
      await this.loadPermissions();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to update permission status';
    }
  }

  async deletePermission(permission: Permission) {
    if (!confirm(`Are you sure you want to delete the permission "${permission.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await this.roleService.deletePermissionAsync(permission._id);
      this.successMessage = 'Permission deleted successfully';
      await this.loadPermissions();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to delete permission';
    }
  }

  // ============= UTILITY METHODS =============

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  trackByPermissionId(index: number, permission: Permission): string {
    return permission._id;
  }
}
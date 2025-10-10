import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleService, Role, Permission, UserRole } from '../../../../shared/services/role.service';
import { UserService, User } from '../../../../shared/services/user.service';

@Component({
  selector: 'app-role-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="p-6 space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">RBAC System Demo</h2>
      
      <!-- Role Selection -->
      <mat-card class="p-4">
        <mat-card-header>
          <mat-card-title>Select Role to Manage</mat-card-title>
        </mat-card-header>
        <mat-card-content class="mt-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Select Role</mat-label>
            <mat-select [(value)]="selectedRoleId" (selectionChange)="onRoleSelected()">
              <mat-option *ngFor="let role of roles()" [value]="role._id">
                {{ role.display_name || role.name }} ({{ getRolePermissionCount(role) }} permissions)
              </mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Role Details -->
      <mat-card *ngIf="selectedRole()" class="p-4">
        <mat-card-header>
          <mat-card-title>Role: {{ selectedRole()!.display_name || selectedRole()!.name }}</mat-card-title>
        </mat-card-header>
        <mat-card-content class="mt-4 space-y-4">
          <div>
            <h4 class="font-semibold text-gray-900">Description:</h4>
            <p class="text-gray-600">{{ selectedRole()!.description }}</p>
          </div>

          <!-- Current Permissions -->
          <div>
            <h4 class="font-semibold text-gray-900">Current Permissions ({{ getRolePermissionCount(selectedRole()!) }}):</h4>
            <div class="flex flex-wrap gap-2 mt-2">
              <span *ngFor="let permission of getRolePermissions(selectedRole()!)" 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ permission.name }}
                <button (click)="removePermissionFromRole(permission._id)" 
                        class="ml-1 text-blue-600 hover:text-blue-800">
                  <mat-icon class="text-sm">close</mat-icon>
                </button>
              </span>
            </div>
          </div>

          <!-- Add Permission -->
          <div>
            <h4 class="font-semibold text-gray-900">Add Permission:</h4>
            <div class="flex gap-2 mt-2">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Available Permissions</mat-label>
                <mat-select [(value)]="selectedPermissionId">
                  <mat-option *ngFor="let permission of getAvailablePermissions(selectedRole()!)" [value]="permission._id">
                    {{ permission.name }} ({{ permission.module }}.{{ permission.action }})
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" 
                      (click)="addPermissionToRole()"
                      [disabled]="!selectedPermissionId">
                Add Permission
              </button>
            </div>
          </div>

          <!-- Current Users -->
          <div>
            <h4 class="font-semibold text-gray-900">Assigned Users ({{ roleUsers().length }}):</h4>
            <div class="space-y-2 mt-2">
              <div *ngFor="let userRole of roleUsers()" 
                   class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span class="font-medium">{{ getUserName(userRole) }}</span>
                  <span class="text-sm text-gray-600 ml-2">
                    Assigned {{ formatDate(userRole.assigned_at) }}
                  </span>
                </div>
                <button mat-icon-button color="warn" (click)="removeUserFromRole(userRole)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Add User -->
          <div>
            <h4 class="font-semibold text-gray-900">Assign User:</h4>
            <div class="flex gap-2 mt-2">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Available Users</mat-label>
                <mat-select [(value)]="selectedUserId">
                  <mat-option *ngFor="let user of availableUsers()" [value]="user._id">
                    {{ getUserDisplayName(user) }} ({{ user.email }})
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" 
                      (click)="assignUserToRole()"
                      [disabled]="!selectedUserId">
                Assign User
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class RoleDemoComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals
  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  users = signal<User[]>([]);
  roleUsers = signal<UserRole[]>([]);
  selectedRole = signal<Role | null>(null);

  // UI state
  selectedRoleId = '';
  selectedPermissionId = '';
  selectedUserId = '';

  // Computed
  availableUsers = signal<User[]>([]);

  async ngOnInit() {
    await this.loadInitialData();
  }

  async loadInitialData() {
    try {
      const [rolesData, permissionsData, usersData] = await Promise.all([
        this.roleService.getAllRolesAsync({ is_active: true }),
        this.roleService.getAllPermissionsAsync({ is_active: true }),
        this.userService.getAllUsersAsync({ isActive: true })
      ]);

      this.roles.set(rolesData);
      this.permissions.set(permissionsData);
      this.users.set(usersData);
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      this.snackBar.open('Failed to load data', 'Close', { duration: 3000 });
    }
  }

  async onRoleSelected() {
    if (!this.selectedRoleId) {
      this.selectedRole.set(null);
      return;
    }

    try {
      const role = await this.roleService.getRoleWithDetailsAsync(this.selectedRoleId);
      const users = await this.roleService.getRoleUsersAsync(this.selectedRoleId);
      
      this.selectedRole.set(role);
      this.roleUsers.set(users);
      this.updateAvailableUsers();
    } catch (error: any) {
      console.error('Failed to load role details:', error);
      this.snackBar.open('Failed to load role details', 'Close', { duration: 3000 });
    }
  }

  updateAvailableUsers() {
    const assignedUserIds = this.roleUsers().map(ur => 
      typeof ur.user_id === 'string' ? ur.user_id : (ur.user_id as any)._id
    );
    
    const available = this.users().filter(user => 
      !assignedUserIds.includes(user._id)
    );
    
    this.availableUsers.set(available);
  }

  async addPermissionToRole() {
    if (!this.selectedPermissionId || !this.selectedRole()) return;

    try {
      await this.roleService.addPermissionsToRoleAsync(
        this.selectedRole()!._id, 
        [this.selectedPermissionId]
      );
      
      this.snackBar.open('Permission added successfully', 'Close', { duration: 3000 });
      this.selectedPermissionId = '';
      await this.onRoleSelected(); // Refresh
    } catch (error: any) {
      console.error('Failed to add permission:', error);
      this.snackBar.open('Failed to add permission', 'Close', { duration: 3000 });
    }
  }

  async removePermissionFromRole(permissionId: string) {
    if (!this.selectedRole()) return;

    try {
      await this.roleService.removePermissionsFromRoleAsync(
        this.selectedRole()!._id, 
        [permissionId]
      );
      
      this.snackBar.open('Permission removed successfully', 'Close', { duration: 3000 });
      await this.onRoleSelected(); // Refresh
    } catch (error: any) {
      console.error('Failed to remove permission:', error);
      this.snackBar.open('Failed to remove permission', 'Close', { duration: 3000 });
    }
  }

  async assignUserToRole() {
    if (!this.selectedUserId || !this.selectedRole()) return;

    try {
      await this.roleService.assignRoleAsync({
        user_id: this.selectedUserId,
        role_id: this.selectedRole()!._id
      });
      
      this.snackBar.open('User assigned successfully', 'Close', { duration: 3000 });
      this.selectedUserId = '';
      await this.onRoleSelected(); // Refresh
    } catch (error: any) {
      console.error('Failed to assign user:', error);
      this.snackBar.open('Failed to assign user', 'Close', { duration: 3000 });
    }
  }

  async removeUserFromRole(userRole: UserRole) {
    const userId = typeof userRole.user_id === 'string' ? userRole.user_id : (userRole.user_id as any)._id;
    
    try {
      await this.roleService.removeRoleAsync(userId, this.selectedRole()!._id);
      
      this.snackBar.open('User removed successfully', 'Close', { duration: 3000 });
      await this.onRoleSelected(); // Refresh
    } catch (error: any) {
      console.error('Failed to remove user:', error);
      this.snackBar.open('Failed to remove user', 'Close', { duration: 3000 });
    }
  }

  // Utility methods
  getRolePermissionCount(role: Role): number {
    return Array.isArray(role.permissions) ? role.permissions.length : 0;
  }

  getRolePermissions(role: Role): Permission[] {
    if (!Array.isArray(role.permissions)) return [];
    
    return role.permissions
      .map(p => typeof p === 'string' 
        ? this.permissions().find(perm => perm._id === p)
        : p
      )
      .filter((p): p is Permission => !!p);
  }

  getAvailablePermissions(role: Role): Permission[] {
    const rolePermissionIds = this.getRolePermissions(role).map(p => p._id);
    return this.permissions().filter(permission => 
      !rolePermissionIds.includes(permission._id)
    );
  }

  getUserName(userRole: UserRole): string {
    if (typeof userRole.user_id === 'object' && 'firstName' in userRole.user_id) {
      const user = userRole.user_id as any;
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    }
    
    const user = this.users().find(u => u._id === userRole.user_id);
    return user ? this.getUserDisplayName(user) : 'Unknown User';
  }

  getUserDisplayName(user: User): string {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}
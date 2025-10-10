import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ConfigService } from './config.service';

// Permission interfaces
export interface Permission {
  _id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource?: string;
  is_active: boolean;
  conditions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermissionDto {
  name: string;
  description: string;
  module: string;
  action: string;
  resource?: string;
  conditions?: string;
}

// User Assignment interface (embedded in roles)
export interface UserAssignment {
  user_id: any;
  assigned_by?: any;
  assigned_at?: Date;
  expires_at?: Date;
  is_active: boolean;
  notes?: string;
}

// Permission assignment DTOs
export interface AddPermissionToRoleDto {
  permission_ids: string[];
}

export interface RemovePermissionFromRoleDto {
  permission_ids: string[];
}

// Role interfaces with support for populated and unpopulated data
export interface BaseRole {
  _id: string;
  name: string;
  description: string;
  display_name?: string;
  is_active: boolean;
  is_system_role: boolean;
  color?: string;
  priority: number;
  expires_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role extends BaseRole {
  permissions: Permission[] | string[];
  users: UserAssignment[]; // Embedded user assignments
}

export interface PopulatedRole extends BaseRole {
  permissions: Permission[]; // Always populated
  users: PopulatedUserAssignment[]; // Always populated user assignments
}

export interface PopulatedUserAssignment {
  user_id: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  assigned_by?: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  assigned_at?: Date;
  expires_at?: Date;
  is_active: boolean;
  notes?: string;
}

export interface CreateRoleDto {
  name: string;
  description: string;
  display_name?: string;
  permissions?: string[];
  color?: string;
  priority?: number;
  expires_at?: Date;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  display_name?: string;
  permissions?: string[];
  color?: string;
  priority?: number;
  is_active?: boolean;
  expires_at?: Date;
}

// User Role interfaces (for API compatibility)
export interface UserRole {
  _id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at?: Date;
  expires_at?: Date;
  notes?: string;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssignRoleDto {
  user_id: string;
  role_id: string;
  expires_at?: Date;
  notes?: string;
}

// API Response interface
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private getApiUrl(endpoint: string): string {
    return this.config.getApiUrl(`/admin/roles${endpoint}`);
  }

  // ============= PERMISSION METHODS =============

  createPermission(permission: CreatePermissionDto): Observable<ApiResponse<Permission>> {
    return this.http.post<ApiResponse<Permission>>(
      this.getApiUrl('/permissions'),
      permission
    );
  }

  async createPermissionAsync(permission: CreatePermissionDto): Promise<Permission> {
    const response = await firstValueFrom(this.createPermission(permission));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create permission');
    }
    return response.data;
  }

  getAllPermissions(filters?: {
    module?: string;
    action?: string;
    is_active?: boolean;
    search?: string;
  }): Observable<ApiResponse<Permission[]>> {
    const params: any = {};
    if (filters?.module) params.module = filters.module;
    if (filters?.action) params.action = filters.action;
    if (filters?.is_active !== undefined) params.is_active = filters.is_active.toString();
    if (filters?.search) params.search = filters.search;

    return this.http.get<ApiResponse<Permission[]>>(
      this.getApiUrl('/permissions'),
      { params }
    );
  }

  async getAllPermissionsAsync(filters?: {
    module?: string;
    action?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<Permission[]> {
    const response = await firstValueFrom(this.getAllPermissions(filters));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch permissions');
    }
    return response.data;
  }

  getPermissionById(id: string): Observable<ApiResponse<Permission>> {
    return this.http.get<ApiResponse<Permission>>(
      this.getApiUrl(`/permissions/${id}`)
    );
  }

  async getPermissionByIdAsync(id: string): Promise<Permission> {
    const response = await firstValueFrom(this.getPermissionById(id));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch permission');
    }
    return response.data;
  }

  updatePermission(id: string, permission: Partial<CreatePermissionDto>): Observable<ApiResponse<Permission>> {
    return this.http.put<ApiResponse<Permission>>(
      this.getApiUrl(`/permissions/${id}`),
      permission
    );
  }

  async updatePermissionAsync(id: string, permission: Partial<CreatePermissionDto>): Promise<Permission> {
    const response = await firstValueFrom(this.updatePermission(id, permission));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update permission');
    }
    return response.data;
  }

  deletePermission(id: string): Observable<any> {
    return this.http.delete(this.getApiUrl(`/permissions/${id}`));
  }

  async deletePermissionAsync(id: string): Promise<void> {
    await firstValueFrom(this.deletePermission(id));
  }

  // ============= ROLE METHODS =============

  createRole(role: CreateRoleDto): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(
      this.getApiUrl(''),
      role
    );
  }

  async createRoleAsync(role: CreateRoleDto): Promise<Role> {
    const response = await firstValueFrom(this.createRole(role));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create role');
    }
    return response.data;
  }

  getAllRoles(filters?: {
    is_active?: boolean;
    is_system_role?: boolean;
    search?: string;
  }): Observable<ApiResponse<Role[]>> {
    const params: any = {};
    if (filters?.is_active !== undefined) params.is_active = filters.is_active.toString();
    if (filters?.is_system_role !== undefined) params.is_system_role = filters.is_system_role.toString();
    if (filters?.search) params.search = filters.search;

    return this.http.get<ApiResponse<Role[]>>(
      this.getApiUrl(''),
      { params }
    );
  }

  async getAllRolesAsync(filters?: {
    is_active?: boolean;
    is_system_role?: boolean;
    search?: string;
  }): Promise<Role[]> {
    const response = await firstValueFrom(this.getAllRoles(filters));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch roles');
    }
    return response.data;
  }

  getRoleById(id: string): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(
      this.getApiUrl(`/${id}`)
    );
  }

  async getRoleByIdAsync(id: string): Promise<Role> {
    const response = await firstValueFrom(this.getRoleById(id));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch role');
    }
    return response.data;
  }

  updateRole(id: string, role: Partial<CreateRoleDto>): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(
      this.getApiUrl(`/${id}`),
      role
    );
  }

  async updateRoleAsync(id: string, role: Partial<CreateRoleDto>): Promise<Role> {
    const response = await firstValueFrom(this.updateRole(id, role));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update role');
    }
    return response.data;
  }

  deleteRole(id: string): Observable<any> {
    console.log('Deleting role via API:', this.getApiUrl(`/${id}`));
    return this.http.delete(this.getApiUrl(`/${id}`));
  }

  async deleteRoleAsync(id: string): Promise<void> {
    try {
      console.log('Attempting to delete role:', id);
      const result = await firstValueFrom(this.deleteRole(id));
      console.log('Delete role result:', result);
    } catch (error) {
      console.error('Delete role failed:', error);
      throw error;
    }
  }

  getRoleUsers(roleId: string): Observable<ApiResponse<UserRole[]>> {
    return this.http.get<ApiResponse<UserRole[]>>(
      this.getApiUrl(`/${roleId}/users`)
    );
  }

  async getRoleUsersAsync(roleId: string): Promise<UserRole[]> {
    const response = await firstValueFrom(this.getRoleUsers(roleId));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch role users');
    }
    return response.data;
  }

  // ============= USER ROLE ASSIGNMENT METHODS =============

  assignRole(assignment: AssignRoleDto): Observable<ApiResponse<UserRole>> {
    return this.http.post<ApiResponse<UserRole>>(
      this.getApiUrl('/assign'),
      assignment
    );
  }

  async assignRoleAsync(assignment: AssignRoleDto): Promise<UserRole> {
    const response = await firstValueFrom(this.assignRole(assignment));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to assign role');
    }
    return response.data;
  }

  removeRole(userId: string, roleId: string): Observable<any> {
    return this.http.delete(this.getApiUrl(`/users/${userId}/roles/${roleId}`));
  }

  async removeRoleAsync(userId: string, roleId: string): Promise<void> {
    await firstValueFrom(this.removeRole(userId, roleId));
  }

  getUserRoles(userId: string): Observable<ApiResponse<UserRole[]>> {
    return this.http.get<ApiResponse<UserRole[]>>(
      this.getApiUrl(`/users/${userId}/roles`)
    );
  }

  async getUserRolesAsync(userId: string): Promise<UserRole[]> {
    const response = await firstValueFrom(this.getUserRoles(userId));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch user roles');
    }
    return response.data;
  }

  getUserPermissions(userId: string): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(
      this.getApiUrl(`/users/${userId}/permissions`)
    );
  }

  async getUserPermissionsAsync(userId: string): Promise<Permission[]> {
    const response = await firstValueFrom(this.getUserPermissions(userId));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch user permissions');
    }
    return response.data;
  }

  // ============= ROLE PERMISSION MANAGEMENT =============

  addPermissionsToRole(roleId: string, permissionIds: string[]): Observable<ApiResponse<Role>> {
    return this.getRoleById(roleId).pipe(
      switchMap((response: ApiResponse<Role>) => {
        if (!response.success || !response.data) {
          throw new Error('Failed to get role');
        }
        
        const currentRole = response.data;
        const currentPermissionIds = Array.isArray(currentRole.permissions) 
          ? currentRole.permissions.map((p: any) => typeof p === 'string' ? p : p._id)
          : [];
        
        const updatedPermissions = [...new Set([...currentPermissionIds, ...permissionIds])];
        
        return this.updateRole(roleId, { permissions: updatedPermissions });
      })
    );
  }

  async addPermissionsToRoleAsync(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await firstValueFrom(this.addPermissionsToRole(roleId, permissionIds));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to add permissions to role');
    }
    return response.data;
  }

  removePermissionsFromRole(roleId: string, permissionIds: string[]): Observable<ApiResponse<Role>> {
    return this.getRoleById(roleId).pipe(
      switchMap((response: ApiResponse<Role>) => {
        if (!response.success || !response.data) {
          throw new Error('Failed to get role');
        }
        
        const currentRole = response.data;
        const currentPermissionIds = Array.isArray(currentRole.permissions) 
          ? currentRole.permissions.map((p: any) => typeof p === 'string' ? p : p._id)
          : [];
        
        const updatedPermissions = currentPermissionIds.filter((id: any) => !permissionIds.includes(id));
        
        return this.updateRole(roleId, { permissions: updatedPermissions });
      })
    );
  }

  async removePermissionsFromRoleAsync(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await firstValueFrom(this.removePermissionsFromRole(roleId, permissionIds));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to remove permissions from role');
    }
    return response.data;
  }

  setRolePermissions(roleId: string, permissionIds: string[]): Observable<ApiResponse<Role>> {
    return this.updateRole(roleId, { permissions: permissionIds });
  }

  async setRolePermissionsAsync(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await firstValueFrom(this.setRolePermissions(roleId, permissionIds));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to set role permissions');
    }
    return response.data;
  }

  // Get role with fully populated permissions and users
  getRoleWithDetails(roleId: string): Observable<ApiResponse<Role>> {
    return this.getRoleById(roleId);
  }

  async getRoleWithDetailsAsync(roleId: string): Promise<Role> {
    const response = await firstValueFrom(this.getRoleWithDetails(roleId));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get role details');
    }
    return response.data;
  }

  // ============= UTILITY METHODS =============

  initializeSystem(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      this.getApiUrl('/initialize'),
      {}
    );
  }

  async initializeSystemAsync(): Promise<void> {
    const response = await firstValueFrom(this.initializeSystem());
    if (!response.success) {
      throw new Error(response.error || 'Failed to initialize system');
    }
  }

  makeSuperAdmin(userId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      this.getApiUrl('/make-super-admin'),
      { userId }
    );
  }

  async makeSuperAdminAsync(userId: string): Promise<void> {
    const response = await firstValueFrom(this.makeSuperAdmin(userId));
    if (!response.success) {
      throw new Error(response.error || 'Failed to make user super admin');
    }
  }
}
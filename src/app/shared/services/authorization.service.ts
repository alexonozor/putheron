import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';

export interface Permission {
  _id: string;
  name: string;
  display_name?: string;
  description?: string;
  category?: string;
  is_system_permission?: boolean;
}

export interface UserPermissions {
  userId: string;
  roles: Array<{
    _id: string;
    name: string;
    display_name?: string;
    permissions: Permission[];
    is_active: boolean;
    expires_at?: string;
  }>;
  directPermissions: Permission[];
  allPermissions: Permission[];
}

export interface PermissionCheck {
  permission: string;
  requireAll?: boolean; // If checking multiple permissions, require all vs any
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  // Reactive state
  private readonly userPermissionsSubject = new BehaviorSubject<UserPermissions | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  // Public signals
  readonly userPermissions = signal<UserPermissions | null>(null);
  readonly isLoading = signal<boolean>(false);

  // Computed permissions for quick access
  readonly allPermissions = computed(() => {
    const perms = this.userPermissions();
    return perms?.allPermissions || [];
  });

  readonly permissionNames = computed(() => {
    return this.allPermissions().map(p => p.name);
  });

  readonly activeRoles = computed(() => {
    const perms = this.userPermissions();
    if (!perms) return [];
    
    return perms.roles.filter(role => {
      if (!role.is_active) return false;
      if (role.expires_at) {
        const expiry = new Date(role.expires_at);
        return expiry > new Date();
      }
      return true;
    });
  });

  // Observables for reactive programming
  readonly userPermissions$ = this.userPermissionsSubject.asObservable();
  readonly isLoading$ = this.loadingSubject.asObservable();

  constructor() {
    // Sync subjects with signals
    this.userPermissionsSubject.subscribe(perms => {
      this.userPermissions.set(perms);
      // Persist permissions to localStorage
      this.persistPermissions(perms);
    });

    this.loadingSubject.subscribe(loading => {
      this.isLoading.set(loading);
    });

    // Restore permissions from localStorage on initialization
    this.restorePermissions();
  }

  private getApiUrl(endpoint: string): string {
    return this.config.getApiUrl(`/admin/roles${endpoint}`);
  }

  /**
   * Load user permissions from the server
   */
  async loadUserPermissions(userId: string): Promise<void> {
    try {
      this.loadingSubject.next(true);
      
      console.log('Loading permissions for user:', userId);
      
      // Check if we can avoid admin API calls based on stored user info
      // This is an optimization to avoid 403 errors for regular users
      
      // First, try to fetch user roles and permissions from the admin API
      // If this fails due to permissions, we'll fall back to basic user info
      try {
        const [rolesResponse, permissionsResponse] = await Promise.all([
          this.http.get<{
            success: boolean;
            data: any[];
            message?: string;
          }>(this.getApiUrl(`/users/${userId}/roles`)).toPromise(),
          
          this.http.get<{
            success: boolean;
            data: Permission[];
            message?: string;
          }>(this.getApiUrl(`/users/${userId}/permissions`)).toPromise()
        ]);

        if (rolesResponse?.success && permissionsResponse?.success) {
          // Transform the data to match our UserPermissions interface
          const userPermissions: UserPermissions = {
            userId: userId,
            roles: rolesResponse.data.map((userRole: any) => ({
              _id: userRole.role_id._id || userRole.role_id,
              name: userRole.role_id.name || 'unknown',
              display_name: userRole.role_id.display_name,
              permissions: userRole.role_id.permissions || [],
              is_active: userRole.is_active,
              expires_at: userRole.expires_at
            })),
            directPermissions: [], // No direct permissions in current backend
            allPermissions: permissionsResponse.data
          };
          console.log('Loaded user permissions from admin API:', userPermissions);
          this.userPermissionsSubject.next(userPermissions);
          return;
        }
      } catch (adminError: any) {
        console.warn('Failed to load from admin API (likely permission issue):', adminError.status);
        
        // If we get a 403, the user doesn't have admin access - create basic permissions
        if (adminError.status === 403) {
          console.log('User does not have admin access, creating basic permissions structure');
          
          // Create a basic permissions structure for non-admin users
          const basicPermissions: UserPermissions = {
            userId: userId,
            roles: [], // No admin roles
            directPermissions: [],
            allPermissions: [] // No admin permissions
          };
          
          console.log('Created basic permissions for non-admin user:', basicPermissions);
          this.userPermissionsSubject.next(basicPermissions);
          return;
        }
        
        // For other errors, re-throw
        throw adminError;
      }

      // If we reach here, something went wrong with the API responses
      console.error('Admin API returned invalid responses');
      this.userPermissionsSubject.next(null);
      
    } catch (error: any) {
      console.error('Error loading user permissions:', error);
      
      // For any other errors, create a null permissions state
      this.userPermissionsSubject.next(null);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const permissions = this.permissionNames();
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.permissionNames();
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.permissionNames();
    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleName: string): boolean {
    const roles = this.activeRoles();
    return roles.some(role => role.name === roleName || role.display_name === roleName);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roleNames: string[]): boolean {
    const roles = this.activeRoles();
    return roleNames.some(roleName => 
      roles.some(role => role.name === roleName || role.display_name === roleName)
    );
  }

  /**
   * Advanced permission check with multiple options
   */
  checkPermissions(checks: PermissionCheck[]): boolean {
    return checks.every(check => {
      if (typeof check.permission === 'string') {
        return this.hasPermission(check.permission);
      }
      
      // If it's an array of permissions
      const permissions = Array.isArray(check.permission) ? check.permission : [check.permission];
      
      if (check.requireAll) {
        return this.hasAllPermissions(permissions);
      } else {
        return this.hasAnyPermission(permissions);
      }
    });
  }

  /**
   * Check if user can access a specific route/feature
   */
  canAccess(feature: string, action?: string): boolean {
    const permission = action ? `${feature}.${action}` : feature;
    return this.hasPermission(permission);
  }

  /**
   * Observable permission checker for reactive templates
   */
  hasPermission$(permission: string): Observable<boolean> {
    return this.userPermissions$.pipe(
      map(perms => {
        if (!perms) return false;
        return perms.allPermissions.some(p => p.name === permission);
      })
    );
  }

  /**
   * Observable role checker
   */
  hasRole$(roleName: string): Observable<boolean> {
    return this.userPermissions$.pipe(
      map(perms => {
        if (!perms) return false;
        return perms.roles.some(role => 
          (role.name === roleName || role.display_name === roleName) &&
          role.is_active &&
          (!role.expires_at || new Date(role.expires_at) > new Date())
        );
      })
    );
  }

  /**
   * Get user's permissions grouped by category
   */
  getPermissionsByCategory(): Record<string, Permission[]> {
    const permissions = this.allPermissions();
    const grouped: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      const category = permission.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    
    return grouped;
  }

  /**
   * Persist permissions to localStorage
   */
  private persistPermissions(permissions: UserPermissions | null): void {
    if (typeof window === 'undefined' || !localStorage) {
      return; // Skip if not in browser environment
    }
    
    try {
      if (permissions) {
        localStorage.setItem('userPermissions', JSON.stringify(permissions));
        localStorage.setItem('permissionsTimestamp', Date.now().toString());
        console.log('Permissions persisted to localStorage');
      } else {
        localStorage.removeItem('userPermissions');
        localStorage.removeItem('permissionsTimestamp');
        console.log('Permissions cleared from localStorage');
      }
    } catch (error) {
      console.warn('Failed to persist permissions to localStorage:', error);
    }
  }

  /**
   * Restore permissions from localStorage
   */
  private restorePermissions(): void {
    if (typeof window === 'undefined' || !localStorage) {
      return; // Skip if not in browser environment
    }
    
    try {
      const storedPermissions = localStorage.getItem('userPermissions');
      const timestamp = localStorage.getItem('permissionsTimestamp');
      
      if (storedPermissions && timestamp) {
        // Check if permissions are not too old (24 hours)
        const permissionAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (permissionAge < maxAge) {
          const permissions: UserPermissions = JSON.parse(storedPermissions);
          console.log('Restored permissions from localStorage:', permissions);
          this.userPermissionsSubject.next(permissions);
          return;
        } else {
          console.log('Stored permissions are too old, clearing them');
          this.clearStoredPermissions();
        }
      } else {
        console.log('No stored permissions found in localStorage');
      }
    } catch (error) {
      console.warn('Failed to restore permissions from localStorage:', error);
      this.clearStoredPermissions();
    }
  }

  /**
   * Clear stored permissions from localStorage
   */
  private clearStoredPermissions(): void {
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('permissionsTimestamp');
  }

  /**
   * Clear all permissions (on logout)
   */
  clearPermissions(): void {
    this.userPermissionsSubject.next(null);
    this.clearStoredPermissions();
  }

  /**
   * Refresh user permissions
   */
  async refreshPermissions(userId: string): Promise<void> {
    await this.loadUserPermissions(userId);
  }

  /**
   * Check if user has any admin-level permissions
   * This is a computed signal that checks for common admin permissions
   */
  readonly hasAdminAccess = computed(() => {
    const permissions = this.permissionNames();
    const roles = this.activeRoles();
    
    // Check for admin roles
    const adminRoles = ['super_admin', 'admin', 'system_admin', 'moderator'];
    const hasAdminRole = roles.some(role => 
      adminRoles.includes(role.name.toLowerCase()) || 
      adminRoles.includes(role.display_name?.toLowerCase() || '')
    );
    
    // Check for admin permissions
    const adminPermissions = [
      'dashboard.read',
      'users.read', 'users.create', 'users.update', 'users.delete',
      'businesses.read', 'businesses.approve', 'businesses.suspend',
      'services.read', 'services.approve', 'services.reject',
      'categories.read', 'categories.create', 'categories.update',
      'projects.read', 'projects.approve', 'projects.reject',
      'reviews.read', 'reviews.moderate', 'reviews.flag',
      'transactions.read', 'transactions.refund', 'transactions.cancel',
      'reports.read', 'analytics.read',
      'roles.read', 'roles.create', 'roles.update', 'roles.delete',
      'permissions.read', 'permissions.create', 'permissions.update',
      'settings.read', 'audit.read'
    ];
    
    const hasAdminPermission = adminPermissions.some(permission => 
      permissions.includes(permission)
    );
    
    const hasAccess = hasAdminRole || hasAdminPermission;
    
    console.log('Admin access check:', {
      permissions: permissions.length,
      roles: roles.map(r => r.name),
      hasAdminRole,
      hasAdminPermission,
      hasAccess
    });
    
    return hasAccess;
  });

  // Common permission constants - Updated to match backend permissions
  static readonly PERMISSIONS = {
    // User Management
    USERS_VIEW: 'users.read',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.update',
    USERS_DELETE: 'users.delete',
    USERS_SUSPEND: 'users.suspend',
    USERS_EXPORT: 'users.export',
    
    // Business Management
    BUSINESS_VIEW: 'businesses.read',
    BUSINESS_CREATE: 'businesses.create',
    BUSINESS_EDIT: 'businesses.update',
    BUSINESS_DELETE: 'businesses.delete',
    BUSINESS_APPROVE: 'businesses.approve',
    BUSINESS_REJECT: 'businesses.reject',
    BUSINESS_SUSPEND: 'businesses.suspend',
    BUSINESS_EXPORT: 'businesses.export',
    
    // Services Management
    SERVICES_VIEW: 'services.read',
    SERVICES_CREATE: 'services.create',
    SERVICES_EDIT: 'services.update',
    SERVICES_DELETE: 'services.delete',
    SERVICES_APPROVE: 'services.approve',
    SERVICES_REJECT: 'services.reject',
    SERVICES_EXPORT: 'services.export',
    
    // Categories Management
    CATEGORIES_VIEW: 'categories.read',
    CATEGORIES_CREATE: 'categories.create',
    CATEGORIES_EDIT: 'categories.update',
    CATEGORIES_DELETE: 'categories.delete',
    CATEGORIES_REORDER: 'categories.reorder',
    CATEGORIES_EXPORT: 'categories.export',
    
    // Projects Management
    PROJECTS_VIEW: 'projects.read',
    PROJECTS_CREATE: 'projects.create',
    PROJECTS_EDIT: 'projects.update',
    PROJECTS_DELETE: 'projects.delete',
    PROJECTS_APPROVE: 'projects.approve',
    PROJECTS_REJECT: 'projects.reject',
    PROJECTS_EXPORT: 'projects.export',
    
    // Reviews Management
    REVIEWS_VIEW: 'reviews.read',
    REVIEWS_CREATE: 'reviews.create',
    REVIEWS_EDIT: 'reviews.update',
    REVIEWS_DELETE: 'reviews.delete',
    REVIEWS_MODERATE: 'reviews.moderate',
    REVIEWS_FLAG: 'reviews.flag',
    REVIEWS_EXPORT: 'reviews.export',
    
    // Transactions Management
    TRANSACTIONS_VIEW: 'transactions.read',
    TRANSACTIONS_CREATE: 'transactions.create',
    TRANSACTIONS_EDIT: 'transactions.update',
    TRANSACTIONS_DELETE: 'transactions.delete',
    TRANSACTIONS_REFUND: 'transactions.refund',
    TRANSACTIONS_CANCEL: 'transactions.cancel',
    TRANSACTIONS_EXPORT: 'transactions.export',
    
    // Reports and Analytics
    REPORTS_VIEW: 'reports.read',
    REPORTS_CREATE: 'reports.create',
    REPORTS_EDIT: 'reports.update',
    REPORTS_DELETE: 'reports.delete',
    REPORTS_EXPORT: 'reports.export',
    ANALYTICS_VIEW: 'analytics.read',
    ANALYTICS_ADVANCED: 'analytics.advanced',
    
    // Role and Permission Management
    ROLES_VIEW: 'roles.read',
    ROLES_CREATE: 'roles.create',
    ROLES_EDIT: 'roles.update',
    ROLES_DELETE: 'roles.delete',
    ROLES_ASSIGN: 'roles.assign',
    PERMISSIONS_VIEW: 'permissions.read',
    PERMISSIONS_CREATE: 'permissions.create',
    PERMISSIONS_EDIT: 'permissions.update',
    PERMISSIONS_DELETE: 'permissions.delete',
    
    // System and Dashboard
    ADMIN_ACCESS: 'dashboard.read',
    ADMIN_DASHBOARD: 'dashboard.read',
    SETTINGS_VIEW: 'settings.read',
    SETTINGS_EDIT: 'settings.update',
    AUDIT_VIEW: 'audit.read',
    AUDIT_EXPORT: 'audit.export',
    
    // Legacy constants for backward compatibility
    BUSINESS_MANAGE: 'businesses.update',
    USERS_MANAGE: 'users.update'
  } as const;

  // Common role constants
  static readonly ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    USER: 'user',
    BUSINESS_OWNER: 'business_owner',
    BUSINESS_MANAGER: 'business_manager'
  } as const;
}
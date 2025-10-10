import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthorizationService } from '../services/authorization.service';

@Pipe({
  name: 'hasPermission',
  standalone: true,
  pure: false // Make it impure so it re-evaluates when permissions change
})
export class HasPermissionPipe implements PipeTransform {
  private readonly authService = inject(AuthorizationService);

  transform(permissions: string | string[], requireAll: boolean = false): boolean {
    const permArray = Array.isArray(permissions) ? permissions : [permissions];
    
    if (requireAll) {
      return this.authService.hasAllPermissions(permArray);
    } else {
      return this.authService.hasAnyPermission(permArray);
    }
  }
}

@Pipe({
  name: 'hasRole',
  standalone: true,
  pure: false
})
export class HasRolePipe implements PipeTransform {
  private readonly authService = inject(AuthorizationService);

  transform(roles: string | string[], requireAll: boolean = false): boolean {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    if (requireAll) {
      return roleArray.every(role => this.authService.hasRole(role));
    } else {
      return this.authService.hasAnyRole(roleArray);
    }
  }
}

@Pipe({
  name: 'canAccess',
  standalone: true,
  pure: false
})
export class CanAccessPipe implements PipeTransform {
  private readonly authService = inject(AuthorizationService);

  transform(
    feature: string, 
    action?: string,
    options?: {
      roles?: string | string[];
      requireAll?: boolean;
    }
  ): boolean {
    const permission = action ? `${feature}.${action}` : feature;
    let hasPermission = this.authService.hasPermission(permission);

    // If roles are specified, check those too
    if (options?.roles) {
      const roleArray = Array.isArray(options.roles) ? options.roles : [options.roles];
      const hasRole = options.requireAll
        ? roleArray.every(role => this.authService.hasRole(role))
        : this.authService.hasAnyRole(roleArray);
      
      // Both permission and role must be satisfied
      hasPermission = hasPermission && hasRole;
    }

    return hasPermission;
  }
}

@Pipe({
  name: 'isAdmin',
  standalone: true,
  pure: false
})
export class IsAdminPipe implements PipeTransform {
  private readonly authService = inject(AuthorizationService);

  transform(): boolean {
    return this.authService.hasPermission(AuthorizationService.PERMISSIONS.ADMIN_ACCESS) ||
           this.authService.hasRole(AuthorizationService.ROLES.ADMIN) ||
           this.authService.hasRole(AuthorizationService.ROLES.SUPER_ADMIN);
  }
}

@Pipe({
  name: 'userPermissions',
  standalone: true,
  pure: false
})
export class UserPermissionsPipe implements PipeTransform {
  private readonly authService = inject(AuthorizationService);

  transform(format: 'names' | 'grouped' | 'count' = 'names'): any {
    switch (format) {
      case 'names':
        return this.authService.permissionNames();
      case 'grouped':
        return this.authService.getPermissionsByCategory();
      case 'count':
        return this.authService.allPermissions().length;
      default:
        return this.authService.allPermissions();
    }
  }
}

@Pipe({
  name: 'userRoles',
  standalone: true,
  pure: false
})
export class UserRolesPipe implements PipeTransform {
  private readonly authService = inject(AuthorizationService);

  transform(format: 'active' | 'all' | 'names' = 'active'): any {
    const userPermissions = this.authService.userPermissions();
    if (!userPermissions) return [];

    switch (format) {
      case 'active':
        return this.authService.activeRoles();
      case 'all':
        return userPermissions.roles;
      case 'names':
        return this.authService.activeRoles().map(role => role.display_name || role.name);
      default:
        return this.authService.activeRoles();
    }
  }
}
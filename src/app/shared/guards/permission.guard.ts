import { Injectable, inject } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, filter, switchMap, take, timeout } from 'rxjs/operators';
import { AuthorizationService } from '../services/authorization.service';

export interface PermissionGuardData {
  permissions?: string | string[];
  roles?: string | string[];
  requireAll?: boolean; // For multiple permissions/roles
  redirectTo?: string;
  showUnauthorizedMessage?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate, CanActivateChild {
  private readonly authService = inject(AuthorizationService);
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkPermissions(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkPermissions(childRoute, state);
  }

  private checkPermissions(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const guardData = route.data as PermissionGuardData;
    
    console.log('Permission Guard Check:', {
      route: state.url,
      guardData,
      hasPermissions: !!guardData.permissions,
      hasRoles: !!guardData.roles
    });
    
    // If no permission requirements, allow access
    if (!guardData.permissions && !guardData.roles) {
      console.log('No permission requirements, allowing access');
      return of(true);
    }

    // Wait for permissions to load with a timeout
    return this.authService.userPermissions$.pipe(
      switchMap(userPermissions => {
        console.log('User permissions in guard:', userPermissions);
        
        // If permissions are loaded, proceed with check
        if (userPermissions) {
          return of(userPermissions);
        }
        
        // If permissions not loaded, wait a bit and check if loading
        const isLoading = this.authService.isLoading();
        console.log('Permissions not loaded, isLoading:', isLoading);
        
        if (isLoading) {
          // Wait for loading to complete, with a timeout
          return this.authService.userPermissions$.pipe(
            filter(permissions => permissions !== null),
            timeout(5000), // 5 second timeout
            take(1),
            catchError(error => {
              console.error('Timeout waiting for permissions to load:', error);
              return of(null);
            })
          );
        }
        
        // Not loading and no permissions, return null immediately
        return of(null);
      }),
      map(userPermissions => {
        console.log('Final permission check with:', userPermissions);
        
        if (!userPermissions) {
          console.log('No user permissions available, denying access');
          this.handleUnauthorizedAccess(guardData, state.url);
          return false;
        }

        // Check permissions and roles (user needs either permissions OR roles, not both)
        let hasPermissions = false;
        let hasRoles = false;
        
        if (guardData.permissions) {
          hasPermissions = this.checkUserPermissions(
            guardData.permissions,
            guardData.requireAll || false
          );
          
          console.log('Permission check result:', {
            requiredPermissions: guardData.permissions,
            hasPermissions,
            requireAll: guardData.requireAll
          });
        }

        if (guardData.roles) {
          hasRoles = this.checkUserRoles(
            guardData.roles,
            guardData.requireAll || false
          );
          
          console.log('Role check result:', {
            requiredRoles: guardData.roles,
            hasRoles,
            requireAll: guardData.requireAll
          });
        }
        
        // If both permissions and roles are specified, user needs either one (OR logic)
        // If only one type is specified, user must have that type
        const hasAccess = (guardData.permissions && guardData.roles) 
          ? (hasPermissions || hasRoles)  // Either permissions OR roles
          : (guardData.permissions ? hasPermissions : hasRoles); // Only the specified type
        
        console.log('Final access check:', {
          hasPermissions,
          hasRoles,
          hasAccess,
          bothSpecified: !!(guardData.permissions && guardData.roles)
        });
        
        if (!hasAccess) {
          this.handleUnauthorizedAccess(guardData, state.url);
          return false;
        }

        console.log('Permission check passed, allowing access');
        return true;
      }),
      catchError(error => {
        console.error('Permission check error:', error);
        this.handleUnauthorizedAccess(guardData, state.url);
        return of(false);
      })
    );
  }

  private checkUserPermissions(permissions: string | string[], requireAll: boolean): boolean {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
    
    let result: boolean;
    if (requireAll) {
      result = this.authService.hasAllPermissions(permissionArray);
    } else {
      result = this.authService.hasAnyPermission(permissionArray);
    }
    
    const userPermissions = this.authService.permissionNames();
    console.log('Permission check details:', {
      requiredPermissions: permissionArray,
      requireAll,
      userPermissions,
      result,
      matchingPermissions: permissionArray.filter(perm => userPermissions.includes(perm))
    });
    
    return result;
  }

  private checkUserRoles(roles: string | string[], requireAll: boolean): boolean {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    let result: boolean;
    if (requireAll) {
      result = roleArray.every(role => this.authService.hasRole(role));
    } else {
      result = this.authService.hasAnyRole(roleArray);
    }
    
    const userRoles = this.authService.activeRoles().map(r => r.name);
    console.log('Role check details:', {
      requiredRoles: roleArray,
      requireAll,
      userRoles,
      result,
      matchingRoles: roleArray.filter(role => userRoles.includes(role))
    });
    
    return result;
  }

  private handleUnauthorizedAccess(guardData: PermissionGuardData, requestedUrl: string): void {
    const redirectTo = guardData.redirectTo || '/unauthorized';
    
    console.warn('Unauthorized access attempt:', {
      requestedUrl,
      requiredPermissions: guardData.permissions,
      requiredRoles: guardData.roles,
      userPermissions: this.authService.permissionNames(),
      userRoles: this.authService.activeRoles().map(r => r.name),
      redirectTo,
      reason: 'User does not have required permissions or roles'
    });

    // Store the attempted URL for post-login redirect
    sessionStorage.setItem('redirectUrl', requestedUrl);
    
    // Navigate to unauthorized page or login
    this.router.navigate([redirectTo], {
      queryParams: { 
        returnUrl: requestedUrl,
        reason: 'insufficient_permissions'
      }
    });
  }
}

// Convenience guard functions for common use cases
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private readonly permissionGuard = inject(PermissionGuard);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // Create a modified route with admin permissions
    const modifiedRoute = Object.create(route);
    modifiedRoute.data = {
      ...route.data,
      permissions: [AuthorizationService.PERMISSIONS.ADMIN_ACCESS],
      redirectTo: '/dashboard'
    };
    
    return this.permissionGuard.canActivate(modifiedRoute, state) as Observable<boolean>;
  }
}

@Injectable({
  providedIn: 'root'
})
export class RoleManagementGuard implements CanActivate {
  private readonly permissionGuard = inject(PermissionGuard);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const modifiedRoute = Object.create(route);
    modifiedRoute.data = {
      ...route.data,
      permissions: [
        AuthorizationService.PERMISSIONS.ROLES_VIEW,
        AuthorizationService.PERMISSIONS.USERS_VIEW
      ],
      requireAll: false, // User needs either permission
      redirectTo: '/dashboard'
    };
    
    return this.permissionGuard.canActivate(modifiedRoute, state) as Observable<boolean>;
  }
}


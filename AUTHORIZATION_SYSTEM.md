# Authorization System Documentation

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented in the Putheron application. The system provides multiple layers of access control including route guards, UI directives, and template pipes.

## Architecture Components

### 1. Authorization Service (`authorization.service.ts`)

The core service that manages user permissions, roles, and authorization logic.

#### Key Features:
- Reactive signals for real-time permission updates
- Permission and role checking methods
- Observable streams for template reactivity
- Permission caching and optimization
- Support for role expiration and activation status

#### Main Methods:
```typescript
// Permission checks
hasPermission(permission: string): boolean
hasAnyPermission(permissions: string[]): boolean
hasAllPermissions(permissions: string[]): boolean

// Role checks
hasRole(roleName: string): boolean
hasAnyRole(roleNames: string[]): boolean

// Complex access checks
canAccess(feature: string, action?: string): boolean
checkPermissions(checks: PermissionCheck[]): boolean

// Observable versions for reactive templates
hasPermission$(permission: string): Observable<boolean>
hasRole$(roleName: string): Observable<boolean>
```

### 2. Permission Guards (`permission.guard.ts`)

Route-level protection to prevent unauthorized access to application areas.

#### Available Guards:
- **PermissionGuard**: Generic guard for permission-based route protection
- **AdminGuard**: Specialized guard for admin-only routes
- **RoleManagementGuard**: Guard for role management features
- **BusinessManagementGuard**: Guard for business management features

#### Usage in Routes:
```typescript
{
  path: 'admin',
  canActivate: [AdminGuard],
  // ... other route config
}

{
  path: 'users',
  canActivate: [PermissionGuard],
  data: {
    permissions: ['users.view', 'users.manage'],
    requireAll: false, // any vs all permissions
    redirectTo: '/dashboard'
  }
}
```

### 3. Permission Directives (`permission.directive.ts`)

Structural directives for conditional UI element rendering based on permissions.

#### Available Directives:

##### HasPermissionDirective
Controls element visibility based on user permissions.

```html
<!-- Single permission -->
<button *hasPermission="'users.create'">Create User</button>

<!-- Multiple permissions (any) -->
<div *hasPermission="['users.edit', 'users.view']; hasPermissionRequireAll: false">
  Can edit OR view users
</div>

<!-- Multiple permissions (all) -->
<div *hasPermission="['users.edit', 'users.delete']; hasPermissionRequireAll: true">
  Can edit AND delete users
</div>

<!-- With else template -->
<div *hasPermission="'admin.access'; else: noAccess">
  Admin content
</div>
<ng-template #noAccess>
  <div>Access denied</div>
</ng-template>
```

##### HasRoleDirective
Controls element visibility based on user roles.

```html
<!-- Single role -->
<div *hasRole="'admin'">Admin only content</div>

<!-- Multiple roles -->
<div *hasRole="['admin', 'moderator']; hasRoleRequireAll: false">
  Admin or moderator content
</div>

<!-- With else template -->
<div *hasRole="'super_admin'; else: notSuperAdmin">
  Super admin content
</div>
<ng-template #notSuperAdmin>
  <div>Not a super admin</div>
</ng-template>
```

##### CanAccessDirective
Complex access checks combining permissions and roles.

```html
<div *canAccess="{
       permissions: ['business.manage'], 
       roles: ['business_owner', 'admin'],
       requireAll: false
     }">
  Business management content
</div>
```

##### IsAdminDirective
Simple admin check directive.

```html
<div *isAdmin>Admin only content</div>

<div *isAdmin; else: notAdmin>
  Admin content
</div>
<ng-template #notAdmin>
  Regular user content
</ng-template>
```

### 4. Permission Pipes (`permission.pipe.ts`)

Transform pipes for use in template expressions and property bindings.

#### Available Pipes:

```html
<!-- HasPermissionPipe -->
<p [class.text-green-600]="'users.view' | hasPermission">
  Users View: {{ ('users.view' | hasPermission) ? '✅' : '❌' }}
</p>

<!-- HasRolePipe -->
<p [class.text-blue-600]="'admin' | hasRole">
  Admin Role: {{ ('admin' | hasRole) ? '✅' : '❌' }}
</p>

<!-- IsAdminPipe -->
<p [class.text-purple-600]="'' | isAdmin">
  Is Admin: {{ ('' | isAdmin) ? '✅' : '❌' }}
</p>

<!-- CanAccessPipe -->
<button [disabled]="!('business' | canAccess:'manage')">
  Manage Business
</button>

<!-- UserPermissionsPipe -->
<div>Total Permissions: {{ 'count' | userPermissions }}</div>
<div *ngFor="let permission of 'names' | userPermissions">
  {{ permission }}
</div>

<!-- UserRolesPipe -->
<div>Roles: {{ 'names' | userRoles | join:', ' }}</div>
```

## Permission Constants

The system includes predefined permission constants for consistency:

```typescript
AuthorizationService.PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // Role Management
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN: 'roles.assign',
  
  // Business Management
  BUSINESS_VIEW: 'business.view',
  BUSINESS_CREATE: 'business.create',
  BUSINESS_EDIT: 'business.edit',
  BUSINESS_DELETE: 'business.delete',
  BUSINESS_MANAGE: 'business.manage',
  
  // Admin Dashboard
  ADMIN_ACCESS: 'admin.access',
  ADMIN_DASHBOARD: 'admin.dashboard',
  ADMIN_SETTINGS: 'admin.settings',
  
  // System
  SYSTEM_CONFIG: 'system.config',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_BACKUP: 'system.backup'
}
```

## Common Role Constants

```typescript
AuthorizationService.ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  BUSINESS_OWNER: 'business_owner',
  BUSINESS_MANAGER: 'business_manager'
}
```

## Implementation Examples

### Example 1: Role Management Component

```typescript
@Component({
  selector: 'app-role-management',
  imports: [HasPermissionDirective, HasPermissionPipe],
  template: `
    <!-- Create Role Button -->
    <button *hasPermission="'roles.create'" 
            (click)="createRole()" 
            mat-raised-button color="primary">
      Create Role
    </button>

    <!-- Role List -->
    <div *ngFor="let role of roles()">
      <h3>{{ role.name }}</h3>
      
      <!-- Edit Button -->
      <button *hasPermission="'roles.edit'" 
              [style.display]="role.is_system_role ? 'none' : 'block'"
              (click)="editRole(role)"
              mat-button>
        Edit
      </button>
      
      <!-- Delete Button -->
      <button *hasPermission="'roles.delete'" 
              [style.display]="role.is_system_role ? 'none' : 'block'"
              (click)="deleteRole(role)"
              mat-button color="warn">
        Delete
      </button>
      
      <!-- User Management -->
      <button *hasPermission="'roles.assign'" 
              (click)="manageUsers(role)"
              mat-stroked-button>
        Manage Users ({{ role.user_count }})
      </button>
    </div>

    <!-- Permission Status -->
    <div class="mt-4">
      <p>Can create roles: {{ ('roles.create' | hasPermission) ? '✅' : '❌' }}</p>
      <p>Can edit roles: {{ ('roles.edit' | hasPermission) ? '✅' : '❌' }}</p>
      <p>Can delete roles: {{ ('roles.delete' | hasPermission) ? '✅' : '❌' }}</p>
    </div>
  `
})
export class RoleManagementComponent {
  // Component implementation
}
```

### Example 2: Business Dashboard Protection

```typescript
// Route configuration
{
  path: 'business-dashboard',
  component: BusinessDashboardComponent,
  canActivate: [PermissionGuard],
  data: {
    permissions: ['business.manage', 'business.view'],
    requireAll: false, // User needs either permission
    redirectTo: '/dashboard'
  }
}

// Component template
@Component({
  template: `
    <div *canAccess="{
           permissions: ['business.manage'], 
           roles: ['business_owner', 'admin'],
           requireAll: false
         }">
      <!-- Business management content -->
      
      <button *hasPermission="'business.edit'" 
              (click)="editBusiness()">
        Edit Business
      </button>
      
      <button *hasPermission="'business.delete'" 
              (click)="deleteBusiness()"
              class="danger-button">
        Delete Business
      </button>
    </div>

    <div *canAccess="{permissions: ['business.view']}; else: noAccess">
      <!-- Read-only business content -->
    </div>
    
    <ng-template #noAccess>
      <div class="error-message">
        You don't have permission to view business information.
      </div>
    </ng-template>
  `
})
export class BusinessDashboardComponent {}
```

## Integration with Authentication

The authorization system integrates with the existing authentication service:

```typescript
// In AuthService
async login(credentials: LoginCredentials) {
  const response = await this.loginUser(credentials);
  if (response.success) {
    this.setAuthData(response.data);
    
    // Load user permissions after successful login
    await this.authorizationService.loadUserPermissions(response.data.user.id);
  }
}

private setAuthData(data: any) {
  // Set auth data
  this.currentUser.set(data.user);
  this.isAuthenticated.set(true);
  
  // Trigger permission loading
  this.authorizationService.loadUserPermissions(data.user.id);
}

logout() {
  // Clear auth data
  this.clearAuthData();
  
  // Clear permissions
  this.authorizationService.clearPermissions();
}
```

## Best Practices

### 1. Use Appropriate Controls
- **Route Guards**: Prevent unauthorized navigation
- **Directives**: Hide/show UI elements
- **Pipes**: Dynamic permission checking in templates
- **Service Methods**: Programmatic permission checks

### 2. Performance Considerations
- Use computed signals for reactive permission checks
- Avoid excessive permission API calls
- Cache permissions after initial load
- Use observables for reactive template updates

### 3. Security Guidelines
- Never rely solely on frontend authorization
- Always validate permissions on the backend
- Use route guards as the first line of defense
- Combine multiple authorization layers for sensitive operations

### 4. Error Handling
- Provide user-friendly error messages
- Implement fallback UI for unauthorized access
- Log authorization failures for monitoring
- Handle permission loading failures gracefully

## Testing

### Unit Testing Permissions

```typescript
describe('PermissionExampleComponent', () => {
  let mockAuthService: jasmine.SpyObj<AuthorizationService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthorizationService', [
      'hasPermission', 'hasRole', 'canAccess'
    ]);
    
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthorizationService, useValue: spy }
      ]
    });
    
    mockAuthService = TestBed.inject(AuthorizationService) as jasmine.SpyObj<AuthorizationService>;
  });

  it('should show create button when user has create permission', () => {
    mockAuthService.hasPermission.and.returnValue(true);
    
    fixture.detectChanges();
    
    const createButton = fixture.debugElement.query(By.css('[data-testid="create-button"]'));
    expect(createButton).toBeTruthy();
  });
});
```

### Integration Testing

```typescript
describe('Permission System Integration', () => {
  it('should protect admin routes from non-admin users', async () => {
    // Mock non-admin user
    authService.currentUser.set({ id: '1', role: 'user' });
    
    await router.navigate(['/admin']);
    
    expect(location.path()).toBe('/dashboard'); // Redirected
  });
});
```

## Troubleshooting

### Common Issues

1. **Permissions not loading**: Check if `loadUserPermissions()` is called after login
2. **Guards not working**: Verify guard is imported and added to route configuration
3. **Directives not hiding elements**: Ensure directive is imported in component
4. **Pipes not updating**: Check if pipe is marked as impure for reactive updates

### Debug Tools

Access the admin permission examples page at `/admin/dashboard/permission-examples` to:
- View current user permissions
- Test directive functionality
- Debug permission checks
- Verify role assignments

## Future Enhancements

1. **Dynamic Permissions**: Load permissions dynamically based on context
2. **Permission Inheritance**: Implement hierarchical permission inheritance
3. **Time-based Permissions**: Support for temporary permission grants
4. **Audit Logging**: Track permission usage and access attempts
5. **Permission Templates**: Pre-defined permission sets for common roles
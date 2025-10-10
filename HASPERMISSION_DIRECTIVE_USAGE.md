# HasPermission Directive

A flexible Angular directive for controlling element visibility based on user permissions.

## Basic Usage

### Simple Permission Check
```html
<!-- Show element only if user has 'users.read' permission -->
<div *hasPermission="'users.read'">
  User management content
</div>
```

### Multiple Permissions (OR logic)
```html
<!-- Show if user has ANY of these permissions -->
<div *hasPermission="['users.read', 'users.create']">
  User content (read OR create)
</div>
```

### Multiple Permissions (AND logic)
```html
<!-- Show if user has ALL of these permissions -->
<div *hasPermission="['users.read', 'users.create']; requireAll: true">
  User content (read AND create)
</div>
```

### Module.Action Object Format
```html
<!-- More structured approach -->
<div *hasPermission="{module: 'users', action: 'read'}">
  User management content
</div>
```

### Role-Based Access
```html
<!-- Allow super admins to see regardless of specific permission -->
<div *hasPermission="'restricted.feature'; allowSuperAdmin: true">
  Super admin can always see this
</div>

<!-- Also allow regular admins -->
<div *hasPermission="'some.permission'; allowAdmin: true; allowSuperAdmin: true">
  Admins and super admins can see this
</div>
```

## Available Input Options

- **hasPermission**: The permission(s) to check
  - `string`: Single permission like `'users.read'`
  - `string[]`: Array of permissions
  - `PermissionConfig`: Object with `{module: string, action: string}`

- **hasPermissionRequireAll**: For array permissions, require all instead of any
- **hasPermissionAllowSuperAdmin**: Allow super admins regardless (default: true)
- **hasPermissionAllowAdmin**: Allow admins regardless (default: false)

## Common Permission Patterns

```html
<!-- Dashboard sections -->
<li *hasPermission="'users.read'">Users</li>
<li *hasPermission="'businesses.read'">Businesses</li>
<li *hasPermission="'dashboard.read'">Admin Tools</li>
<li *hasPermission="'roles.read'">Roles & Permissions</li>
<li *hasPermission="'analytics.read'">Reports</li>

<!-- Action buttons -->
<button *hasPermission="'users.create'">Add User</button>
<button *hasPermission="'users.update'">Edit</button>
<button *hasPermission="'users.delete'">Delete</button>

<!-- Complex scenarios -->
<div *hasPermission="['users.read', 'businesses.read']">
  <!-- Shows if user can read users OR businesses -->
</div>

<div *hasPermission="['users.update', 'users.delete']; requireAll: true">
  <!-- Shows only if user can both update AND delete users -->
</div>
```

## Benefits

1. **Declarative**: Clear permission requirements in templates
2. **Reactive**: Automatically updates when permissions change
3. **Flexible**: Supports strings, arrays, and structured objects
4. **Role-aware**: Built-in support for admin roles
5. **Performance**: Uses ViewContainer for efficient DOM manipulation
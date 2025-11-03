# Mobile Sidenav Components

All three sidenav components have been created using Angular Material components and icons:

## Components Created

### 1. GuestSidenavComponent
**Location:** `/src/app/shared/components/guest-sidenav/`
**Purpose:** Navigation for non-authenticated users
**Features:**
- Simple navigation with Material icons
- Links: Home, Search, How It Works, About, Sign In
- Clean, minimalist design

### 2. UserSidenavComponent
**Location:** `/src/app/shared/components/user-sidenav/`
**Purpose:** Navigation for authenticated dashboard users
**Features:**
- User profile section with initials avatar
- Conditional menu items based on `isBusinessOwner()` mode
- Business Owner items: Overview, Businesses, Services
- Common items: Projects, Favorites, Search, Notifications, Messages
- Mode switching button (Business Owner ↔ Client)
- Logout button
- Badge counters for businesses, services, projects, favorites
- Uses signals for reactive state

### 3. AdminSidenavComponent
**Location:** `/src/app/shared/components/admin-sidenav/`
**Purpose:** Navigation for admin dashboard
**Features:**
- Admin profile section with red badge
- Permission-based menu items using `*hasPermission` directive
- Management sections: Users, Businesses, Services, Categories, Projects, Reviews, Transactions, Reports
- Security section: Roles & Permissions
- System section: Settings, Audit Logs
- Logout button

## Material Components Used

All components use:
- `mat-icon` for icons (no SVGs)
- `mat-button` for buttons
- `routerLink` and `routerLinkActive` for navigation
- Tailwind CSS for styling

## Integration Steps

### 1. Import the components where needed:

```typescript
import { GuestSidenavComponent } from './shared/components/guest-sidenav/guest-sidenav.component';
import { UserSidenavComponent } from './shared/components/user-sidenav/user-sidenav.component';
import { AdminSidenavComponent } from './shared/components/admin-sidenav/admin-sidenav.component';
```

### 2. Update Header Component

Add logic to determine which sidenav to show:

```typescript
import { computed } from '@angular/core';
import { AuthService } from './services/auth.service';

isAuthenticated = computed(() => this.authService.isAuthenticated());
hasAdminAccess = computed(() => this.authService.hasAdminAccess());

getSidenavComponent() {
  if (this.hasAdminAccess()) {
    return 'admin';
  } else if (this.isAuthenticated()) {
    return 'user';
  } else {
    return 'guest';
  }
}
```

### 3. Update Parent Container Templates

#### For Main App Layout (app.component.html):
```html
<mat-sidenav-container>
  <mat-sidenav #sidenav mode="over" position="start">
    @if (getSidenavComponent() === 'guest') {
      <app-guest-sidenav (navigationClick)="sidenav.close()" />
    }
    @if (getSidenavComponent() === 'user') {
      <app-user-sidenav (navigationClick)="sidenav.close()" />
    }
    @if (getSidenavComponent() === 'admin') {
      <app-admin-sidenav (navigationClick)="sidenav.close()" />
    }
  </mat-sidenav>

  <mat-sidenav-content>
    <app-header (menuToggle)="sidenav.toggle()" />
    <router-outlet />
  </mat-sidenav-content>
</mat-sidenav-container>
```

#### For Dashboard Component:
```html
<mat-sidenav-container>
  <mat-sidenav 
    #sidenav 
    [opened]="sidenavOpened()" 
    [mode]="isMobile() ? 'over' : 'side'"
    [disableClose]="!isMobile()">
    <app-user-sidenav (navigationClick)="isMobile() && sidenav.close()" />
  </mat-sidenav>

  <mat-sidenav-content>
    <app-header 
      [showMobileMenuButton]="isMobile()"
      (menuToggle)="onMenuToggle()" />
    <router-outlet />
  </mat-sidenav-content>
</mat-sidenav-container>
```

#### For Admin Dashboard Component:
```html
<mat-sidenav-container>
  <mat-sidenav 
    #sidenav 
    [opened]="sidenavOpened()" 
    [mode]="isMobile() ? 'over' : 'side'"
    [disableClose]="!isMobile()">
    <app-admin-sidenav (navigationClick)="isMobile() && sidenav.close()" />
  </mat-sidenav>

  <mat-sidenav-content>
    <app-header 
      [showMobileMenuButton]="isMobile()"
      [isAdminMode]="true"
      (menuToggle)="onMenuToggle()" />
    <router-outlet />
  </mat-sidenav-content>
</mat-sidenav-container>
```

## Output Events

All sidenav components emit a `navigationClick` output event that should trigger the sidenav to close on mobile:

```typescript
// In sidenav component
navigationClick = output<void>();

// In parent template
(navigationClick)="sidenav.close()"
// or
(navigationClick)="isMobile() && sidenav.close()"
```

## Material Icon Mapping

SVG icons have been replaced with Material icon names:

| Original SVG | Material Icon |
|--------------|---------------|
| Dashboard bars | `dashboard` |
| Users/People | `people` |
| Building | `business` |
| Settings cog | `settings` |
| Briefcase | `work` |
| Heart | `favorite` |
| Search | `search` |
| Money/Dollar | `payments` |
| Star | `star` |
| Bell | `notifications` |
| Message | `message` |
| Shield | `shield` |
| Lock | `admin_panel_settings` |
| Chart | `analytics` |
| Category/Grid | `category` |
| File/Document | `description` |
| Exit/Logout | `logout` |
| External link | `open_in_new` |
| Person | `person` / `person_outline` |

## Next Steps

1. Remove old sidenav HTML from `dashboard.component.html` and `admin-dashboard.component.html`
2. Update component templates to use the new sidenav components
3. Test on mobile to ensure smooth open/close behavior
4. Verify that all navigation links work correctly
5. Test mode switching in UserSidenavComponent
6. Verify permission-based menu items in AdminSidenavComponent

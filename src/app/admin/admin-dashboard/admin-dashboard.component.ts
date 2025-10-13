import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../shared/services';
import { ConfigService } from '../../shared/services/config.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { HasPermissionDirective } from '../../shared/directives';
import { HeaderComponent } from "../../shared/components/header/header.component";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
    MatMenuModule,
    HasPermissionDirective,
    HeaderComponent
],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  private readonly authService = inject(AuthService);
  readonly authorizationService = inject(AuthorizationService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly config = inject(ConfigService);

  readonly user = this.authService.user;
  readonly isMobile = signal(false);
  readonly sidenavOpened = signal(true); // Default to true for admin (desktop-first)
  readonly isBootstrapping = signal(false);

  readonly isHandset = computed(() => {
    return this.breakpointObserver.isMatched(Breakpoints.Handset);
  });

  constructor() {
    // Monitor mobile breakpoint
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .subscribe(result => {
        const isMobileNow = result.matches;
        this.isMobile.set(isMobileNow);
        
        // Auto-close sidenav on mobile, open on desktop
        if (isMobileNow) {
          this.sidenavOpened.set(false);
        } else {
          this.sidenavOpened.set(true);
        }
      });

    // Load user permissions if not already loaded
    if (!this.hasPermissionsLoaded()) {
      const user = this.authService.user();
      if (user?._id) {
        this.authorizationService.refreshPermissions(user._id).catch((err: any) => {
          console.warn('Failed to load user permissions:', err);
        });
      }
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  navigateTo(route: string) {
    this.router.navigate(['/admin', route]);
  }

  toggleSidenav() {
    this.sidenavOpened.set(!this.sidenavOpened());
  }

  onMenuToggle() {
    this.toggleSidenav();
  }

  onNavigationClick() {
    // Close sidebar on mobile when a navigation link is clicked
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user) return 'A';
    
    if (user.first_name || user.last_name) {
      const firstInitial = user.first_name?.charAt(0).toUpperCase() || '';
      const lastInitial = user.last_name?.charAt(0).toUpperCase() || '';
      return firstInitial + lastInitial;
    }
    
    return user.email.charAt(0).toUpperCase();
  }

  // TEMPORARY: Bootstrap method to setup admin roles and permissions
  async bootstrapAdminRoles() {
    try {
      this.isBootstrapping.set(true);
      
      // Get the auth token
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      if (!token) {
        alert('No authentication token found. Please log in again.');
        this.router.navigate(['/auth']);
        return;
      }

      console.log('🚀 Starting admin roles bootstrap...');

      const response = await fetch(this.config.getApiUrl('/admin/roles/bootstrap'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bootstrap failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Bootstrap completed:', result);
      
      // Show success message
      alert(`🎉 Success! You are now a Super Admin!\n\n${result.message}\n\nYou can now access all role management features. This button will be removed in production.`);
      
      // Refresh the page to update permissions
      window.location.reload();
      
    } catch (error: any) {
      console.error('❌ Bootstrap failed:', error);
      
      let errorMessage = 'Bootstrap failed. ';
      
      if (error.message.includes('403')) {
        errorMessage += 'You may not have permission to bootstrap roles. Contact your system administrator.';
      } else if (error.message.includes('401')) {
        errorMessage += 'Authentication failed. Please log in again.';
        this.router.navigate(['/auth']);
        return;
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      alert(errorMessage);
    } finally {
      this.isBootstrapping.set(false);
    }
  }

  // Check if user is super admin (still needed for specific logic)
  isSuperAdmin(): boolean {
    return this.authorizationService.hasRole(AuthorizationService.ROLES.SUPER_ADMIN);
  }

  // Check if permissions are loaded
  hasPermissionsLoaded(): boolean {
    const userPerms = this.authorizationService.userPermissions();
    return userPerms != null && userPerms.allPermissions.length > 0;
  }

  // Check if should show bootstrap button
  shouldShowBootstrap(): boolean {
    return this.isSuperAdmin() || !this.hasPermissionsLoaded();
  }
}

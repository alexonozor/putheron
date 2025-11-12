import { Component, Input, inject, signal, computed, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDrawer } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-admin-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    HasPermissionDirective
  ],
  templateUrl: './admin-sidenav.component.html',
  styleUrls: ['./admin-sidenav.component.scss']
})
export class AdminSidenavComponent {
  @Input() drawer?: MatDrawer;

  private router = inject(Router);
  private authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);

  // User signal
  user = computed(() => this.authService.currentUser);
  readonly isMobile = signal<boolean>(false);

  constructor() {
    // Detect mobile breakpoint
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
    });
  }

  getUserInitials(): string {
    const currentUser = this.user();
    if (!currentUser) return '?';
    
    const firstName = currentUser.first_name || '';
    const lastName = currentUser.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    
    return '?';
  }

  navigateAndClose(path: string): void {
    this.router.navigate([path]);
    // Only close sidenav on mobile
    if (this.isMobile() && this.drawer) {
      this.drawer.toggle();
    }
  }

  onNavigationClick(): void {
    // Only close sidenav on mobile
    if (this.isMobile() && this.drawer) {
      this.drawer.toggle();
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([`/admin/dashboard/${route}`]);
    // Only close sidenav on mobile
    if (this.isMobile() && this.drawer) {
      this.drawer.toggle();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/sign-in']);
  }
}
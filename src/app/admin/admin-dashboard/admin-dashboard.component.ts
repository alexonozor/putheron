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
import { AuthService } from '../../shared/services/auth.service';

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
    MatMenuModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);

  readonly user = this.authService.user;
  readonly isMobile = signal(false);

  readonly isHandset = computed(() => {
    return this.breakpointObserver.isMatched(Breakpoints.Handset);
  });

  constructor() {
    // Monitor mobile breakpoint
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  navigateTo(route: string) {
    this.router.navigate(['/admin', route]);
  }

  toggleSidenav() {
    // Toggle sidenav logic for admin dashboard
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
}

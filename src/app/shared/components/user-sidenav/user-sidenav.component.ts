import { Component, Input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDrawer } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../services/auth.service';
import { BusinessService } from '../../services/business.service';
import { ProjectService } from '../../services/project.service';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-user-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './user-sidenav.component.html',
  styleUrls: ['./user-sidenav.component.scss']
})
export class UserSidenavComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly projectService = inject(ProjectService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  @Input() drawer?: MatDrawer;

  readonly user = this.authService.user;
  readonly userBusinessCount = signal<number>(0);
  readonly totalServices = signal<number>(0);
  readonly totalProjects = signal<number>(0);
  readonly isMobile = signal<boolean>(false);
  
  readonly favoritesCount = computed(() => this.favoritesService.getFavoritesCount());

  readonly userMode = computed(() => {
    const user = this.user();
    return user?.user_mode || 'client';
  });

  readonly isBusinessOwner = computed(() => {
    return this.userMode() === 'business_owner';
  });

  constructor() {
    // Detect mobile breakpoint
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
    });

    effect(() => {
      const user = this.user();
      if (user) {
        this.loadDashboardCounts();
      }
    });
  }

  async loadDashboardCounts() {
    try {
      const [businesses, projects] = await Promise.all([
        this.businessService.getMyBusinessesAsync(),
        this.projectService.getMyProjectsAsync()
      ]);

      this.userBusinessCount.set(businesses.length);
      this.totalProjects.set(projects.length);

      const totalServicesCount = businesses.reduce((sum, business) => {
        return sum + (business.services?.length || 0);
      }, 0);
      this.totalServices.set(totalServicesCount);
    } catch (error) {
      console.error('Error loading dashboard counts:', error);
    }
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user) return '';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
    }
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase() + (user.email.charAt(0).toUpperCase() || '');
    }
    
    if (lastName) {
      const emailInitial = user.email.charAt(0).toUpperCase();
      return emailInitial + lastName.charAt(0).toUpperCase();
    }
    
    return user.email.charAt(0).toUpperCase();
  }

  navigateAndClose(route: string) {
    this.router.navigate([route]);
    // Only close sidenav on mobile
    if (this.isMobile() && this.drawer) {
      this.drawer.toggle();
    }
  }

  async switchToBusinessMode() {
    try {
      const result = await this.authService.switchMode('business_owner');
      if (result.data) {
        await this.loadDashboardCounts();
        // Only close sidenav on mobile
        if (this.isMobile() && this.drawer) {
          this.drawer.toggle();
        }
      }
    } catch (error) {
      console.error('Error switching to business mode:', error);
    }
  }

  async switchToClientMode() {
    try {
      const result = await this.authService.switchMode('client');
      if (result.data) {
        this.router.navigate(['/search']);
        // Only close sidenav on mobile
        if (this.isMobile() && this.drawer) {
          this.drawer.toggle();
        }
      }
    } catch (error) {
      console.error('Error switching to client mode:', error);
    }
  }

  async logout() {
    await this.authService.signOut();
    // Only close sidenav on mobile
    if (this.isMobile() && this.drawer) {
      this.drawer.toggle();
    }
  }
}

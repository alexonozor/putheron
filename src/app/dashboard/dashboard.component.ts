import { Component, OnInit, inject, signal, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../shared/services/auth.service';
import { BusinessService } from '../shared/services/business.service';
import { ProjectService } from '../shared/services/project.service';
import { NotificationNavComponent } from '../shared/components/notification-nav/notification-nav.component';
import { SocketService } from '../shared/services/socket.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../shared/services/favorites.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NotificationNavComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly projectService = inject(ProjectService);
  private readonly socketService = inject(SocketService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly favoritesService = inject(FavoritesService);

  // Signals for parent container state
  readonly sidenavOpened = signal<boolean>(false); // Default to false for mobile-first
  readonly isMobile = signal<boolean>(false);
  readonly userBusinessCount = signal<number>(0);
  readonly totalServices = signal<number>(0);
  readonly totalProjects = signal<number>(0);
  
  // Computed signal for favorites count
  readonly favoritesCount = computed(() => this.favoritesService.getFavoritesCount());

  // Computed signals
  readonly user = this.authService.user;
  readonly isAuthenticated = this.authService.isAuthenticated;

  // Get current user mode as computed signal
  readonly userMode = computed(() => {
    const user = this.user();
    return user?.user_mode || 'client';
  });

  // Check if user is a business owner as computed signal
  readonly isBusinessOwner = computed(() => {
    return this.userMode() === 'business_owner';
  });

  // Check if user has admin privileges - TODO: Add admin role to user schema
  readonly isAdmin = computed(() => {
    const user = this.user();
    // For now, check if user email contains 'admin' or add your admin check logic
    // In production, you should have an 'admin' role in the user schema
    return user?.email?.includes('admin') || false;
  });

  private mobileSubscription?: Subscription;

  // Effect to watch for user mode changes - must be in field initializer
  private userModeEffect = effect(() => {
    const mode = this.userMode();
    const user = this.user();
    const isBusiness = this.isBusinessOwner();
    console.log('Dashboard signals updated:', { user: user?.email, mode, isBusiness });
    if (user) {
      // Reload dashboard counts when mode changes
      this.loadDashboardCounts();
    }
  });

  ngOnInit() {
    this.setupMobileDetection();
    this.loadDashboardCounts();
    // Initialize socket connection for real-time features
    this.socketService.connect();
  }

  ngOnDestroy() {
    if (this.mobileSubscription) {
      this.mobileSubscription.unsubscribe();
    }
  }

  private setupMobileDetection() {
    this.mobileSubscription = this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile.set(result.matches);
        // On desktop, keep sidebar open by default
        if (!result.matches) {
          this.sidenavOpened.set(true);
        } else {
          // On mobile, keep sidebar closed by default
          this.sidenavOpened.set(false);
        }
      });
  }

  async loadDashboardCounts() {
    try {
      const businesses = await this.businessService.getMyBusinessesAsync();
      this.userBusinessCount.set(businesses.length);
      
      // Calculate total services across all businesses
      let serviceCount = 0;
      for (const business of businesses) {
        try {
          const services = await this.businessService.getBusinessServicesAsync(business._id);
          serviceCount += services.length;
        } catch (err) {
          console.warn(`Failed to load services for business ${business._id}:`, err);
        }
      }
      this.totalServices.set(serviceCount);
      
      // Load user projects count (both as client and business owner)
      try {
        const projects = await this.projectService.getAllMyProjectsAsync();
        this.totalProjects.set(projects.length);
      } catch (err) {
        console.warn('Failed to load projects:', err);
        this.totalProjects.set(0);
      }
      
    } catch (err: any) {
      console.error('Error loading dashboard counts:', err);
    }
  }

  toggleSidenav() {
    this.sidenavOpened.set(!this.sidenavOpened());
  }

  onNavigationClick() {
    // Close sidebar on mobile when a navigation link is clicked
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }

  navigateToCreateBusiness() {
    this.router.navigate(['/dashboard/businesses/create-business']);
  }

  createService() {
    this.router.navigate(['/dashboard/services/create-service']);
  }

  getActiveTabTitle(): string {
    // This method provides a title based on the current route
    const urlSegments = this.router.url.split('/');
    const lastSegment = urlSegments[urlSegments.length - 1];
    
    switch (lastSegment) {
      case 'dashboard':
      case '':
        // Show different default title based on user mode
        return this.isBusinessOwner() ? 'Dashboard Overview' : 'My Projects';
      case 'overview': 
        return 'Dashboard Overview';
      case 'businesses': 
        return 'My Businesses';
      case 'services': 
        return 'My Services';
      case 'projects': 
        return 'My Projects';
      case 'notifications':
        return 'Notifications';
      case 'profile':
        return 'Profile';
      case 'settings':
        return 'Settings';
      default: 
        // Check if we're in messages route
        if (this.router.url.includes('/messages')) {
          return 'Messages';
        }
        return this.isBusinessOwner() ? 'Dashboard' : 'My Projects';
    }
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user) return '';
    
    if (user.first_name || user.last_name) {
      const firstInitial = user.first_name?.charAt(0).toUpperCase() || '';
      const lastInitial = user.last_name?.charAt(0).toUpperCase() || '';
      return firstInitial + lastInitial;
    }
    
    return user.email.charAt(0).toUpperCase();
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToProfile() {
    this.router.navigate(['/dashboard/profile']);
  }

  navigateToSettings() {
    this.router.navigate(['/dashboard/settings']);
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }

  async switchToBusinessMode() {
    // Call API to switch user mode to business_owner
    try {
      const result = await this.authService.switchMode('business_owner');
      if (result.data) {
        console.log('Switched to business owner mode successfully');
        console.log('Updated user mode:', this.userMode());
        // Reload dashboard counts since mode changed
        this.loadDashboardCounts();
      } else {
        console.error('Failed to switch to business mode:', result.error);
      }
    } catch (error) {
      console.error('Error switching to business mode:', error);
    }
  }

  async switchToClientMode() {
    // Call API to switch user mode to client
    try {
      const result = await this.authService.switchMode('client');
      if (result.data) {
        console.log('Switched to client mode successfully');
        console.log('Updated user mode:', this.userMode());
        // Navigate to search page for client mode
        this.router.navigate(['/search']);
      } else {
        console.error('Failed to switch to client mode:', result.error);
      }
    } catch (error) {
      console.error('Error switching to client mode:', error);
    }
  }

  viewProfile() {
    this.navigateToProfile();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}


import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../shared/services/auth.service';
import { BusinessService } from '../shared/services/business.service';
import { ProjectService } from '../shared/services/project.service';
import { NotificationNavComponent } from '../shared/components/notification-nav.component';
import { SocketService } from '../shared/services/socket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatMenuModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NotificationNavComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly projectService = inject(ProjectService);
  private readonly socketService = inject(SocketService);

  // Signals for parent container state
  readonly sidenavOpened = signal<boolean>(true);
  readonly userBusinessCount = signal<number>(0);
  readonly totalServices = signal<number>(0);
  readonly totalProjects = signal<number>(0);

  // Computed signals
  readonly user = this.authService.user;

  ngOnInit() {
    this.loadDashboardCounts();
    // Initialize socket connection for real-time features
    this.socketService.connect();
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

  navigateToCreateBusiness() {
    this.router.navigate(['/dashboard/businesses/create-business']);
  }

  createService() {
    // TODO: Navigate to create service page
    alert('Create service functionality will be available soon!');
  }

  getActiveTabTitle(): string {
    // This method provides a title based on the current route
    const urlSegments = this.router.url.split('/');
    const lastSegment = urlSegments[urlSegments.length - 1];
    
    switch (lastSegment) {
      case 'dashboard':
      case '':
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
      default: 
        // Check if we're in messages route
        if (this.router.url.includes('/messages')) {
          return 'Messages';
        }
        return 'Dashboard';
    }
  }

  viewProfile() {
    // TODO: Navigate to profile page
    alert('Profile page will be available soon!');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}


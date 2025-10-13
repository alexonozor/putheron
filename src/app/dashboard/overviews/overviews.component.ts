import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { BusinessService, Business } from '../../shared/services/business.service';
import { ProjectService } from '../../shared/services/project.service';
import { FavoritesService } from '../../shared/services/favorites.service';
import { RoleService } from '../../shared/services/role.service';

@Component({
  selector: 'app-overviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './overviews.component.html',
  styleUrl: './overviews.component.scss',
})
export class OverviewsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly businessService = inject(BusinessService);
  private readonly projectService = inject(ProjectService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly roleService = inject(RoleService);

  // Signals for overview state
  readonly userBusinesses = signal<Business[]>([]);
  readonly userServices = signal<any[]>([]);
  readonly userProjects = signal<any[]>([]);
  readonly businessesFavoritesCount = signal<{[businessId: string]: number}>({});
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<string>('overview');
  
  // Super admin assignment
  userIdForAdmin = '';
  readonly isAssigningAdmin = signal(false);
  readonly rachelUserId = '687e220f5c54f009db530a0d';

  // Computed signals
  readonly user = this.authService.user;
  readonly hasBusinesses = computed(() => this.userBusinesses().length > 0);
  readonly totalServices = computed(() => this.userServices().length);
  readonly totalProjects = computed(() => this.userProjects().length);

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }
    
    // Set active tab based on route
    const urlSegments = this.router.url.split('/');
    const lastSegment = urlSegments[urlSegments.length - 1];
    
    if (lastSegment === 'dashboard' || lastSegment === 'overview' || lastSegment === '') {
      this.activeTab.set('overview');
    } else {
      this.activeTab.set(lastSegment);
    }
    
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load user businesses
      const businesses = await this.businessService.getMyBusinessesAsync();
      this.userBusinesses.set(businesses);

      // Load services for all businesses
      let allServices: any[] = [];
      for (const business of businesses) {
        try {
          const services = await this.businessService.getBusinessServicesAsync(business._id);
          allServices = [...allServices, ...services];
        } catch (err) {
          console.warn(`Failed to load services for business ${business._id}:`, err);
        }
      }
      this.userServices.set(allServices);

      // Load user projects (both as client and business owner)
      try {
        const projects = await this.projectService.getAllMyProjectsAsync();
        this.userProjects.set(projects);
      } catch (err) {
        console.warn('Failed to load projects:', err);
        this.userProjects.set([]);
      }

      // Load favorites count for user's businesses
      if (businesses.length > 0) {
        try {
          const businessIds = businesses.map(b => b._id);
          const favoritesCount = await this.favoritesService.getMultipleBusinessesFavoritesCount(businessIds);
          this.businessesFavoritesCount.set(favoritesCount);
        } catch (err) {
          console.warn('Failed to load businesses favorites count:', err);
          this.businessesFavoritesCount.set({});
        }
      }

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      this.error.set(err.message || 'Failed to load dashboard data');
    } finally {
      this.loading.set(false);
    }
  }

  // Tab management
  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  getTotalServices(): number {
    return this.totalServices();
  }

  getTotalProjects(): number {
    return this.totalProjects();
  }

  getTotalFavorites(): number {
    const favoritesCount = this.businessesFavoritesCount();
    return Object.values(favoritesCount).reduce((total, count) => total + count, 0);
  }

  // Navigation methods
  navigateToCreateBusiness() {
    this.router.navigate(['/dashboard/businesses/create-business']);
  }

  createService() {
    if (this.userBusinesses().length === 0) {
      alert('Please create a business first before adding services.');
      return;
    }
    this.router.navigate(['/dashboard/services/create']);
  }

  viewProjects() {
    this.router.navigate(['/dashboard/projects']);
  }

  viewBusiness(businessId: string) {
    this.router.navigate(['/business', businessId]);
  }

  editBusiness(businessId: string) {
    // TODO: Navigate to edit business page
    alert('Edit business functionality will be available soon!');
  }

  deleteBusiness(businessId: string) {
    if (confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      // TODO: Implement delete business functionality
      alert('Delete business functionality will be available soon!');
    }
  }

  viewProfile() {
    // TODO: Navigate to profile page
    alert('Profile page will be available soon!');
  }

  viewMessages() {
    // TODO: Navigate to messages page
    alert('Messages page will be available soon!');
  }

  // Utility methods for business status display
  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      case 'suspended': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'suspended': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-400';
      case 'pending': return 'bg-yellow-400';
      case 'rejected': return 'bg-red-400';
      case 'suspended': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  }

  getCategoryName(business: Business): string {
    if (typeof business.category_id === 'object' && business.category_id?.name) {
      return business.category_id.name;
    }
    return 'Unknown Category';
  }

  getSubcategoryName(business: Business): string | null {
    if (typeof business.subcategory_id === 'object' && business.subcategory_id?.name) {
      return business.subcategory_id.name;
    }
    return null;
  }


  copyRachelId() {
    navigator.clipboard.writeText(this.rachelUserId).then(() => {
      alert('Rachel\'s User ID copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy User ID');
    });
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

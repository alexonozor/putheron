import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../../shared/services/auth.service';
import { BusinessService, Business } from '../../../shared/services/business.service';
import { DashboardSubheaderComponent } from '../../../shared/components/dashboard-subheader/dashboard-subheader.component';
import { BusinessSearchFilterComponent } from '../../../shared/components/business-search-filter/business-search-filter.component';
import { ServiceCardComponent } from '../components/service-card/service-card.component';
import { ServiceListCardComponent } from '../components/service-list-card/service-list-card.component';
import { EmptyStateComponent, EmptyStateButton } from '../../../shared/components/empty-state/empty-state.component';

interface Service {
  _id: string;
  business_id: string | Business;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price?: number;
  pricing_type?: 'fixed' | 'hourly' | 'project' | 'custom';
  duration?: string;
  features?: string[];
  images?: string[];
  category?: string;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  order_index?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

@Component({
  selector: 'app-list-services',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    DashboardSubheaderComponent,
    BusinessSearchFilterComponent,
    ServiceCardComponent,
    ServiceListCardComponent,
    EmptyStateComponent
  ],
  templateUrl: './list-services.component.html',
  styleUrl: './list-services.component.scss'
})
export class ListServicesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Signals for component state
  readonly userServices = signal<Service[]>([]);
  readonly userBusinesses = signal<Business[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal<string>('');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly selectedBusiness = signal<string>('all');
  readonly isMobile = signal(false);

  // Computed signals
  readonly user = this.authService.user;
  readonly filteredServices = computed(() => {
    let services = this.userServices();
    const search = this.searchTerm().toLowerCase().trim();
    const businessFilter = this.selectedBusiness();
    
    // Filter by business
    if (businessFilter !== 'all') {
      services = services.filter(service => {
        if (typeof service.business_id === 'string') {
          return service.business_id === businessFilter;
        }
        return (service.business_id as Business)._id === businessFilter;
      });
    }
    
    // Filter by search term
    if (search) {
      services = services.filter(service => 
        service.name.toLowerCase().includes(search) ||
        service.description?.toLowerCase().includes(search) ||
        service.short_description?.toLowerCase().includes(search) ||
        service.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    return services;
  });

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Setup mobile detection
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
    });
    
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load user businesses first
      const businesses = await this.businessService.getMyBusinessesAsync();
      this.userBusinesses.set(businesses);

      // Load services for all businesses
      let allServices: Service[] = [];
      for (const business of businesses) {
        try {
          const services = await this.businessService.getBusinessServicesAsync(business._id);
          // Add business info to each service for display purposes
          const servicesWithBusiness = services.map(service => ({
            ...service,
            business_id: business
          }));
          allServices = [...allServices, ...servicesWithBusiness];
        } catch (err) {
          console.warn(`Failed to load services for business ${business._id}:`, err);
        }
      }
      this.userServices.set(allServices);

    } catch (err: any) {
      console.error('Error loading services:', err);
      this.error.set(err.message || 'Failed to load services');
    } finally {
      this.loading.set(false);
    }
  }

  // View mode toggles
  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  // Search functionality
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  // Filter functionality
  onBusinessFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedBusiness.set(target.value);
  }

  // Navigation methods
  navigateToCreateService() {
    this.router.navigate(['/dashboard/services/create-service']);
  }

  navigateToCreateBusiness() {
    this.router.navigate(['/dashboard/businesses/create-business']);
  }

  viewService(serviceId: string) {
    // Navigate to service detail or edit page
    this.editService(serviceId);
  }

  editService(serviceId: string) {
    this.router.navigate(['/dashboard/services/edit-service', serviceId]);
  }

  async deleteService(serviceId: string) {
    const service = this.userServices().find(s => s._id === serviceId);
    if (!service) return;

    const confirmed = confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await this.businessService.deleteServiceAsync(serviceId);
      
      // Remove from local state
      const updatedServices = this.userServices().filter(s => s._id !== serviceId);
      this.userServices.set(updatedServices);
      
      alert('Service deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting service:', err);
      alert(err.message || 'Failed to delete service');
    }
  }

  // Utility methods
  getBusinessName(service: Service): string {
    if (typeof service.business_id === 'object' && service.business_id?.name) {
      return service.business_id.name;
    }
    return 'Unknown Business';
  }

  getBusinessNameMap(): { [key: string]: string } {
    const map: { [key: string]: string } = {};
    this.userServices().forEach(service => {
      map[service._id] = this.getBusinessName(service);
    });
    return map;
  }

  formatPrice(service: Service): string {
    if (!service.price) return 'Price not set';
    
    switch (service.pricing_type) {
      case 'hourly':
        return `$${service.price}/hour`;
      case 'project':
        return `$${service.price}/project`;
      case 'custom':
        return 'Custom pricing';
      default:
        return `$${service.price}`;
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  // Empty state callbacks
  handleClearFilters = () => {
    this.clearSearch();
    this.selectedBusiness.set('all');
  };

  handleCreateBusiness = () => {
    this.navigateToCreateBusiness();
  };

  handleCreateService = () => {
    this.navigateToCreateService();
  };
}

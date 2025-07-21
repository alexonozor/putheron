import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { BusinessService, Business, Service } from '../shared/services/business.service';
import { AuthService } from '../shared/services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-business-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
  ],
  templateUrl: './business-profile.component.html',
  styleUrl: './business-profile.component.scss'
})
export class BusinessProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly authService = inject(AuthService);

  // Signals
  public readonly loading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly business = signal<Business | null>(null);
  public readonly services = signal<Service[]>([]);
  public readonly servicesLoading = signal<boolean>(false);
  public readonly owner = signal<User | null>(null);
  public readonly ownerLoading = signal<boolean>(false);

  // Computed signals
  public readonly isOwner = computed(() => {
    const currentUser = this.authService.user();
    const currentBusiness = this.business();
    if (!currentUser || !currentBusiness) return false;
    
    // Handle both string and object owner_id
    const ownerId = typeof currentBusiness.owner_id === 'string' 
      ? currentBusiness.owner_id 
      : currentBusiness.owner_id?._id;
    
    return currentUser._id === ownerId;
  });

  public readonly activeServices = computed(() => 
    this.services().filter(service => service.is_active)
  );

  public readonly featuredServices = computed(() => 
    this.services().filter(service => service.is_featured && service.is_active)
  );

  public readonly businessTags = computed(() => {
    const business = this.business();
    return business?.tags || [];
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const businessId = params['id'];
      if (businessId) {
        this.loadBusiness(businessId);
        this.loadServices(businessId);
      }
    });
  }

  async loadBusiness(businessId: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      const business = await this.businessService.getBusinessAsync(businessId);
      this.business.set(business);

      // Load owner information
      if (business && business.owner_id) {
        console.log('Loading owner with ID:', business.owner_id, 'Type:', typeof business.owner_id);
        this.loadOwner(business.owner_id);
      }

    } catch (err: any) {
      console.error('Error loading business:', err);
      this.error.set(err?.message || 'Failed to load business profile');
    } finally {
      this.loading.set(false);
    }
  }

  async loadServices(businessId: string) {
    try {
      this.servicesLoading.set(true);

      const services = await this.businessService.getBusinessServicesAsync(businessId, false);
      this.services.set(services);

    } catch (err: any) {
      console.error('Error loading services:', err);
      // Don't set main error for services, just log it
    } finally {
      this.servicesLoading.set(false);
    }
  }

  async loadOwner(ownerId: string | any) {
    try {
      this.ownerLoading.set(true);
      
      // Handle case where owner_id might be populated object or string
      let ownerIdString: string;
      if (typeof ownerId === 'string') {
        ownerIdString = ownerId;
        console.log('Owner ID is string:', ownerIdString);
      } else if (ownerId && typeof ownerId === 'object' && ownerId._id) {
        ownerIdString = ownerId._id;
        console.log('Owner ID is object, extracted ID:', ownerIdString);
      } else {
        console.error('Invalid owner ID format:', ownerId);
        return;
      }
      
      console.log('Making API call with owner ID:', ownerIdString);
      const owner = await this.authService.getUserById(ownerIdString);
      this.owner.set(owner);
    } catch (err: any) {
      console.error('Error loading owner:', err);
      // Don't set main error for owner, just log it
    } finally {
      this.ownerLoading.set(false);
    }
  }

  formatPrice(price: number | undefined, pricingType: string | undefined): string {
    if (!price) return 'Contact for pricing';
    
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

    switch (pricingType) {
      case 'hourly':
        return `${formattedPrice}/hour`;
      case 'project':
        return `${formattedPrice}/project`;
      case 'custom':
        return `Starting at ${formattedPrice}`;
      default:
        return formattedPrice;
    }
  }

  formatDuration(duration: string | undefined): string {
    return duration || 'Duration varies';
  }

  getBusinessTypeDisplay(type: string): string {
    switch (type) {
      case 'service':
        return 'Service Business';
      case 'product':
        return 'Product Business';
      case 'both':
        return 'Service & Product Business';
      default:
        return 'Business';
    }
  }

  goBack() {
    this.router.navigate(['/search']);
  }

  editBusiness() {
    const business = this.business();
    if (business) {
      this.router.navigate(['/edit-business', business._id]);
    }
  }

  addService() {
    const business = this.business();
    if (business) {
      this.router.navigate(['/create-service', business._id]);
    }
  }

  editService(serviceId: string) {
    this.router.navigate(['/edit-service', serviceId]);
  }

  contactBusiness() {
    const business = this.business();
    if (business?.email) {
      window.location.href = `mailto:${business.email}`;
    }
  }

  startProject() {
    const business = this.business();
    const currentUser = this.authService.user();

    if (!currentUser) {
      this.router.navigate(['/auth']);
      return;
    }

    if (!business) {
      return;
    }

    // Check if user is trying to start a project with their own business
    const ownerId = typeof business.owner_id === 'string' 
      ? business.owner_id 
      : business.owner_id?._id;
      
    if (currentUser._id === ownerId) {
      alert('You cannot start a project with your own business.');
      return;
    }

    // Navigate to create-project page with business ID
    this.router.navigate(['/create-project', business._id]);
  }

  contactOwner() {
    const owner = this.owner();
    if (owner?.email) {
      window.location.href = `mailto:${owner.email}`;
    }
  }

  visitWebsite() {
    const business = this.business();
    if (business?.website) {
      window.open(business.website, '_blank');
    }
  }
}
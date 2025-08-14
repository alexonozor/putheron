import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BusinessService, Business, Service } from '../shared/services/business.service';
import { AuthService } from '../shared/services/auth.service';
import { ProjectService, Project } from '../shared/services/project.service';
import { ReviewService } from '../shared/services/review.service';
import { User } from '../models/user.model';
import { HeaderComponent } from '../shared/components/header/header.component';

@Component({
  selector: 'app-business-profile',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
  ],
  templateUrl: './business-profile.component.html',
  styleUrl: './business-profile.component.scss'
})
export class BusinessProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly reviewService = inject(ReviewService);

  // Loading states
  public readonly loading = signal(false);
  public readonly servicesLoading = signal(false);
  public readonly portfolioLoading = signal(false);
  public readonly reviewsLoading = signal(false);
  public readonly error = signal<string | null>(null);

  // Component state
  private businessId: string | null = null;

  // Data signals
  public readonly business = signal<Business | null>(null);
  public readonly owner = signal<User | null>(null);
  public readonly services = signal<Service[]>([]);
  public readonly projects = signal<Project[]>([]);
  public readonly reviews = signal<any[]>([]);
  public readonly reviewStats = signal<any>(null);

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

  public readonly completedProjects = computed(() => 
    this.projects().filter(project => project.status === 'completed')
  );

  public readonly averageRating = computed(() => {
    const stats = this.reviewStats();
    return stats?.average_rating || 0;
  });

  public readonly totalReviews = computed(() => {
    return this.reviews().length;
  });

  public readonly hasReviews = computed(() => {
    return this.reviews().length > 0;
  });

  public readonly recentReviews = computed(() => {
    return this.reviews()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // Show only 5 most recent reviews
  });

  // Navigation state
  public readonly activeSection = signal<string>('about');

  // Navigation sections
  public readonly navigationSections = computed(() => [
    { id: 'about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'services', label: `Services (${this.activeServices().length})`, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'portfolio', label: `Portfolio (${this.completedProjects().length})`, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6' },
    { id: 'reviews', label: `Reviews (${this.totalReviews()}) ${this.averageRating() > 0 ? '⭐' + this.averageRating().toFixed(1) : ''}`, icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' }
  ]);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const businessId = params['id'];
      if (businessId) {
        this.businessId = businessId;
        this.loadBusiness();
        this.loadServices(businessId);
        this.loadProjects(businessId);
        this.loadReviews(businessId);
      }
    });
  }

  private async loadBusiness() {
    if (!this.businessId) return;

    this.loading.set(true);
    try {
      const business = await this.businessService.getBusinessAsync(this.businessId);
      if (business) {
        this.business.set(business);
        
        // Owner information is already populated in the business response
        if (business.owner_id && typeof business.owner_id === 'object') {
          this.owner.set(business.owner_id);
        }
      }
    } catch (error) {
      console.error('Error loading business:', error);
      // Handle error appropriately
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

  async loadProjects(businessId: string) {
    try {
      this.portfolioLoading.set(true);

      const projects = await this.projectService.getBusinessPortfolioAsync(businessId);
      this.projects.set(projects);

    } catch (err: any) {
      console.error('Error loading projects:', err);
      // Don't set main error for projects, just log it
    } finally {
      this.portfolioLoading.set(false);
    }
  }

  async loadReviews(businessId: string) {
    try {
      this.reviewsLoading.set(true);

      // Load reviews for this business
      const reviews = await this.reviewService.getBusinessReviewsAsync(businessId);
      this.reviews.set(reviews);

      // Load review stats
      const stats = await this.reviewService.getBusinessRatingStatsAsync(businessId);
      this.reviewStats.set(stats);

    } catch (err: any) {
      console.error('Error loading reviews:', err);
      // Don't set main error for reviews, just log it
    } finally {
      this.reviewsLoading.set(false);
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
      this.router.navigate(['dashboard', 'businesses', 'edit', business._id]);
    }
  }

  addService() {
    const business = this.business();
    if (business) {
      this.router.navigate(['dashboard', 'services', 'create-service'], {
        queryParams: { businessId: business._id }
      });
    }
  }

  editService(serviceId: string) {
    this.router.navigate(['/dashboard/services/edit-service', serviceId]);
  }

  contactBusiness() {
    const business = this.business();
    if (business?.contact_email) {
      window.location.href = `mailto:${business.contact_email}`;
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

    // Check if business has any active services
    if (this.activeServices().length === 0) {
      alert('This business has no active services available for projects. Please contact them directly or check back later.');
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

  startProjectWithService(serviceId: string) {
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

    // Navigate to create-project page with business ID and service ID as query param
    this.router.navigate(['/create-project', business._id], {
      queryParams: { serviceId: serviceId }
    });
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

  // Navigation methods
  scrollToSection(sectionId: string) {
    this.activeSection.set(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -100; // Offset for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  // Get dynamic service count for navigation
  getServicesLabel(): string {
    return `Services (${this.activeServices().length})`;
  }

  // Get dynamic portfolio count for navigation
  getPortfolioLabel(): string {
    return `Portfolio (${this.completedProjects().length})`;
  }

  // Helper methods for projects
  getClientName(project: Project): string {
    if (typeof project.client_id === 'object' && project.client_id) {
      return `${project.client_id.first_name} ${project.client_id.last_name}`;
    }
    return 'Unknown Client';
  }

  getServiceName(service: string | { _id: string; name: string; price?: number; pricing_type?: string; description?: string; short_description?: string; duration?: number; features?: string[] }): string {
    if (typeof service === 'object' && service && 'name' in service) {
      return service.name;
    }
    return 'Service';
  }

  // Review helper methods
  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(rating));
    }
    return stars;
  }

  formatReviewDate(date: Date | string): string {
    if (!date) return 'Date not specified';
    
    const reviewDate = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return reviewDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  getRatingLabel(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Fair';
    if (rating >= 2.5) return 'Poor';
    return 'Very Poor';
  }

  getReviewerName(review: any): string {
    if (review.user_id && typeof review.user_id === 'object') {
      const firstName = review.user_id.first_name || '';
      const lastName = review.user_id.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Anonymous';
    }
    return 'Anonymous';
  }

  getProjectTitle(review: any): string {
    if (review.project_id && typeof review.project_id === 'object' && review.project_id.title) {
      return review.project_id.title;
    }
    return 'Project';
  }

  formatProjectDate(date: string | Date | undefined): string {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  }

  formatProjectPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  viewProject(project: Project): void {
    this.router.navigate(['/dashboard/projects', project._id]);
  }
}
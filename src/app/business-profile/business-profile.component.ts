import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HeaderComponent } from '../shared/components/header/header.component';
import { SupabaseService } from '../shared/services/supabase.service';
import { ReviewsService, ReviewWithDetails, ReviewStats } from '../shared/services/reviews.service';
import { AuthService } from '../shared/services/auth.service';
import { ReviewFormComponent } from '../shared/components/review-form/review-form.component';
import { Tables } from '../shared/types/database.types';

// Define interface for business profile with relations
interface BusinessProfile extends Tables<'businesses'> {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    city: string | null;
    country: string | null;
    country_of_origin: string | null;
  };
  category?: {
    name: string;
  };
  subcategory?: {
    name: string;
  };
}

// Define interface for services
interface BusinessService extends Tables<'services'> {
  // Add any additional service properties if needed
}

// Define interface for projects
interface BusinessProject extends Tables<'projects'> {
  // Add any additional project properties if needed
}

@Component({
  selector: 'app-business-profile',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatCardModule,
    MatProgressBarModule,
    MatDialogModule,
    HeaderComponent
  ],
  templateUrl: './business-profile.component.html',
  styleUrl: './business-profile.component.scss'
})
export class BusinessProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private reviewsService = inject(ReviewsService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  // Signals for reactive state management
  public business = signal<BusinessProfile | null>(null);
  public services = signal<BusinessService[]>([]);
  public projects = signal<BusinessProject[]>([]);
  public reviews = signal<ReviewWithDetails[]>([]);
  public reviewStats = signal<ReviewStats | null>(null);
  public loading = signal(false);
  public servicesLoading = signal(false);
  public projectsLoading = signal(false);
  public reviewsLoading = signal(false);
  public error = signal<string | null>(null);
  public businessId = signal<string>('');

  // Computed properties
  public hasServices = computed(() => this.services().length > 0);
  public activeServices = computed(() => 
    this.services().filter(service => service.is_active)
  );
  public hasProjects = computed(() => this.projects().length > 0);
  public featuredProjects = computed(() => 
    this.projects().filter(project => project.is_featured)
  );
  public allProjects = computed(() => this.projects());
  public hasReviews = computed(() => this.reviews().length > 0);
  public averageRating = computed(() => {
    const stats = this.reviewStats();
    const business = this.business();
    
    if (stats && stats.average_rating > 0) {
      return stats.average_rating;
    }
    
    // Fall back to business record if no stats
    if (business && business.average_rating) {
      return business.average_rating;
    }
    
    return 0;
  });
  
  public totalReviews = computed(() => {
    const stats = this.reviewStats();
    const business = this.business();
    
    if (stats && stats.review_count > 0) {
      return stats.review_count;
    }
    
    // Fall back to business record if no stats
    if (business && business.review_count) {
      return business.review_count;
    }
    
    return 0;
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.businessId.set(id);
        this.loadBusiness(id);
      }
    });
  }

  async loadBusiness(id: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      console.log('Loading business with ID:', id);
      console.log('ID type:', typeof id);
      console.log('ID length:', id.length);

      // The business ID is actually a UUID string, not a number
      // So we use it directly without parsing to integer
      console.log('Using business ID as UUID:', id);

      // Query business by ID (UUID)
      const { data, error } = await this.supabaseService.getClient()
        .from('businesses')
        .select(`
          *,
          profile:profiles!businesses_profile_id_fkey (
            full_name,
            avatar_url,
            bio,
            city,
            country,
            country_of_origin
          ),
          category:categories!businesses_category_id_fkey (
            name
          ),
          subcategory:subcategories!businesses_subcategory_id_fkey (
            name
          )
        `)
        .eq('id', id as any)
        .single();

      console.log('Business query result:', data);
      console.log('Business query error:', error);

      if (error) {
        console.error('Error loading business:', error);
        this.error.set('Business not found');
        return;
      }

      if (data) {
        const business: BusinessProfile = {
          ...data,
          profile: Array.isArray(data.profile) ? data.profile[0] : data.profile,
          category: Array.isArray(data.category) ? data.category[0] : data.category,
          subcategory: Array.isArray(data.subcategory) ? data.subcategory[0] : data.subcategory
        };

        console.log('Processed business data:', business);
        console.log('Business logo URL:', business.logo_url);
        console.log('Profile avatar URL:', business.profile?.avatar_url);

        this.business.set(business);
        
        // Load services, projects, and reviews for this business using the actual business ID
        await this.loadServices(business.id);
        await this.loadProjects(business.id);
        await this.loadReviewsAndStats(business.id);
      }

    } catch (err: any) {
      console.error('Error loading business:', err);
      this.error.set('Failed to load business');
    } finally {
      this.loading.set(false);
    }
  }

  async loadServices(businessId: string) {
    try {
      this.servicesLoading.set(true);

      const { data, error } = await this.supabaseService.getClient()
        .from('services')
        .select('*')
        .eq('business_id', businessId as any)
        .order('created_at', { ascending: false });

      console.log('Services query result:', data);
      console.log('Services query error:', error);

      if (error) {
        console.error('Error loading services:', error);
        return;
      }

      if (data) {
        console.log('Services loaded:', data);
        console.log('Number of services:', data.length);
        data.forEach((service, index) => {
          console.log(`Service ${index + 1}:`, service.name, 'Image URL:', service.image_url);
        });
        this.services.set(data);
      }

    } catch (err: any) {
      console.error('Error loading services:', err);
    } finally {
      this.servicesLoading.set(false);
    }
  }

  async loadProjects(businessId: string) {
    try {
      this.projectsLoading.set(true);

      const { data, error } = await this.supabaseService.getClient()
        .from('projects')
        .select('*')
        .eq('business_id', businessId as any)
        .order('completion_date', { ascending: false });

      console.log('Projects query result:', data);
      console.log('Projects query error:', error);

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      if (data) {
        console.log('Projects loaded:', data);
        console.log('Number of projects:', data.length);
        data.forEach((project, index) => {
          console.log(`Project ${index + 1}:`, project.title, 'Image URL:', project.image_url);
        });
        this.projects.set(data);
      }

    } catch (err: any) {
      console.error('Error loading projects:', err);
    } finally {
      this.projectsLoading.set(false);
    }
  }

  async loadReviewsAndStats(businessId: string) {
    try {
      this.reviewsLoading.set(true);

      const { reviews, stats } = await this.reviewsService.getBusinessReviewsAndStats(businessId);
      
      console.log('Reviews loaded:', reviews);
      console.log('Review stats loaded:', stats);
      console.log('Number of reviews:', reviews.length);
      
      this.reviews.set(reviews);
      this.reviewStats.set(stats);

    } catch (err: any) {
      console.error('Error loading reviews and stats:', err);
    } finally {
      this.reviewsLoading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/search']);
  }

  handleImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop';
  }

  handleServiceImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=200&fit=crop';
  }

  getBusinessImageUrl(): string {
    const business = this.business();
    if (business?.logo_url) {
      console.log('Business logo URL:', business.logo_url);
      return business.logo_url;
    }
    return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop';
  }

  getOwnerAvatar(): string {
    const business = this.business();
    if (business?.profile?.avatar_url) {
      console.log('Owner avatar URL:', business.profile.avatar_url);
      return business.profile.avatar_url;
    }
    return 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop';
  }

  getServiceImageUrl(service: BusinessService): string {
    if (service.image_url) {
      console.log('Service image URL:', service.image_url);
      return service.image_url;
    }
    return 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=200&fit=crop';
  }

  getProjectImageUrl(project: BusinessProject): string {
    if (project.image_url) {
      console.log('Project image URL:', project.image_url);
      return project.image_url;
    }
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop';
  }

  handleProjectImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop';
  }

  getBusinessLocation(): string {
    const business = this.business();
    if (!business) return 'Location not specified';
    
    const parts = [];
    if (business.city) parts.push(business.city);
    if (business.state) parts.push(business.state);
    if (business.country) parts.push(business.country);
    
    return parts.join(', ') || 'Location not specified';
  }

  getOwnerLocation(): string {
    const business = this.business();
    if (!business?.profile) return 'Location not specified';
    
    const parts = [];
    if (business.profile.city) parts.push(business.profile.city);
    if (business.profile.country) parts.push(business.profile.country);
    
    return parts.join(', ') || 'Location not specified';
  }

  formatPrice(price: number | null): string {
    if (price === null || price === undefined) return 'Price on request';
    return `$${price.toFixed(2)}`;
  }

  formatDuration(minutes: number | null): string {
    if (!minutes) return 'Duration varies';
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  }

  formatCompletionDate(dateString: string | null): string {
    if (!dateString) return 'Date not specified';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }

  openProjectGallery(project: BusinessProject): void {
    // For now, just show the main image in a new tab
    if (project.image_url) {
      window.open(project.image_url, '_blank');
    } else if (project.gallery_urls && project.gallery_urls.length > 0) {
      window.open(project.gallery_urls[0], '_blank');
    }
  }

  contactBusiness() {
    const business = this.business();
    if (business?.contact_email) {
      window.location.href = `mailto:${business.contact_email}`;
    } else if (business?.contact_phone) {
      window.location.href = `tel:${business.contact_phone}`;
    }
  }

  startProject() {
    const business = this.business();
    if (!business) return;

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      // Store the current business profile URL for return after login
      const returnUrl = `/business/${business.id}`;
      sessionStorage.setItem('returnUrl', returnUrl);
      
      // Redirect to auth page
      this.router.navigate(['/auth'], { 
        queryParams: { 
          action: 'login',
          message: 'Please log in to start a project with this business'
        }
      });
      return;
    }

    // User is authenticated, navigate to project creation
    this.router.navigate(['/create-project', business.id]);
  }

  callBusiness() {
    const business = this.business();
    if (business?.contact_phone) {
      window.location.href = `tel:${business.contact_phone}`;
    }
  }

  visitWebsite() {
    const business = this.business();
    if (business?.website_url) {
      window.open(business.website_url, '_blank');
    }
  }

  // Review-related methods
  getStarArray(rating: number): boolean[] {
    return this.reviewsService.getStarArray(rating);
  }

  formatRating(rating: number): string {
    return this.reviewsService.formatRating(rating);
  }

  getRatingLabel(rating: number): string {
    return this.reviewsService.getRatingLabel(rating);
  }

  formatReviewDate(dateString: string | null): string {
    return this.reviewsService.formatReviewDate(dateString);
  }

  getReviewerAvatar(review: ReviewWithDetails): string {
    if (review.reviewer_avatar) {
      return review.reviewer_avatar;
    }
    return 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop';
  }

  handleReviewerAvatarError(event: any): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop';
  }

  getRatingPercentage(starCount: number): number {
    const stats = this.reviewStats();
    if (!stats || stats.review_count === 0) return 0;
    
    let count = 0;
    switch (starCount) {
      case 5: count = stats.five_star_count; break;
      case 4: count = stats.four_star_count; break;
      case 3: count = stats.three_star_count; break;
      case 2: count = stats.two_star_count; break;
      case 1: count = stats.one_star_count; break;
    }
    
    return (count / stats.review_count) * 100;
  }

  openReviewDialog() {
    const business = this.business();
    if (!business) return;

    const dialogRef = this.dialog.open(ReviewFormComponent, {
      width: '600px',
      data: {
        businessId: business.id,
        businessName: business.name
      }
    });

    dialogRef.componentInstance.businessId = business.id;
    dialogRef.componentInstance.businessName = business.name;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh reviews and stats after successful submission
        this.loadReviewsAndStats(business.id);
      }
    });
  }

  canWriteReview(): boolean {
    return this.authService.isAuthenticated();
  }
}

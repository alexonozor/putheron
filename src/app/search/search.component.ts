import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HeaderComponent } from '../shared/components/header/header.component';
import { BusinessService, Business } from '../shared/services/business.service';
import { CategoryService } from '../shared/services/category-new.service';
import { FavoriteButtonComponent } from '../shared/components/favorite-button/favorite-button.component';
import { AuthService } from '../shared/services/auth.service';
import { COUNTRIES } from '../shared/data/countries';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatSidenavModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule,
    HeaderComponent,
    FavoriteButtonComponent
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private businessService = inject(BusinessService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  
  // Signals
  searchQuery = signal<string>('');
  selectedCountries = signal<string[]>([]);
  selectedCategories = signal<string[]>([]);
  selectedBusinessTypes = signal<string[]>([]);
  selectedRating = signal<number>(0);
  businesses = signal<Business[]>([]);
  categories = signal<any[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  total = signal<number>(0);
  currentPage = signal<number>(1);
  totalPages = signal<number>(0);
  filtersOpen = signal<boolean>(false);
  
  // Computed properties
  readonly isClientMode = computed(() => {
    const user = this.authService.user();
    return !user || user.user_mode === 'client';
  });
  
  // Filter form
  filterForm!: FormGroup;
  
  // Filter options
  countries = COUNTRIES;
  businessTypes = [
    { value: 'service', label: 'Service' },
    { value: 'product', label: 'Product' },
    { value: 'both', label: 'Both' }
  ];
  
  ratingOptions = [
    { value: 0, label: 'All ratings' },
    { value: 1, label: '1+ stars' },
    { value: 2, label: '2+ stars' },
    { value: 3, label: '3+ stars' },
    { value: 4, label: '4+ stars' },
    { value: 5, label: '5 stars' }
  ];
  
  // Results computed signal
  hasResults = computed(() => this.businesses().length > 0);
  hasSearched = computed(() => 
    this.searchQuery() || 
    this.selectedCountries().length > 0 || 
    this.selectedCategories().length > 0 || 
    this.selectedBusinessTypes().length > 0 ||
    this.selectedRating() > 0
  );

  hasActiveFilters = computed(() => {
    const form = this.filterForm?.value;
    return !!(form?.selectedCountries?.length > 0 || 
             form?.businessType || 
             form?.location || 
             form?.featuredOnly ||
             form?.selectedCategories?.length > 0 ||
             form?.selectedBusinessTypes?.length > 0 ||
             form?.selectedRating > 0);
  });

  ngOnInit() {
    this.initializeForm();
    this.loadCategories();
    
    // Subscribe to route changes
    this.route.queryParams.subscribe(params => {
      this.searchQuery.set(params['q'] || '');
      this.selectedCountries.set(params['countries'] ? params['countries'].split(',') : []);
      this.selectedCategories.set(params['categories'] ? params['categories'].split(',') : []);
      this.selectedBusinessTypes.set(params['businessTypes'] ? params['businessTypes'].split(',') : []);
      this.selectedRating.set(parseInt(params['rating']) || 0);
      this.currentPage.set(parseInt(params['page']) || 1);
      
      // Update form with URL params
      this.filterForm.patchValue({
        searchQuery: this.searchQuery(),
        selectedCountries: this.selectedCountries(),
        selectedCategories: this.selectedCategories(),
        selectedBusinessTypes: this.selectedBusinessTypes(),
        selectedRating: this.selectedRating()
      }, { emitEvent: false });
      
      // Perform search
      this.performSearch();
    });
  }

  private initializeForm() {
    this.filterForm = this.fb.group({
      searchQuery: [this.searchQuery()],
      selectedCountries: [this.selectedCountries()],
      selectedCategories: [this.selectedCategories()],
      selectedBusinessTypes: [this.selectedBusinessTypes()],
      selectedRating: [this.selectedRating()],
      businessType: [''],
      location: [''],
      featuredOnly: [false]
    });
  }

  private async loadCategories() {
    try {
      const categories = await this.categoryService.loadCategories();
      this.categories.set(categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async performSearch() {
    const query = this.searchQuery();
    const countries = this.selectedCountries();
    const page = this.currentPage();
    
    // If no query and user is in client mode, show verified businesses
    if (!query && countries.length === 0 && this.isClientMode()) {
      this.loadVerifiedBusinesses();
      return;
    }
    
    // Skip search if no query and no countries for non-client mode
    if (!query && countries.length === 0) {
      this.businesses.set([]);
      this.total.set(0);
      this.totalPages.set(0);
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      const response = await this.businessService.searchBusinesses(
        query || undefined,
        countries.length > 0 ? countries : undefined,
        page,
        12 // Items per page
      ).toPromise();

      if (response?.success && response.data) {
        this.businesses.set(response.data.businesses);
        this.total.set(response.data.total);
        this.totalPages.set(response.data.totalPages);
      } else {
        this.error.set('Failed to search businesses');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.error.set('An error occurred while searching');
    } finally {
      this.loading.set(false);
    }
  }

  async loadVerifiedBusinesses() {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Search for verified businesses using filters
      const response = await this.businessService.searchBusinesses(
        undefined, // No query
        undefined, // No country filter
        this.currentPage(),
        12, // Items per page
        { featured: true } // Search for featured/verified businesses
      ).toPromise();

      if (response?.success && response.data) {
        this.businesses.set(response.data.businesses);
        this.total.set(response.data.total);
        this.totalPages.set(response.data.totalPages);
      } else {
        this.error.set('Failed to load verified businesses');
      }
    } catch (error) {
      console.error('Load verified businesses error:', error);
      this.error.set('An error occurred while loading verified businesses');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch() {
    const formValue = this.filterForm.value;
    const queryParams: any = { page: 1 }; // Reset to first page on new search
    
    if (formValue.searchQuery?.trim()) {
      queryParams.q = formValue.searchQuery.trim();
    }
    
    if (formValue.selectedCountries && formValue.selectedCountries.length > 0) {
      queryParams.countries = formValue.selectedCountries.join(',');
    }

    if (formValue.selectedCategories && formValue.selectedCategories.length > 0) {
      queryParams.categories = formValue.selectedCategories.join(',');
    }

    if (formValue.selectedBusinessTypes && formValue.selectedBusinessTypes.length > 0) {
      queryParams.businessTypes = formValue.selectedBusinessTypes.join(',');
    }

    if (formValue.selectedRating && formValue.selectedRating > 0) {
      queryParams.rating = formValue.selectedRating;
    }

    this.router.navigate(['/search'], { queryParams });
  }

  clearFilters() {
    this.filterForm.reset({
      searchQuery: '',
      selectedCountries: [],
      selectedCategories: [],
      selectedBusinessTypes: [],
      selectedRating: 0,
      businessType: '',
      location: '',
      featuredOnly: false
    });
    this.onSearch();
  }

  toggleFilters() {
    this.filtersOpen.update(open => !open);
  }

  onPageChange(page: number) {
    const currentParams = this.route.snapshot.queryParams;
    this.router.navigate(['/search'], { 
      queryParams: { ...currentParams, page } 
    });
  }

  getOwnerName(business: Business): string {
    const owner = business.owner_id as any;
    if (owner?.first_name && owner?.last_name) {
      return `${owner.first_name} ${owner.last_name}`;
    }
    if (owner?.first_name) {
      return owner.first_name;
    }
    if (owner?.email) {
      return owner.email;
    }
    return 'Business Owner';
  }

  getOwnerCountry(business: Business): string {
    const owner = business.owner_id as any;
    return owner?.country_of_origin || 'Unknown';
  }

  getCategoryName(business: Business): string {
    const category = business.category_id as any;
    return category?.name || 'Uncategorized';
  }

  getOwnerAvatar(business: Business): string | null {
    const owner = business.owner_id as any;
    return owner?.profile_image_url || null;
  }

  onBusinessClick(business: Business) {
    this.router.navigate(['/business', business._id]);
  }

  // Helper methods for template
  generatePageNumbers(): number[] {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}

// Old commented code - keeping for reference
/* 
// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// import { MatSelectModule } from '@angular/material/select';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatSliderModule } from '@angular/material/slider';
// import { MatCheckboxModule } from '@angular/material/checkbox';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatIconModule } from '@angular/material/icon';
// import { HeaderComponent } from '../shared/components/header/header.component';
// import { BusinessService } from '../shared/services/business.service';
// import { CategoryService } from '../shared/services/category.service';
// import { SupabaseService } from '../shared/services/supabase.service';
// import { ReviewsService } from '../shared/services/reviews.service';
// import { Tables } from '../shared/types/database.types';

// // Define interfaces for search functionality
// interface SearchBusiness extends Tables<'businesses'> {
//   profile?: {
//     full_name: string | null;
//     avatar_url: string | null;
//   };
//   category?: {
//     name: string;
//   };
//   subcategory?: {
//     name: string;
//   };
// }

// interface BusinessFilter {
//   category_id?: string;
//   subcategory_id?: string;
//   city?: string;
//   country?: string;
//   is_active?: boolean;
//   searchQuery?: string;
// }

// interface PriceRange {
//   label?: string;
//   min: number;
//   max: number;
// }

// @Component({
//   selector: 'app-search',
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatSelectModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatButtonModule,
//     MatSliderModule,
//     MatCheckboxModule,
//     MatChipsModule,
//     MatIconModule,
//     HeaderComponent
//   ],
//   templateUrl: './search.component.html',
//   styleUrl: './search.component.scss'
// })
// export class SearchComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private fb = inject(FormBuilder);
//   private businessService = inject(BusinessService);
//   private categoryService = inject(CategoryService);
//   private supabaseService = inject(SupabaseService);
//   private reviewsService = inject(ReviewsService);
  
//   // Signals
//   searchQuery = signal<string>('');
//   selectedCountries = signal<string[]>([]);
//   allBusinesses = signal<SearchBusiness[]>([]);
//   filteredBusinesses = signal<SearchBusiness[]>([]);
//   categories = signal<any[]>([]);
//   loading = signal<boolean>(false);
//   error = signal<string | null>(null);
  
//   // Filter form
//   filterForm!: FormGroup;
  
//   // Filter options
//   priceRanges: PriceRange[] = [
//     { label: 'Under $50', min: 0, max: 50 },
//     { label: '$50 - $100', min: 50, max: 100 },
//     { label: '$100 - $250', min: 100, max: 250 },
//     { label: '$250 - $500', min: 250, max: 500 },
//     { label: '$500+', min: 500, max: 10000 }
//   ];

//   ngOnInit() {
//     this.initializeForm();
//     this.loadCategories();
//     this.loadBusinesses();
    
//     this.route.queryParams.subscribe(params => {
//       this.searchQuery.set(params['q'] || '');
//       this.selectedCountries.set(params['countries'] ? params['countries'].split(',') : []);
//       this.applyFilters();
//     });
//   }

//   private initializeForm() {
//     this.filterForm = this.fb.group({
//       category: [''],
//       subcategory: [''],
//       city: [''],
//       country: [''],
//       searchQuery: ['']
//     });
    
//     // Watch for filter changes
//     this.filterForm.valueChanges.subscribe(() => {
//       this.applyFilters();
//     });
//   }

//   private async loadCategories() {
//     try {
//       const categories = await this.categoryService.getCategoriesWithSubcategories();
//       this.categories.set(categories);
//     } catch (error) {
//       console.error('Error loading categories:', error);
//     }
//   }

//   async loadBusinesses() {
//     try {
//       this.loading.set(true);
//       this.error.set(null);

//       const { data, error } = await this.supabaseService.getClient()
//         .from('businesses')
//         .select(`
//           *,
//           profile:profiles!businesses_profile_id_fkey (
//             full_name,
//             avatar_url
//           ),
//           category:categories!businesses_category_id_fkey (
//             name
//           ),
//           subcategory:subcategories!businesses_subcategory_id_fkey (
//             name
//           )
//         `)
//         .eq('is_active', true)
//         .order('created_at', { ascending: false });

//       if (error) {
//         console.error('Error loading businesses:', error);
//         this.error.set('Failed to load businesses');
//         return;
//       }

//       if (data) {
//         const businesses: SearchBusiness[] = data.map(business => ({
//           ...business,
//           profile: Array.isArray(business.profile) ? business.profile[0] : business.profile,
//           category: Array.isArray(business.category) ? business.category[0] : business.category,
//           subcategory: Array.isArray(business.subcategory) ? business.subcategory[0] : business.subcategory
//         }));

//         this.allBusinesses.set(businesses);
//         this.filteredBusinesses.set(businesses);
//       }

//     } catch (err: any) {
//       console.error('Error loading businesses:', err);
//       this.error.set('Failed to load businesses');
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   private applyFilters() {
//     const query = this.searchQuery().toLowerCase();
//     const filters = this.filterForm?.value || {};
    
//     let filtered = this.allBusinesses().filter((business: SearchBusiness) => {
//       // Text search
//       const matchesQuery = !query || 
//         business.name.toLowerCase().includes(query) ||
//         (business.description && business.description.toLowerCase().includes(query));
      
//       // Category filter
//       const matchesCategory = !filters.category || business.category_id === filters.category;
      
//       // Subcategory filter
//       const matchesSubcategory = !filters.subcategory || business.subcategory_id === filters.subcategory;
      
//       // City filter
//       const matchesCity = !filters.city || 
//         (business.city && business.city.toLowerCase().includes(filters.city.toLowerCase()));
      
//       // Country filter
//       const matchesCountry = !filters.country || 
//         (business.country && business.country.toLowerCase().includes(filters.country.toLowerCase()));
      
//       return matchesQuery && matchesCategory && matchesSubcategory && 
//              matchesCity && matchesCountry;
//     });
    
//     this.filteredBusinesses.set(filtered);
//   }

//   clearFilters() {
//     this.filterForm.reset();
//     this.applyFilters();
//   }

//   getBusinessImageUrl(business: SearchBusiness): string {
//     return business.logo_url || 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400';
//   }

//   getOwnerName(business: SearchBusiness): string {
//     return business.profile?.full_name || 'Business Owner';
//   }

//   getOwnerAvatar(business: SearchBusiness): string {
//     return business.profile?.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100';
//   }

//   getCategoryName(business: SearchBusiness): string {
//     return business.category?.name || 'Business';
//   }

//   getLocation(business: SearchBusiness): string {
//     const parts = [];
//     if (business.city) parts.push(business.city);
//     if (business.country) parts.push(business.country);
//     return parts.join(', ') || 'Location not specified';
//   }

//   handleImageError(event: any): void {
//     const target = event.target as HTMLImageElement;
//     target.src = 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400';
//   }

//   viewBusinessDetails(business: SearchBusiness): void {
//     console.log('Navigating to business:', business);
//     console.log('Business ID:', business.id);
//     console.log('Business ID type:', typeof business.id);
//     console.log('Profile ID:', business.profile_id);
//     this.router.navigate(['/business', business.id]);
//   }

//   // Rating helper methods
//   getStarArray(rating: number): boolean[] {
//     return this.reviewsService.getStarArray(rating);
//   }

//   formatRating(rating: number): string {
//     return this.reviewsService.formatRating(rating);
//   }

//   hasRating(business: SearchBusiness): boolean {
//     return business.average_rating !== null && business.average_rating > 0;
//   }
// }
*/

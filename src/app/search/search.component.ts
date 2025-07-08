import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../shared/components/header/header.component';
import { BusinessService } from '../shared/services/business.service';
import { CategoryService } from '../shared/services/category.service';
import { SupabaseService } from '../shared/services/supabase.service';
import { Tables } from '../shared/types/database.types';

// Define interfaces for search functionality
interface SearchBusiness extends Tables<'businesses'> {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  category?: {
    name: string;
  };
  subcategory?: {
    name: string;
  };
}

interface BusinessFilter {
  category_id?: string;
  subcategory_id?: string;
  city?: string;
  country?: string;
  is_active?: boolean;
  searchQuery?: string;
}

interface PriceRange {
  label?: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-search',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSliderModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    HeaderComponent
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private businessService = inject(BusinessService);
  private categoryService = inject(CategoryService);
  private supabaseService = inject(SupabaseService);
  
  // Signals
  searchQuery = signal<string>('');
  selectedCountries = signal<string[]>([]);
  allBusinesses = signal<SearchBusiness[]>([]);
  filteredBusinesses = signal<SearchBusiness[]>([]);
  categories = signal<any[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Filter form
  filterForm!: FormGroup;
  
  // Filter options
  priceRanges: PriceRange[] = [
    { label: 'Under $50', min: 0, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $250', min: 100, max: 250 },
    { label: '$250 - $500', min: 250, max: 500 },
    { label: '$500+', min: 500, max: 10000 }
  ];

  ngOnInit() {
    this.initializeForm();
    this.loadCategories();
    this.loadBusinesses();
    
    this.route.queryParams.subscribe(params => {
      this.searchQuery.set(params['q'] || '');
      this.selectedCountries.set(params['countries'] ? params['countries'].split(',') : []);
      this.applyFilters();
    });
  }

  private initializeForm() {
    this.filterForm = this.fb.group({
      category: [''],
      subcategory: [''],
      city: [''],
      country: [''],
      searchQuery: ['']
    });
    
    // Watch for filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private async loadCategories() {
    try {
      const categories = await this.categoryService.getCategoriesWithSubcategories();
      this.categories.set(categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async loadBusinesses() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const { data, error } = await this.supabaseService.getClient()
        .from('businesses')
        .select(`
          *,
          profile:profiles!businesses_profile_id_fkey (
            full_name,
            avatar_url
          ),
          category:categories!businesses_category_id_fkey (
            name
          ),
          subcategory:subcategories!businesses_subcategory_id_fkey (
            name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading businesses:', error);
        this.error.set('Failed to load businesses');
        return;
      }

      if (data) {
        const businesses: SearchBusiness[] = data.map(business => ({
          ...business,
          profile: Array.isArray(business.profile) ? business.profile[0] : business.profile,
          category: Array.isArray(business.category) ? business.category[0] : business.category,
          subcategory: Array.isArray(business.subcategory) ? business.subcategory[0] : business.subcategory
        }));

        this.allBusinesses.set(businesses);
        this.filteredBusinesses.set(businesses);
      }

    } catch (err: any) {
      console.error('Error loading businesses:', err);
      this.error.set('Failed to load businesses');
    } finally {
      this.loading.set(false);
    }
  }

  private applyFilters() {
    const query = this.searchQuery().toLowerCase();
    const filters = this.filterForm?.value || {};
    
    let filtered = this.allBusinesses().filter((business: SearchBusiness) => {
      // Text search
      const matchesQuery = !query || 
        business.name.toLowerCase().includes(query) ||
        (business.description && business.description.toLowerCase().includes(query));
      
      // Category filter
      const matchesCategory = !filters.category || business.category_id === filters.category;
      
      // Subcategory filter
      const matchesSubcategory = !filters.subcategory || business.subcategory_id === filters.subcategory;
      
      // City filter
      const matchesCity = !filters.city || 
        (business.city && business.city.toLowerCase().includes(filters.city.toLowerCase()));
      
      // Country filter
      const matchesCountry = !filters.country || 
        (business.country && business.country.toLowerCase().includes(filters.country.toLowerCase()));
      
      return matchesQuery && matchesCategory && matchesSubcategory && 
             matchesCity && matchesCountry;
    });
    
    this.filteredBusinesses.set(filtered);
  }

  clearFilters() {
    this.filterForm.reset();
    this.applyFilters();
  }

  getBusinessImageUrl(business: SearchBusiness): string {
    return business.logo_url || 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400';
  }

  getOwnerName(business: SearchBusiness): string {
    return business.profile?.full_name || 'Business Owner';
  }

  getOwnerAvatar(business: SearchBusiness): string {
    return business.profile?.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100';
  }

  getCategoryName(business: SearchBusiness): string {
    return business.category?.name || 'Business';
  }

  getLocation(business: SearchBusiness): string {
    const parts = [];
    if (business.city) parts.push(business.city);
    if (business.country) parts.push(business.country);
    return parts.join(', ') || 'Location not specified';
  }

  handleImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400';
  }
}

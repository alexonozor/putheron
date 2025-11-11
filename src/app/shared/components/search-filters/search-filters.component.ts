import { Component, OnInit, OnDestroy, inject, input, output, signal, effect, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { CategoryService, Category } from '../../services/category-new.service';
import { Search } from '../search/search';
import { MobileSortSheetComponent } from '../mobile-sort-sheet/mobile-sort-sheet.component';
import { MobileFilterSheetComponent } from '../mobile-filter-sheet/mobile-filter-sheet.component';

export interface SearchFilters {
  searchQuery?: string;
  selectedCategories?: string[];
  businessType?: string;
  selectedCountries?: string[];
  selectedRating?: number;
  sortBy?: string;
}

export interface Country {
  name: string;
  code: string;
}

@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatBottomSheetModule,
    Search
  ],
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.scss']
})
export class SearchFiltersComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private elementRef = inject(ElementRef);
  private bottomSheet = inject(MatBottomSheet);

  // Inputs
  countries = input<Country[]>([]);
  showSearchInput = input<boolean>(false);
  totalResults = input<number>(0);
  
  // Initial filter values from URL params
  initialSearchQuery = input<string>('');
  initialCategories = input<string[]>([]);
  initialBusinessType = input<string>('');
  initialCountries = input<string[]>([]);
  initialRating = input<number>(0);
  initialSortBy = input<string>('relevance');

  // Outputs
  filtersChange = output<SearchFilters>();
  
  // Individual form controls that will be shared across both filter instances
  searchQueryControl = new FormControl('');
  selectedCategoriesControl = new FormControl<string[]>([]);
  businessTypeControl = new FormControl('');
  selectedCountriesControl = new FormControl<string[]>([]);
  selectedRatingControl = new FormControl(0);
  sortByControl = new FormControl('relevance');
  
  // Use signals
  categories = signal<Category[]>([]);
  hasActiveFilters = signal<boolean>(false);
  isScrolled = signal<boolean>(false);
  categoriesLoaded = signal<boolean>(false);

  get searchQuery(): string {
    return this.searchQueryControl.value || '';
  }

  set searchQuery(value: string) {
    this.searchQueryControl.setValue(value);
  }

  constructor() {
    // Use effect to react to input changes - wait for categories to load first
    effect(() => {
      // Wait for categories to be loaded before setting filter values
      if (!this.categoriesLoaded()) {
        return;
      }

      const searchQuery = this.initialSearchQuery();
      const categories = this.initialCategories();
      const businessType = this.initialBusinessType();
      const countries = this.initialCountries();
      const rating = this.initialRating();
      const sortBy = this.initialSortBy();

      // Set values without emitting events to avoid triggering search
      if (searchQuery !== this.searchQueryControl.value) {
        this.searchQueryControl.setValue(searchQuery, { emitEvent: false });
      }
      
      if (JSON.stringify(categories) !== JSON.stringify(this.selectedCategoriesControl.value)) {
        this.selectedCategoriesControl.setValue(categories, { emitEvent: false });
      }
      
      if (businessType !== this.businessTypeControl.value) {
        this.businessTypeControl.setValue(businessType, { emitEvent: false });
      }
      
      if (JSON.stringify(countries) !== JSON.stringify(this.selectedCountriesControl.value)) {
        this.selectedCountriesControl.setValue(countries, { emitEvent: false });
      }
      
      if (rating !== this.selectedRatingControl.value) {
        this.selectedRatingControl.setValue(rating, { emitEvent: false });
      }
      
      if (sortBy !== this.sortByControl.value) {
        this.sortByControl.setValue(sortBy, { emitEvent: false });
      }

      // Update active filters state after setting all values
      this.updateActiveFiltersState();
    });
  }

  ngOnInit() {
    this.loadCategories();

    // Watch for changes in any control
    this.searchQueryControl.valueChanges.subscribe(() => this.updateActiveFiltersState());
    this.selectedCategoriesControl.valueChanges.subscribe(() => this.updateActiveFiltersState());
    this.businessTypeControl.valueChanges.subscribe(() => this.updateActiveFiltersState());
    this.selectedCountriesControl.valueChanges.subscribe(() => this.updateActiveFiltersState());
    this.selectedRatingControl.valueChanges.subscribe(() => this.updateActiveFiltersState());
    this.sortByControl.valueChanges.subscribe(() => this.updateActiveFiltersState());

    // Listen to scroll events for shadow effect
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }
  }

  ngAfterViewInit() {
    // Not needed
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll.bind(this));
    }
  }

  handleScroll() {
    const scrollPosition = window.scrollY;
    // Show shadow when scrolled more than 10px
    this.isScrolled.set(scrollPosition > 10);
  }

  async loadCategories() {
    try {
      const response = await this.categoryService.getCategories().toPromise();
      if (response?.success && response.data) {
        // Filter only active categories
        const activeCategories = response.data.filter(cat => cat.is_active);
        this.categories.set(activeCategories);
        this.categoriesLoaded.set(true); // Mark as loaded
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  onFilterChange(): void {
    const filters: SearchFilters = {
      searchQuery: this.searchQueryControl.value || '',
      selectedCategories: this.selectedCategoriesControl.value || [],
      businessType: this.businessTypeControl.value || '',
      selectedCountries: this.selectedCountriesControl.value || [],
      selectedRating: this.selectedRatingControl.value || 0,
      sortBy: this.sortByControl.value || 'relevance'
    };
    this.filtersChange.emit(filters);
  }

  onSearchChange(query: string): void {
    this.searchQueryControl.setValue(query);
    this.onFilterChange();
  }

  onSortChange(sortValue: string): void {
    this.sortByControl.setValue(sortValue);
    this.onFilterChange();
  }

  getSortLabel(): string {
    const sortValue = this.sortByControl.value || 'relevance';
    const labels: { [key: string]: string } = {
      'relevance': 'Relevance',
      'best_selling': 'Best selling',
      'newest': 'Newest arrivals',
      'price_low': 'Price: Low to High',
      'price_high': 'Price: High to Low',
      'rating': 'Highest Rated'
    };
    return labels[sortValue] || 'Relevance';
  }

  openMobileSortSheet(): void {
    const bottomSheetRef = this.bottomSheet.open(MobileSortSheetComponent, {
      data: { currentSort: this.sortByControl.value },
      panelClass: 'mobile-sort-bottom-sheet'
    });

    bottomSheetRef.afterDismissed().subscribe(result => {
      if (result) {
        this.onSortChange(result);
      }
    });
  }

  openMobileFilterSheet(): void {
    const bottomSheetRef = this.bottomSheet.open(MobileFilterSheetComponent, {
      data: {
        categories: this.categories(),
        countries: this.countries(),
        selectedCategories: this.selectedCategoriesControl.value || [],
        businessType: this.businessTypeControl.value || '',
        selectedCountries: this.selectedCountriesControl.value || [],
        selectedRating: this.selectedRatingControl.value || 0
      },
      panelClass: 'mobile-filter-bottom-sheet'
    });

    bottomSheetRef.afterDismissed().subscribe(result => {
      if (result) {
        this.selectedCategoriesControl.setValue(result.selectedCategories);
        this.businessTypeControl.setValue(result.businessType);
        this.selectedCountriesControl.setValue(result.selectedCountries);
        this.selectedRatingControl.setValue(result.selectedRating);
        this.onFilterChange();
      }
    });
  }

  clearFilters(): void {
    this.searchQueryControl.setValue('');
    this.selectedCategoriesControl.setValue([]);
    this.businessTypeControl.setValue('');
    this.selectedCountriesControl.setValue([]);
    this.selectedRatingControl.setValue(0);
    this.sortByControl.setValue('relevance');
    this.onFilterChange();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedCategoriesControl.value && this.selectedCategoriesControl.value.length > 0) count++;
    if (this.businessTypeControl.value && this.businessTypeControl.value !== '') count++;
    if (this.selectedCountriesControl.value && this.selectedCountriesControl.value.length > 0) count++;
    if (this.selectedRatingControl.value !== null && this.selectedRatingControl.value > 0) count++;
    return count;
  }

  private updateActiveFiltersState(): void {
    const hasFilters = 
      (this.searchQueryControl.value && this.searchQueryControl.value.trim().length > 0) ||
      (this.selectedCategoriesControl.value && this.selectedCategoriesControl.value.length > 0) ||
      (this.businessTypeControl.value && this.businessTypeControl.value !== '') ||
      (this.selectedCountriesControl.value && this.selectedCountriesControl.value.length > 0) ||
      (this.selectedRatingControl.value !== null && this.selectedRatingControl.value > 0);
    
    this.hasActiveFilters.set(!!hasFilters);
  }
}

import { Component, signal, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { COUNTRIES, Country } from '../../data/countries';
import { Search } from "../search/search";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from '@angular/material/menu';
import { SearchFiltersComponent, SearchFilters } from '../search-filters/search-filters.component';
import { Category } from '../../services/category-new.service';

@Component({
  selector: 'hero-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    Search,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    SearchFiltersComponent
],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  @ViewChild(SearchFiltersComponent) searchFiltersComponent!: SearchFiltersComponent;

  searchForm!: FormGroup;
  currentFilters: SearchFilters = {};

  // Use the full countries list
  countries = COUNTRIES;

  ngOnInit() {
    this.searchForm = this.fb.group({
      searchQuery: ['']
    });
  }

  onFiltersChanged(filters: SearchFilters) {
    this.currentFilters = filters;
  }

  onCategorySelected(category: Category) {
    // When a category is selected, trigger search immediately
    const searchQuery = this.searchForm.get('searchQuery')?.value?.trim();
    
    const queryParams: any = {};
    
    if (searchQuery) {
      queryParams.q = searchQuery;
    }
    
    if (category._id) {
      queryParams.category = category._id;
    }

    // Navigate to search page with category
    this.router.navigate(['/search'], { queryParams });
  }

  onSearchQueryChange(query: string) {
    this.searchForm.patchValue({ searchQuery: query });
  }

  onSearch() {
    const searchQuery = this.searchForm.get('searchQuery')?.value?.trim();
    const filters = this.searchFiltersComponent?.getFormValue() || {};

    // Build query params
    const queryParams: any = {};
    
    if (searchQuery) {
      queryParams.q = searchQuery;
    }
    
    if (filters.category) {
      queryParams.category = filters.category;
    }

    // Only navigate if we have at least one search parameter
    if (Object.keys(queryParams).length > 0) {
      this.router.navigate(['/search'], { queryParams });
    }
  }

  onFindBusinesses() {
    this.onSearch();
  }

  onListBusiness() {
    this.router.navigate(['/list-business']);
  }
}
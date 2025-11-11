import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';

export interface FilterSheetData {
  categories: Array<{ _id: string; name: string }>;
  countries: Array<{ code: string; name: string }>;
  selectedCategories: string[];
  businessType: string;
  selectedCountries: string[];
  selectedRating: number;
}

@Component({
  selector: 'app-mobile-filter-sheet',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    FormsModule
  ],
  templateUrl: './mobile-filter-sheet.component.html',
  styleUrls: ['./mobile-filter-sheet.component.scss']
})
export class MobileFilterSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<MobileFilterSheetComponent>);

  // Filter states
  selectedCategories: string[] = [];
  businessType: string = '';
  selectedCountries: string[] = [];
  selectedRating: number = 0;

  // Options
  categories: Array<{ _id: string; name: string }> = [];
  countries: Array<{ code: string; name: string }> = [];

  businessTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'service', label: 'Services' },
    { value: 'product', label: 'Products' },
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

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: FilterSheetData) {
    if (data) {
      this.categories = data.categories || [];
      this.countries = data.countries || [];
      this.selectedCategories = [...(data.selectedCategories || [])];
      this.businessType = data.businessType || '';
      this.selectedCountries = [...(data.selectedCountries || [])];
      this.selectedRating = data.selectedRating || 0;
    }
  }

  // Category checkbox handlers
  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  onCategoryChange(categoryId: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedCategories.includes(categoryId)) {
        this.selectedCategories.push(categoryId);
      }
    } else {
      this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    }
  }

  // Country checkbox handlers
  isCountrySelected(countryName: string): boolean {
    return this.selectedCountries.includes(countryName);
  }

  onCountryChange(countryName: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedCountries.includes(countryName)) {
        this.selectedCountries.push(countryName);
      }
    } else {
      this.selectedCountries = this.selectedCountries.filter(name => name !== countryName);
    }
  }

  // Business type radio handler
  onBusinessTypeChange(value: string): void {
    this.businessType = value;
  }

  // Rating radio handler
  onRatingChange(value: number): void {
    this.selectedRating = value;
  }

  // Get active filter count
  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedCategories.length > 0) count++;
    if (this.businessType && this.businessType !== '') count++;
    if (this.selectedCountries.length > 0) count++;
    if (this.selectedRating > 0) count++;
    return count;
  }

  // Clear all filters
  clearAll(): void {
    this.selectedCategories = [];
    this.businessType = '';
    this.selectedCountries = [];
    this.selectedRating = 0;
  }

  // Apply filters and close
  showResults(): void {
    this.bottomSheetRef.dismiss({
      selectedCategories: this.selectedCategories,
      businessType: this.businessType,
      selectedCountries: this.selectedCountries,
      selectedRating: this.selectedRating
    });
  }

  // Close without applying
  close(): void {
    this.bottomSheetRef.dismiss();
  }
}

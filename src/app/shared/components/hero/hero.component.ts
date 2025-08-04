import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { COUNTRIES, Country } from '../../data/countries';

@Component({
  selector: 'hero-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  searchForm!: FormGroup;

  // Use the full countries list
  countries = COUNTRIES;

  ngOnInit() {
    this.searchForm = this.fb.group({
      searchQuery: [''],
      selectedCountries: [[]]
    });
  }

  get isFormValid(): boolean {
    return this.searchForm.valid && (
      this.searchForm.get('searchQuery')?.value?.trim() || 
      this.searchForm.get('selectedCountries')?.value?.length > 0
    );
  }

  get searchQueryControl() {
    return this.searchForm.get('searchQuery');
  }

  onSearch() {
    console.log('Search initiated with form:', this.isFormValid);
    if (!this.isFormValid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const formValue = this.searchForm.value;
    const queryParams: any = {};
    
    if (formValue.searchQuery?.trim()) {
      queryParams.q = formValue.searchQuery.trim();
    }
    
    if (formValue.selectedCountries && formValue.selectedCountries.length > 0) {
      // Convert country names to the format expected by the backend
      queryParams.countries = formValue.selectedCountries.join(',');
    }

    this.router.navigate(['/search'], { queryParams });
  }

  onPopularSearch(searchTerm: string) {
    this.searchForm.patchValue({ searchQuery: searchTerm });
    // Mark the search query as touched to trigger validation
    this.searchForm.get('searchQuery')?.markAsTouched();
    this.onSearch();
  }
}
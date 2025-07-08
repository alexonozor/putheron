import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Country } from '../../models';

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

  countries: Country[] = [
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
    { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
    { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
    { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
    { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' }
  ];

  ngOnInit() {
    this.searchForm = this.fb.group({
      searchQuery: ['', [Validators.required, Validators.minLength(2)]],
      selectedCountries: [[]]
    });
  }

  get isFormValid(): boolean {
    return this.searchForm.valid;
  }

  get searchQueryControl() {
    return this.searchForm.get('searchQuery');
  }

  onSearch() {
    if (!this.searchForm.valid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const formValue = this.searchForm.value;
    const queryParams: any = {};
    
    if (formValue.searchQuery) {
      queryParams.q = formValue.searchQuery;
    }
    
    if (formValue.selectedCountries && formValue.selectedCountries.length > 0) {
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
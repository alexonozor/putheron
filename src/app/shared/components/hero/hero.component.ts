import { Component, signal, OnInit, inject } from '@angular/core';
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
    MatMenuModule
],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  searchForm!: FormGroup;
  heroSearchQuery = signal<string>('');

  // Use the full countries list
  countries = COUNTRIES;

  ngOnInit() {
    this.searchForm = this.fb.group({
      searchQuery: ['']
    });
  }

  onSearch() {
    const searchQuery = this.heroSearchQuery()?.trim();

    // Build query params
    const queryParams: any = {};
    
    if (searchQuery) {
      queryParams.q = searchQuery;
    }

    // Only navigate if we have at least one search parameter
    if (Object.keys(queryParams).length > 0) {
      this.router.navigate(['/search'], { queryParams });
    }
  }

  onFindBusinesses() {
    // Navigate to search page to show all businesses
    this.router.navigate(['/search']);
  }

  onListBusiness() {
    this.router.navigate(['/list-business']);
  }
}
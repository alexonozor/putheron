import { Component, OnInit, inject, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { CategoryService, Category } from '../../services/category-new.service';

export interface SearchFilters {
  category?: string;
  categoryName?: string;
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
    MatChipsModule
  ],
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.scss']
})
export class SearchFiltersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);

  @Output() filtersChanged = new EventEmitter<SearchFilters>();
  @Output() categorySelected = new EventEmitter<Category>();

  filterForm!: FormGroup;
  
  // Use signals
  categories = signal<Category[]>([]);
  displayedCategories = signal<Category[]>([]);
  selectedCategoryName = signal<string>('Category');

  ngOnInit() {
    this.filterForm = this.fb.group({
      category: ['']
    });

    this.loadCategories();

    // Emit filter changes
    this.filterForm.valueChanges.subscribe(values => {
      this.filtersChanged.emit(values);
    });
  }

  async loadCategories() {
    try {
      const response = await this.categoryService.getCategories().toPromise();
      if (response?.success && response.data) {
        // Filter only active categories
        const activeCategories = response.data.filter(cat => cat.is_active);
        this.categories.set(activeCategories);
        
        // Set 4 random categories for display
        this.setRandomCategories(activeCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  private setRandomCategories(categories: Category[]) {
    // Shuffle and take first 4
    const shuffled = [...categories].sort(() => Math.random() - 0.5);
    this.displayedCategories.set(shuffled.slice(0, 4));
  }

  selectCategory(category: Category) {
    this.selectedCategoryName.set(category.name);
    this.filterForm.patchValue({ category: category._id });
    // Emit category selected event to trigger immediate search
    this.categorySelected.emit(category);
  }

  clearCategory() {
    this.selectedCategoryName.set('Category');
    this.filterForm.patchValue({ category: '' });
  }

  getFormValue(): SearchFilters {
    const value = this.filterForm.value;
    return {
      category: value.category,
      categoryName: this.selectedCategoryName()
    };
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriesService, Category, Subcategory } from '../../../../shared/services/categories.service';
import { CategoryFormModalComponent } from '../category-form-modal/category-form-modal.component';
import { SubcategoryFormModalComponent } from '../subcategory-form-modal/subcategory-form-modal.component';

@Component({
  selector: 'app-admin-categories-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryFormModalComponent, SubcategoryFormModalComponent],
  templateUrl: './admin-categories-list.component.html',
  styleUrl: './admin-categories-list.component.scss'
})
export class AdminCategoriesListComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly router = inject(Router);

  // Signals for reactive state
  categories = signal<(Category & { subcategories?: Subcategory[] })[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Filters
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  sortBy = signal<'name' | 'createdAt' | 'subcategory_count'>('name');
  sortOrder = signal<'asc' | 'desc'>('asc');

  // Selection
  selectedCategories = signal<Set<string>>(new Set());
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showCreateSubcategoryModal = signal(false);
  showEditSubcategoryModal = signal(false);
  selectedCategoryForSub = signal<string | null>(null);
  selectedCategoryForEdit = signal<Category | null>(null);
  selectedSubcategoryForEdit = signal<Subcategory | null>(null);

  // Computed values
  filteredCategories = computed(() => {
    let filtered = this.categories();
    
    // Apply search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.statusFilter() !== 'all') {
      const isActive = this.statusFilter() === 'active';
      filtered = filtered.filter(cat => cat.is_active === isActive);
    }

    // Apply sorting
    const sortField = this.sortBy();
    const order = this.sortOrder();
    
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'subcategory_count':
          aVal = a.subcategories?.length || 0;
          bVal = b.subcategories?.length || 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

  // Stats
  totalCategories = computed(() => this.categories().length);
  activeCategories = computed(() => this.categories().filter(cat => cat.is_active).length);
  totalSubcategories = computed(() => this.categories().reduce((total, cat) => total + (cat.subcategories?.length || 0), 0));
  
  // Categories for dropdown (without subcategories to avoid circular references)
  categoriesForDropdown = computed(() => this.categories().map(cat => ({ _id: cat._id, name: cat.name, slug: cat.slug, is_active: cat.is_active, createdAt: cat.createdAt, updatedAt: cat.updatedAt, description: cat.description, icon: cat.icon, sort_order: cat.sort_order, meta_title: cat.meta_title, meta_description: cat.meta_description })));

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const categoriesWithSubs = await this.categoriesService.getCategoriesWithSubcategories();
      this.categories.set(categoriesWithSubs);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      this.error.set('Failed to load categories. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // Navigation
  viewCategoryDetails(categoryId: string) {
    this.router.navigate(['/admin/dashboard/categories', categoryId]);
  }

  // Category operations
  openEditCategoryModal(category: Category) {
    this.selectedCategoryForEdit.set(category);
    this.showEditModal.set(true);
  }

  async onCategoryCreated(newCategory: Category) {
    // Reload categories to get the fresh data with subcategories
    await this.loadCategories();
  }

  async onCategoryUpdated(updatedCategory: Category) {
    // Update local state
    this.categories.update(cats => 
      cats.map(cat => cat._id === updatedCategory._id ? { ...updatedCategory, subcategories: cat.subcategories } : cat)
    );
  }

  async toggleCategoryStatus(category: Category) {
    try {
      const updatedCategory = await this.categoriesService.updateCategoryAsync(category._id, {
        is_active: !category.is_active
      });
      
      // Update local state
      this.categories.update(cats => 
        cats.map(cat => cat._id === category._id ? { ...cat, is_active: updatedCategory.is_active } : cat)
      );
    } catch (err: any) {
      console.error('Error updating category status:', err);
      this.error.set('Failed to update category status.');
    }
  }

  async deleteCategory(categoryId: string) {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await this.categoriesService.deleteCategoryAsync(categoryId);
      this.categories.update(cats => cats.filter(cat => cat._id !== categoryId));
    } catch (err: any) {
      console.error('Error deleting category:', err);
      this.error.set('Failed to delete category. Make sure there are no associated subcategories.');
    }
  }

  // Subcategory operations
  openCreateSubcategoryModal(categoryId: string) {
    this.selectedCategoryForSub.set(categoryId);
    this.showCreateSubcategoryModal.set(true);
  }

  openEditSubcategoryModal(subcategory: Subcategory) {
    this.selectedSubcategoryForEdit.set(subcategory);
    this.showEditSubcategoryModal.set(true);
  }

  async onSubcategoryCreated(newSubcategory: Subcategory) {
    // Add the new subcategory to the appropriate category
    const categoryId = typeof newSubcategory.category_id === 'string' 
      ? newSubcategory.category_id 
      : newSubcategory.category_id._id;

    this.categories.update(cats => 
      cats.map(cat => {
        if (cat._id === categoryId) {
          return {
            ...cat,
            subcategories: [...(cat.subcategories || []), newSubcategory]
          };
        }
        return cat;
      })
    );
  }

  async onSubcategoryUpdated(updatedSubcategory: Subcategory) {
    // Update the subcategory in the appropriate category
    const categoryId = typeof updatedSubcategory.category_id === 'string' 
      ? updatedSubcategory.category_id 
      : updatedSubcategory.category_id._id;

    this.categories.update(cats => 
      cats.map(cat => {
        if (cat._id === categoryId) {
          return {
            ...cat,
            subcategories: cat.subcategories?.map(sub => 
              sub._id === updatedSubcategory._id ? updatedSubcategory : sub
            )
          };
        }
        return cat;
      })
    );
  }

  async toggleSubcategoryStatus(subcategory: Subcategory) {
    try {
      const updatedSubcategory = await this.categoriesService.updateSubcategoryAsync(subcategory._id, {
        is_active: !subcategory.is_active
      });
      
      // Update local state
      this.categories.update(cats => 
        cats.map(cat => ({
          ...cat,
          subcategories: cat.subcategories?.map(sub => 
            sub._id === subcategory._id ? { ...sub, is_active: updatedSubcategory.is_active } : sub
          )
        }))
      );
    } catch (err: any) {
      console.error('Error updating subcategory status:', err);
      this.error.set('Failed to update subcategory status.');
    }
  }

  async deleteSubcategory(subcategoryId: string) {
    if (!confirm('Are you sure you want to delete this subcategory? This action cannot be undone.')) {
      return;
    }

    try {
      await this.categoriesService.deleteSubcategoryAsync(subcategoryId);
      
      // Update local state
      this.categories.update(cats => 
        cats.map(cat => ({
          ...cat,
          subcategories: cat.subcategories?.filter(sub => sub._id !== subcategoryId)
        }))
      );
    } catch (err: any) {
      console.error('Error deleting subcategory:', err);
      this.error.set('Failed to delete subcategory.');
    }
  }

  // Bulk operations
  toggleCategorySelection(categoryId: string) {
    const selected = new Set(this.selectedCategories());
    if (selected.has(categoryId)) {
      selected.delete(categoryId);
    } else {
      selected.add(categoryId);
    }
    this.selectedCategories.set(selected);
  }

  selectAllCategories() {
    const allIds = this.filteredCategories().map(cat => cat._id);
    this.selectedCategories.set(new Set(allIds));
  }

  deselectAllCategories() {
    this.selectedCategories.set(new Set());
  }

  async bulkToggleStatus() {
    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    try {
      const promises = selectedIds.map(async (id) => {
        const category = this.categories().find(cat => cat._id === id);
        if (category) {
          return this.categoriesService.updateCategoryAsync(id, {
            is_active: !category.is_active
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      await this.loadCategories();
      this.selectedCategories.set(new Set());
    } catch (err: any) {
      console.error('Error bulk updating categories:', err);
      this.error.set('Failed to update categories.');
    }
  }

  async bulkDelete() {
    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} categories? This action cannot be undone.`)) {
      return;
    }

    try {
      const promises = selectedIds.map(id => this.categoriesService.deleteCategoryAsync(id));
      await Promise.all(promises);
      await this.loadCategories();
      this.selectedCategories.set(new Set());
    } catch (err: any) {
      console.error('Error bulk deleting categories:', err);
      this.error.set('Failed to delete categories.');
    }
  }

  // Utility methods
  formatDate(date: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(cat => cat._id === categoryId);
    return category?.name || 'Unknown Category';
  }

  // Filter and sort handlers
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value as 'all' | 'active' | 'inactive');
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const [field, order] = target.value.split('-');
    this.sortBy.set(field as 'name' | 'createdAt' | 'subcategory_count');
    this.sortOrder.set(order as 'asc' | 'desc');
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriesService, Category, Subcategory, UpdateCategoryDto, CreateSubcategoryDto, UpdateSubcategoryDto } from '../../../../shared/services/categories.service';
import { SubcategoryFormModalComponent } from '../subcategory-form-modal/subcategory-form-modal.component';

@Component({
  selector: 'app-admin-category-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SubcategoryFormModalComponent],
  templateUrl: './admin-category-details.component.html',
  styleUrl: './admin-category-details.component.scss'
})
export class AdminCategoryDetailsComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Signals
  category = signal<Category | null>(null);
  subcategories = signal<Subcategory[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  isEditing = signal(false);
  
  // Form
  categoryForm: FormGroup;

  // Modals
  showCreateSubcategoryModal = signal(false);
  showEditSubcategoryModal = signal(false);
  selectedSubcategory = signal<Subcategory | null>(null);

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      icon: [''],
      is_active: [true],
      sort_order: [0],
      meta_title: [''],
      meta_description: ['']
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadCategory(id);
    }
  }

  async loadCategory(id: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [category, subcategories] = await Promise.all([
        this.categoriesService.getCategoryAsync(id),
        this.categoriesService.getSubcategoriesByCategoryAsync(id)
      ]);

      this.category.set(category);
      this.subcategories.set(subcategories);
      this.populateForm(category);
    } catch (err: any) {
      console.error('Error loading category:', err);
      this.error.set('Failed to load category details. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  populateForm(category: Category) {
    this.categoryForm.patchValue({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      is_active: category.is_active,
      sort_order: category.sort_order || 0,
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || ''
    });
  }

  onNameChange() {
    const nameControl = this.categoryForm.get('name');
    const slugControl = this.categoryForm.get('slug');
    
    if (nameControl && slugControl && nameControl.value) {
      const slug = this.categoriesService.generateSlug(nameControl.value);
      slugControl.setValue(slug);
    }
  }

  async saveCategory() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const category = this.category();
    if (!category) return;

    this.loading.set(true);
    try {
      const formData = this.categoryForm.value as UpdateCategoryDto;
      const updatedCategory = await this.categoriesService.updateCategoryAsync(category._id, formData);
      
      this.category.set(updatedCategory);
      this.isEditing.set(false);
      this.error.set(null);
    } catch (err: any) {
      console.error('Error updating category:', err);
      this.error.set('Failed to update category. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  cancelEdit() {
    const category = this.category();
    if (category) {
      this.populateForm(category);
    }
    this.isEditing.set(false);
  }

  async toggleCategoryStatus() {
    const category = this.category();
    if (!category) return;

    try {
      const updatedCategory = await this.categoriesService.updateCategoryAsync(category._id, {
        is_active: !category.is_active
      });
      this.category.set(updatedCategory);
    } catch (err: any) {
      console.error('Error toggling category status:', err);
      this.error.set('Failed to update category status.');
    }
  }

  async deleteCategory() {
    const category = this.category();
    if (!category) return;

    if (!confirm('Are you sure you want to delete this category? This action cannot be undone and will also delete all associated subcategories.')) {
      return;
    }

    try {
      await this.categoriesService.deleteCategoryAsync(category._id);
      this.goBack();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      this.error.set('Failed to delete category. Make sure there are no associated businesses or services.');
    }
  }

  // Subcategory operations
  async toggleSubcategoryStatus(subcategory: Subcategory) {
    try {
      const updated = await this.categoriesService.updateSubcategoryAsync(subcategory._id, {
        is_active: !subcategory.is_active
      });
      
      this.subcategories.update(subs => 
        subs.map(sub => sub._id === subcategory._id ? updated : sub)
      );
    } catch (err: any) {
      console.error('Error toggling subcategory status:', err);
      this.error.set('Failed to update subcategory status.');
    }
  }

  async deleteSubcategory(subcategoryId: string) {
    if (!confirm('Are you sure you want to delete this subcategory? This action cannot be undone.')) {
      return;
    }

    try {
      await this.categoriesService.deleteSubcategoryAsync(subcategoryId);
      this.subcategories.update(subs => subs.filter(sub => sub._id !== subcategoryId));
    } catch (err: any) {
      console.error('Error deleting subcategory:', err);
      this.error.set('Failed to delete subcategory.');
    }
  }

  editSubcategory(subcategory: Subcategory) {
    this.selectedSubcategory.set(subcategory);
    this.showEditSubcategoryModal.set(true);
  }

  // Modal event handlers
  async onSubcategoryCreated(newSubcategory: Subcategory) {
    // Add the new subcategory to the list
    this.subcategories.update(subs => [...subs, newSubcategory]);
    this.showCreateSubcategoryModal.set(false);
  }

  async onSubcategoryUpdated(updatedSubcategory: Subcategory) {
    // Update the subcategory in the list
    this.subcategories.update(subs => 
      subs.map(sub => sub._id === updatedSubcategory._id ? updatedSubcategory : sub)
    );
    this.showEditSubcategoryModal.set(false);
    this.selectedSubcategory.set(null);
  }

  onSubcategoryModalClosed() {
    this.showCreateSubcategoryModal.set(false);
    this.showEditSubcategoryModal.set(false);
    this.selectedSubcategory.set(null);
  }

  goBack() {
    this.router.navigate(['/admin/dashboard/categories']);
  }

  // Utility methods
  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.categoryForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return null;
  }

  // Computed values
  activeSubcategoriesCount = computed(() => 
    this.subcategories().filter(sub => sub.is_active).length
  );

  inactiveSubcategoriesCount = computed(() => 
    this.subcategories().filter(sub => !sub.is_active).length
  );
}

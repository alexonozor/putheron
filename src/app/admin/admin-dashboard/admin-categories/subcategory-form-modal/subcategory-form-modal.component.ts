import { Component, inject, signal, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoriesService, Category, Subcategory, CreateSubcategoryDto, UpdateSubcategoryDto } from '../../../../shared/services/categories.service';

@Component({
  selector: 'app-subcategory-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subcategory-form-modal.component.html',
  styleUrl: './subcategory-form-modal.component.scss'
})
export class SubcategoryFormModalComponent implements OnInit, OnChanges {
  private readonly categoriesService = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() subcategory: Subcategory | null = null; // null for create, subcategory object for edit
  @Input() categories: Category[] = [];
  @Input() selectedCategoryId: string | null = null; // for creating under a specific category
  @Output() close = new EventEmitter<void>();
  @Output() subcategoryCreated = new EventEmitter<Subcategory>();
  @Output() subcategoryUpdated = new EventEmitter<Subcategory>();

  subcategoryForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.subcategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      slug: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      icon: [''],
      image_url: [''],
      category_id: ['', [Validators.required]],
      is_active: [true],
      sort_order: [0, [Validators.min(0)]],
      meta_title: ['', [Validators.maxLength(200)]],
      meta_description: ['', [Validators.maxLength(300)]]
    });
  }

  ngOnInit() {
    this.setupForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['subcategory'] || changes['isOpen'] || changes['selectedCategoryId']) {
      this.setupForm();
    }
  }

  setupForm() {
    if (this.subcategory) {
      // Edit mode - populate form with existing subcategory data
      const categoryId = typeof this.subcategory.category_id === 'string' 
        ? this.subcategory.category_id 
        : this.subcategory.category_id._id;

      this.subcategoryForm.patchValue({
        name: this.subcategory.name,
        slug: this.subcategory.slug,
        description: this.subcategory.description || '',
        icon: this.subcategory.icon || '',
        image_url: this.subcategory.image_url || '',
        category_id: categoryId,
        is_active: this.subcategory.is_active,
        sort_order: this.subcategory.sort_order || 0,
        meta_title: this.subcategory.meta_title || '',
        meta_description: this.subcategory.meta_description || ''
      });
    } else {
      // Create mode - reset form
      this.subcategoryForm.reset({
        name: '',
        slug: '',
        description: '',
        icon: '',
        image_url: '',
        category_id: this.selectedCategoryId || '',
        is_active: true,
        sort_order: 0,
        meta_title: '',
        meta_description: ''
      });
    }
    this.error.set(null);
  }

  onNameChange() {
    const nameControl = this.subcategoryForm.get('name');
    const slugControl = this.subcategoryForm.get('slug');
    
    if (nameControl && slugControl && nameControl.value && !this.subcategory) {
      // Only auto-generate slug for new subcategories
      const slug = this.categoriesService.generateSlug(nameControl.value);
      slugControl.setValue(slug);
    }
  }

  async onSubmit() {
    if (this.subcategoryForm.invalid) {
      this.subcategoryForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const formData = this.subcategoryForm.value;

      if (this.subcategory) {
        // Update existing subcategory
        const updatedSubcategory = await this.categoriesService.updateSubcategoryAsync(
          this.subcategory._id,
          formData as UpdateSubcategoryDto
        );
        this.subcategoryUpdated.emit(updatedSubcategory);
      } else {
        // Create new subcategory
        const newSubcategory = await this.categoriesService.createSubcategoryAsync(
          formData as CreateSubcategoryDto
        );
        this.subcategoryCreated.emit(newSubcategory);
      }

      this.closeModal();
    } catch (err: any) {
      console.error('Error saving subcategory:', err);
      this.error.set(
        err.error?.message || 
        `Failed to ${this.subcategory ? 'update' : 'create'} subcategory. Please try again.`
      );
    } finally {
      this.loading.set(false);
    }
  }

  closeModal() {
    this.subcategoryForm.reset();
    this.error.set(null);
    this.close.emit();
  }

  getFieldError(fieldName: string): string | null {
    const field = this.subcategoryForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['min'].min}`;
      }
    }
    return null;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      name: 'Subcategory name',
      slug: 'Slug',
      description: 'Description',
      category_id: 'Category',
      sort_order: 'Sort order',
      meta_title: 'Meta title',
      meta_description: 'Meta description',
      image_url: 'Image URL'
    };
    return displayNames[fieldName] || fieldName;
  }

  get isEditMode(): boolean {
    return !!this.subcategory;
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Edit Subcategory' : 'Create New Subcategory';
  }

  get submitButtonText(): string {
    if (this.loading()) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update Subcategory' : 'Create Subcategory';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(cat => cat._id === categoryId);
    return category?.name || 'Unknown Category';
  }
}

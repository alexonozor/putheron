import { Component, inject, signal, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoriesService, Category, CreateCategoryDto, UpdateCategoryDto } from '../../../../shared/services/categories.service';

@Component({
  selector: 'app-category-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form-modal.component.html',
  styleUrl: './category-form-modal.component.scss'
})
export class CategoryFormModalComponent implements OnInit, OnChanges {
  private readonly categoriesService = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() category: Category | null = null; // null for create, category object for edit
  @Input() isSubmitting = false;
  @Output() close = new EventEmitter<void>();
  @Output() categoryCreated = new EventEmitter<Category>();
  @Output() categoryUpdated = new EventEmitter<Category>();

  categoryForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);

  // Icon options for dropdown
  iconOptions = [
    { value: '', label: 'No Icon' },
    { value: 'fas fa-laptop-code', label: 'Technology' },
    { value: 'fas fa-briefcase', label: 'Business & Finance' },
    { value: 'fas fa-paint-brush', label: 'Creative Arts' },
    { value: 'fas fa-heart', label: 'Health & Wellness' },
    { value: 'fas fa-graduation-cap', label: 'Education & Training' },
    { value: 'fas fa-home', label: 'Home & Garden' },
    { value: 'fas fa-car', label: 'Automotive' },
    { value: 'fas fa-utensils', label: 'Food & Beverage' },
    { value: 'fas fa-plane', label: 'Travel & Tourism' },
    { value: 'fas fa-music', label: 'Entertainment' },
    { value: 'fas fa-dumbbell', label: 'Sports & Fitness' },
    { value: 'fas fa-shopping-bag', label: 'Retail & Shopping' }
  ];

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      slug: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      icon: [''],
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
    if (changes['category'] || changes['isOpen']) {
      this.setupForm();
    }
  }

  setupForm() {
    if (this.category) {
      // Edit mode - populate form with existing category data
      this.categoryForm.patchValue({
        name: this.category.name,
        slug: this.category.slug,
        description: this.category.description || '',
        icon: this.category.icon || '',
        is_active: this.category.is_active,
        sort_order: this.category.sort_order || 0,
        meta_title: this.category.meta_title || '',
        meta_description: this.category.meta_description || ''
      });
    } else {
      // Create mode - reset form
      this.categoryForm.reset({
        name: '',
        slug: '',
        description: '',
        icon: '',
        is_active: true,
        sort_order: 0,
        meta_title: '',
        meta_description: ''
      });
    }
    this.error.set(null);
  }

  onNameChange() {
    const nameControl = this.categoryForm.get('name');
    const slugControl = this.categoryForm.get('slug');
    
    if (nameControl && slugControl && nameControl.value && !this.category) {
      // Only auto-generate slug for new categories
      const slug = this.categoriesService.generateSlug(nameControl.value);
      slugControl.setValue(slug);
    }
  }

  async onSubmit() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const formData = this.categoryForm.value;

      if (this.category) {
        // Update existing category
        const updatedCategory = await this.categoriesService.updateCategoryAsync(
          this.category._id,
          formData as UpdateCategoryDto
        );
        this.categoryUpdated.emit(updatedCategory);
      } else {
        // Create new category
        const newCategory = await this.categoriesService.createCategoryAsync(
          formData as CreateCategoryDto
        );
        this.categoryCreated.emit(newCategory);
      }

      this.closeModal();
    } catch (err: any) {
      console.error('Error saving category:', err);
      this.error.set(
        err.error?.message || 
        `Failed to ${this.category ? 'update' : 'create'} category. Please try again.`
      );
    } finally {
      this.loading.set(false);
    }
  }

  closeModal() {
    this.categoryForm.reset();
    this.error.set(null);
    this.close.emit();
  }

  getFieldError(fieldName: string): string | null {
    const field = this.categoryForm.get(fieldName);
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
      name: 'Category name',
      slug: 'Slug',
      description: 'Description',
      sort_order: 'Sort order',
      meta_title: 'Meta title',
      meta_description: 'Meta description'
    };
    return displayNames[fieldName] || fieldName;
  }

  get isEditMode(): boolean {
    return !!this.category;
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Edit Category' : 'Create New Category';
  }

  get submitButtonText(): string {
    if (this.loading()) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update Category' : 'Create Category';
  }
}

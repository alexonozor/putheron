import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../shared/services/auth.service';
import { BusinessService, Category, Subcategory, CreateBusinessDto } from '../../../shared/services/business.service';

@Component({
  selector: 'app-create-business',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatStepperModule,
    MatCheckboxModule
  ],
  templateUrl: './create-business.component.html',
  styleUrl: './create-business.component.scss'
})
export class CreateBusinessComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private businessService = inject(BusinessService);

  // Signals
  public categories = signal<Category[]>([]);
  public subcategories = signal<Subcategory[]>([]);
  public loading = signal(false);
  public submitting = signal(false);
  public error = signal<string | null>(null);

  // Forms
  public businessInfoForm: FormGroup;
  public businessDetailsForm: FormGroup;

  constructor() {
    this.businessInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      short_description: [''],
      business_type: ['service', Validators.required],
      category_id: ['', Validators.required],
      subcategory_id: ['']
    });

    this.businessDetailsForm = this.fb.group({
      address: [''],
      city: [''],
      state: [''],
      country: [''],
      postal_code: [''],
      contact_email: ['', [Validators.email]],
      contact_phone: [''],
      website_url: [''],
      logo_url: ['']
    });
  }

  ngOnInit() {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth'], {
        queryParams: { 
          message: 'Please log in to create a business'
        }
      });
      return;
    }

    this.loadCategories();
  }

  async loadCategories() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const categories = await this.businessService.getCategoriesAsync();
      this.categories.set(categories);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      this.error.set('Failed to load categories. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async onCategoryChange(categoryId: string) {
    if (!categoryId) {
      this.subcategories.set([]);
      this.businessInfoForm.patchValue({ subcategory_id: '' });
      return;
    }

    try {
      const subcategories = await this.businessService.getSubcategoriesAsync(categoryId);
      this.subcategories.set(subcategories);
    } catch (err: any) {
      console.error('Error loading subcategories:', err);
      this.error.set('Failed to load subcategories. Please try again.');
    }
  }

  async submitBusiness() {
    if (this.businessInfoForm.invalid || this.businessDetailsForm.invalid) {
      this.businessInfoForm.markAllAsTouched();
      this.businessDetailsForm.markAllAsTouched();
      this.error.set('Please fill in all required fields.');
      return;
    }

    const currentUser = this.authService.user();
    if (!currentUser) {
      this.router.navigate(['/auth']);
      return;
    }

    try {
      this.submitting.set(true);
      this.error.set(null);

      // Combine form data
      const businessData: CreateBusinessDto = {
        ...this.businessInfoForm.value,
        ...this.businessDetailsForm.value
      };

      // Remove empty subcategory_id if not selected
      if (!businessData.subcategory_id) {
        delete businessData.subcategory_id;
      }

      console.log('Creating business with data:', businessData);

      const createdBusiness = await this.businessService.createBusinessAsync(businessData);

      // Success! Navigate to the dashboard with success message
      this.router.navigate(['/dashboard'], {
        queryParams: { 
          message: 'Business created successfully! It is now pending approval.'
        }
      });

    } catch (err: any) {
      console.error('Error creating business:', err);
      this.error.set(err?.message || 'Failed to create business. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  // Stepper navigation helpers
  nextStep(stepper: any) {
    if (stepper.selectedIndex === 0 && this.businessInfoForm.invalid) {
      this.businessInfoForm.markAllAsTouched();
      return;
    }
    stepper.next();
  }

  previousStep(stepper: any) {
    stepper.previous();
  }

  goBack() {
    this.router.navigate(['/dashboard/businesses']);
  }

  loadData() {
    this.loadCategories();
  }

  // Form validation helpers
  isBusinessInfoValid(): boolean {
    return this.businessInfoForm.valid;
  }

  isBusinessDetailsValid(): boolean {
    return this.businessDetailsForm.valid;
  }

  // Utility methods
  getFieldError(formGroup: FormGroup, fieldName: string): string | null {
    const field = formGroup.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    if (field.errors['required']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field.errors['minlength']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }

    return 'This field is invalid';
  }
}

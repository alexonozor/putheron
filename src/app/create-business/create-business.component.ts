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
import { HeaderComponent } from '../shared/components/header/header.component';
import { AuthService } from '../shared/services/auth.service';
import { SupabaseService } from '../shared/services/supabase.service';
import { Tables, TablesInsert } from '../shared/types/database.types';

interface Category extends Tables<'categories'> {}
interface Subcategory extends Tables<'subcategories'> {}

@Component({
  selector: 'app-create-business',
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
    MatCheckboxModule,
    HeaderComponent
  ],
  templateUrl: './create-business.component.html',
  styleUrl: './create-business.component.scss'
})
export class CreateBusinessComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);

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
      business_type: ['service', Validators.required],
      category_id: ['', Validators.required],
      subcategory_id: ['']
    });

    this.businessDetailsForm = this.fb.group({
      address: [''],
      city: ['', Validators.required],
      state: [''],
      country: ['', Validators.required],
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
          action: 'login',
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

      const { data, error } = await this.supabaseService.getClient()
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        this.error.set('Failed to load categories');
        return;
      }

      this.categories.set(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      this.error.set('Failed to load categories');
    } finally {
      this.loading.set(false);
    }
  }

  async onCategoryChange(categoryId: string) {
    if (!categoryId) {
      this.subcategories.set([]);
      return;
    }

    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');

      if (error) {
        console.error('Error loading subcategories:', error);
        return;
      }

      this.subcategories.set(data || []);
    } catch (err) {
      console.error('Error loading subcategories:', err);
    }
  }

  async submitBusiness() {
    if (this.businessInfoForm.invalid || this.businessDetailsForm.invalid) {
      this.businessInfoForm.markAllAsTouched();
      this.businessDetailsForm.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.router.navigate(['/auth']);
      return;
    }

    // Debug logging
    console.log('Current user:', currentUser);
    console.log('Current user ID:', currentUser.id);
    console.log('User ID type:', typeof currentUser.id);
    console.log('User ID length:', currentUser.id?.length);

    try {
      this.submitting.set(true);
      this.error.set(null);

      // Combine form data
      const businessData: TablesInsert<'businesses'> = {
        ...this.businessInfoForm.value,
        ...this.businessDetailsForm.value,
        profile_id: currentUser.id,
        is_active: true
      };

      console.log('Business data being submitted:', businessData);
      console.log('Profile ID in business data:', businessData.profile_id);

      const { data, error } = await this.supabaseService.getClient()
        .from('businesses')
        .insert(businessData)
        .select()
        .single();

      if (error) {
        console.error('Error creating business:', error);
        this.error.set('Failed to create business. Please try again.');
        return;
      }

      // Success! Navigate to the business profile or dashboard
      this.router.navigate(['/business', data.id], {
        queryParams: { 
          message: 'Business created successfully!' 
        }
      });

    } catch (err) {
      console.error('Error creating business:', err);
      this.error.set('Failed to create business. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  // Stepper navigation
  nextStep(stepper: any) {
    stepper.next();
  }

  previousStep(stepper: any) {
    stepper.previous();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
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
}

import { Component, OnInit, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../shared/services/auth.service';
import { BusinessService, Category, Subcategory, CreateBusinessDto, UpdateBusinessDto, Business } from '../../../shared/services/business.service';

declare let google: any;

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
export class CreateBusinessComponent implements OnInit, AfterViewInit {
  @ViewChild('addressInput', { static: false }) addressInput!: ElementRef;
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private businessService = inject(BusinessService);

  private autocomplete: any;

  // Signals
  public categories = signal<Category[]>([]);
  public subcategories = signal<Subcategory[]>([]);
  public loading = signal(false);
  public submitting = signal(false);
  public error = signal<string | null>(null);
  public logoPreview = signal<string | null>(null);
  public bannerPreview = signal<string | null>(null);
  public sosCertificationPreview = signal<string | null>(null);
  public isEditMode = signal(false);
  public businessId = signal<string | null>(null);
  public currentBusiness = signal<Business | null>(null);

  // File storage
  public logoFile: File | null = null;
  public bannerFile: File | null = null;
  public sosCertificationFile: File | null = null;

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
      city: ['', Validators.required],
      state: ['', Validators.required],
      postal_code: ['', Validators.required],
      location: this.fb.group({
        type: ['Point'],
        coordinates: [null]
      }),
      contact_email: ['', [Validators.required, Validators.email]],
      contact_phone: ['', Validators.required],
      website: ['']
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

    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.businessId.set(id);
    }

    this.loadCategories();
    
    // Load business data if in edit mode
    if (this.isEditMode()) {
      this.loadBusinessForEdit();
    }
  }

  ngAfterViewInit() {
    // Initialize Google Places Autocomplete after view has loaded
    setTimeout(() => {
      this.initializeAutocomplete();
    }, 100);
  }

  private initializeAutocomplete() {
    if (typeof google !== 'undefined' && google.maps && google.maps.places && this.addressInput) {
      this.autocomplete = new google.maps.places.Autocomplete(
        this.addressInput.nativeElement,
        {
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'geometry', 'formatted_address'],
          types: ['establishment', 'geocode']
        }
      );

      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();
        if (place && place.address_components) {
          this.processPlaceData(place);
        }
      });
    } else {
      // Retry if Google Maps hasn't loaded yet
      setTimeout(() => this.initializeAutocomplete(), 200);
    }
  }

  private processPlaceData(place: any) {
    let street_number = '';
    let route = '';
    let city = '';
    let state = '';
    let postal_code = '';

    // Extract address components
    for (const component of place.address_components) {
      const types = component.types;
      
      if (types.includes('street_number')) {
        street_number = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('postal_code')) {
        postal_code = component.long_name;
      }
    }

    // Construct full address
    const address = `${street_number} ${route}`.trim();

    // Get coordinates
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();

    // Update form with the extracted data
    this.businessDetailsForm.patchValue({
      address: address || place.formatted_address,
      city: city,
      state: state,
      postal_code: postal_code,
      location: {
        type: 'Point',
        coordinates: lat && lng ? [lng, lat] : null
      }
    });

    // Make the fields disabled after autocomplete selection
    const cityControl = this.businessDetailsForm.get('city');
    const stateControl = this.businessDetailsForm.get('state');
    const postalCodeControl = this.businessDetailsForm.get('postal_code');
    
    if (cityControl) cityControl.disable();
    if (stateControl) stateControl.disable();
    if (postalCodeControl) postalCodeControl.disable();
  }

  // Handle place selected from Google Maps Autocomplete
  onLocationSelected(place: any) {
    // This method is kept for potential future use but the main logic is in processPlaceData
    console.log('onLocationSelected called:', place);
  }

  clearLocationData() {
    this.businessDetailsForm.patchValue({
      address: '',
      city: '',
      state: '',
      postal_code: '',
      location: {
        type: 'Point',
        coordinates: null
      }
    });

    // Re-enable fields for manual input
    const cityControl = this.businessDetailsForm.get('city');
    const stateControl = this.businessDetailsForm.get('state');
    const postalCodeControl = this.businessDetailsForm.get('postal_code');
    
    if (cityControl) cityControl.enable();
    if (stateControl) stateControl.enable();
    if (postalCodeControl) postalCodeControl.enable();
  }

  enableManualLocationEdit() {
    // Make the readonly fields editable
    const cityControl = this.businessDetailsForm.get('city');
    const stateControl = this.businessDetailsForm.get('state');
    const postalCodeControl = this.businessDetailsForm.get('postal_code');
    
    if (cityControl) cityControl.enable();
    if (stateControl) stateControl.enable();
    if (postalCodeControl) postalCodeControl.enable();
    
    // Show a brief feedback message
    console.log('Manual editing enabled for location fields');
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

  async loadBusinessForEdit() {
    const businessId = this.businessId();
    if (!businessId) return;

    try {
      this.loading.set(true);
      this.error.set(null);

      const business = await this.businessService.getBusinessAsync(businessId);
      if (!business) {
        this.error.set('Business not found.');
        this.router.navigate(['/dashboard/businesses/list']);
        return;
      }

      this.currentBusiness.set(business);

      // Populate forms with existing data
      this.businessInfoForm.patchValue({
        name: business.name,
        description: business.description,
        short_description: business.short_description || '',
        business_type: business.business_type,
        category_id: typeof business.category_id === 'string' ? business.category_id : business.category_id._id,
        subcategory_id: business.subcategory_id ? (typeof business.subcategory_id === 'string' ? business.subcategory_id : business.subcategory_id._id) : ''
      });

      this.businessDetailsForm.patchValue({
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        postal_code: business.postal_code || '',
        location: business.location || { type: 'Point', coordinates: null },
        contact_email: business.contact_email || '',
        contact_phone: business.contact_phone || '',
        website: business.website || ''
      });

      // Load subcategories for the selected category
      const categoryId = typeof business.category_id === 'string' ? business.category_id : business.category_id._id;
      if (categoryId) {
        await this.onCategoryChange(categoryId);
      }

      // Set image previews if they exist
      if (business.logo_url) {
        this.logoPreview.set(business.logo_url);
      }
      if (business.banner_url) {
        this.bannerPreview.set(business.banner_url);
      }
      if (business.sos_certification_url) {
        this.sosCertificationPreview.set(business.sos_certification_url);
      }

    } catch (err: any) {
      console.error('Error loading business for edit:', err);
      this.error.set('Failed to load business data. Please try again.');
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

      // Combine form data - use getRawValue() to include disabled fields
      const businessData: CreateBusinessDto | UpdateBusinessDto = {
        ...this.businessInfoForm.value,
        ...this.businessDetailsForm.getRawValue()
      };

      // Debug logging
      console.log('businessInfoForm.value:', this.businessInfoForm.value);
      console.log('businessDetailsForm.value:', this.businessDetailsForm.value);
      console.log('businessDetailsForm.getRawValue():', this.businessDetailsForm.getRawValue());
      console.log('Combined businessData:', businessData);

      // Remove empty subcategory_id if not selected
      if (!businessData.subcategory_id) {
        delete businessData.subcategory_id;
      }

      let businessResult: Business;

      if (this.isEditMode()) {
        // Update existing business
        const businessId = this.businessId();
        if (!businessId) {
          throw new Error('Business ID is required for update');
        }
        
        console.log('Updating business with data:', businessData);
        businessResult = await this.businessService.updateBusinessAsync(businessId, businessData as UpdateBusinessDto);
      } else {
        // Create new business
        console.log('Creating business with data:', businessData);
        businessResult = await this.businessService.createBusinessAsync(businessData as CreateBusinessDto);
      }

      // Upload images if selected
      if (this.logoFile) {
        try {
          await this.businessService.uploadLogoAsync(businessResult._id, this.logoFile);
        } catch (logoError) {
          console.warn('Failed to upload logo:', logoError);
          // Don't fail the entire process for logo upload
        }
      }

      if (this.bannerFile) {
        try {
          await this.businessService.uploadBannerAsync(businessResult._id, this.bannerFile);
        } catch (bannerError) {
          console.warn('Failed to upload banner:', bannerError);
          // Don't fail the entire process for banner upload
        }
      }

      if (this.sosCertificationFile) {
        try {
          await this.businessService.uploadSosCertificationAsync(businessResult._id, this.sosCertificationFile);
        } catch (sosCertificationError) {
          console.warn('Failed to upload SOS certification:', sosCertificationError);
          // Don't fail the entire process for SOS certification upload
        }
      }

      // Success! Navigate to the dashboard with success message
      const successMessage = this.isEditMode() 
        ? 'Business updated successfully!' 
        : 'Business created successfully! It is now pending approval.';
        
      this.router.navigate(['/dashboard/businesses/list'], {
        queryParams: { 
          message: successMessage
        }
      });

    } catch (err: any) {
      console.error(`Error ${this.isEditMode() ? 'updating' : 'creating'} business:`, err);
      const errorMessage = this.isEditMode() 
        ? 'Failed to update business. Please try again.'
        : 'Failed to create business. Please try again.';
      this.error.set(err?.message || errorMessage);
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
    if (stepper.selectedIndex === 1 && this.businessDetailsForm.invalid) {
      this.businessDetailsForm.markAllAsTouched();
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

  isAllFormsValid(): boolean {
    return this.businessInfoForm.valid && this.businessDetailsForm.valid;
  }

  // File upload methods
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error.set('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('Logo file size must be less than 5MB');
        return;
      }
      
      this.logoFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      this.error.set(null);
    }
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error.set('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('Banner file size must be less than 5MB');
        return;
      }
      
      this.bannerFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.bannerPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      this.error.set(null);
    }
  }

  removeLogoPreview(): void {
    this.logoFile = null;
    this.logoPreview.set(null);
  }

  removeBannerPreview(): void {
    this.bannerFile = null;
    this.bannerPreview.set(null);
  }

  onSosCertificationSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type (PDF, DOC, DOCX, JPG, PNG)
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.error.set('Please select a valid document file (PDF, DOC, DOCX, JPG, PNG)');
        return;
      }
      
      // Validate file size (10MB max for documents)
      if (file.size > 10 * 1024 * 1024) {
        this.error.set('SOS Certification file size must be less than 10MB');
        return;
      }
      
      this.sosCertificationFile = file;
      
      // Create preview for images, or show file name for documents
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.sosCertificationPreview.set(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For documents, just show the filename as preview
        this.sosCertificationPreview.set(file.name);
      }
      
      this.error.set(null);
    }
  }

  removeSosCertificationPreview(): void {
    this.sosCertificationFile = null;
    this.sosCertificationPreview.set(null);
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

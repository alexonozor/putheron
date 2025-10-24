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
import { MatRadioModule } from '@angular/material/radio';
import { AuthService } from '../../../shared/services/auth.service';
import { BusinessService, Category, Subcategory, CreateBusinessDto, UpdateBusinessDto, Business } from '../../../shared/services/business.service';
import { PhoneValidators } from '../../../shared/validators/phone.validator';
import { PhoneFormatDirective } from '../../../shared/directives/phone-format.directive';

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
    MatCheckboxModule,
    MatRadioModule,
    PhoneFormatDirective
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
  public sosCertificationPreviews = signal<{file: File | null, preview: string}[]>([]);
  public isEditMode = signal(false);
  public businessId = signal<string | null>(null);
  public currentBusiness = signal<Business | null>(null);

  // File storage
  public logoFile: File | null = null;
  public bannerFile: File | null = null;
  public sosCertificationFile: File | null = null;
  public sosCertificationFiles: File[] = [];

  // Forms
  public businessInfoForm: FormGroup;
  public businessDetailsForm: FormGroup;
  public businessComplianceForm: FormGroup;

  // US States list
  public usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

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
      contact_phone: ['', [Validators.required, PhoneValidators.usaPhone()]],
      website: ['']
    });

    this.businessComplianceForm = this.fb.group({
      business_stage: ['', Validators.required],
      business_hours: this.fb.group({
        monday: this.fb.group({ open: ['09:00'], close: ['17:00'], closed: [false] }),
        tuesday: this.fb.group({ open: ['09:00'], close: ['17:00'], closed: [false] }),
        wednesday: this.fb.group({ open: ['09:00'], close: ['17:00'], closed: [false] }),
        thursday: this.fb.group({ open: ['09:00'], close: ['17:00'], closed: [false] }),
        friday: this.fb.group({ open: ['09:00'], close: ['17:00'], closed: [false] }),
        saturday: this.fb.group({ open: ['09:00'], close: ['17:00'], closed: [true] }),
        sunday: this.fb.group({ open: ['09:00'], close: ['17:00'], closed: [true] })
      }),
      business_registered: [false],
      registered_state: [''],
      tax_id: ['', [Validators.pattern(/^(\d{3}-\d{2}-\d{4}|\d{2}-\d{7})$/)]],
      is_certified_wbe_mbe: [false],
      woman_owned_attestation: [false, Validators.requiredTrue]
    });

    // Watch for business_registered changes to add/remove registered_state validation
    this.businessComplianceForm.get('business_registered')?.valueChanges.subscribe(isRegistered => {
      const registeredStateControl = this.businessComplianceForm.get('registered_state');
      if (isRegistered) {
        registeredStateControl?.setValidators([Validators.required]);
      } else {
        registeredStateControl?.clearValidators();
      }
      registeredStateControl?.updateValueAndValidity();
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

      // Populate compliance form
      this.businessComplianceForm.patchValue({
        business_stage: business.business_stage || '',
        business_registered: business.business_registered || false,
        registered_state: business.registered_state || '',
        tax_id: business.tax_id || '',
        is_certified_wbe_mbe: business.is_certified_wbe_mbe || false,
        woman_owned_attestation: business.woman_owned_attestation || false
      });

      // Populate business hours if they exist
      if (business.business_hours) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
        days.forEach(day => {
          const dayData = business.business_hours?.[day];
          if (dayData) {
            const dayControl = this.businessComplianceForm.get(`business_hours.${day}`) as FormGroup;
            if (dayControl) {
              dayControl.patchValue({
                open: dayData.open || '',
                close: dayData.close || '',
                closed: dayData.closed || false
              });
            }
          }
        });
      }

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
      
      // Handle multiple SOS certification URLs
      if (business.sos_certification_urls && business.sos_certification_urls.length > 0) {
        const previews = business.sos_certification_urls.map(url => ({
          file: null as any, // URL-based previews don't have file objects
          preview: url
        }));
        this.sosCertificationPreviews.set(previews);
      } else if (business.sos_certification_url) {
        // Legacy single file support
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
    if (this.businessInfoForm.invalid || this.businessDetailsForm.invalid || this.businessComplianceForm.invalid) {
      this.businessInfoForm.markAllAsTouched();
      this.businessDetailsForm.markAllAsTouched();
      this.businessComplianceForm.markAllAsTouched();
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
        ...this.businessDetailsForm.getRawValue(),
        ...this.businessComplianceForm.value
      };

      // Debug logging
      console.log('businessInfoForm.value:', this.businessInfoForm.value);
      console.log('businessDetailsForm.value:', this.businessDetailsForm.value);
      console.log('businessDetailsForm.getRawValue():', this.businessDetailsForm.getRawValue());
      console.log('businessComplianceForm.value:', this.businessComplianceForm.value);
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

      // Upload multiple SOS certification files if available
      if (this.sosCertificationFiles.length > 0) {
        try {
          await this.businessService.uploadMultipleSosCertificationsAsync(businessResult._id, this.sosCertificationFiles);
        } catch (sosCertificationError) {
          console.warn('Failed to upload multiple SOS certifications:', sosCertificationError);
          // Don't fail the entire process for SOS certification upload
        }
      } else if (this.sosCertificationFile) {
        // Legacy single file upload for backward compatibility
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
    if (stepper.selectedIndex === 2 && this.businessComplianceForm.invalid) {
      this.businessComplianceForm.markAllAsTouched();
      return;
    }
    stepper.next();
  }

  previousStep(stepper: any) {
    stepper.previous();
  }

  goBack() {
    this.router.navigate(['/dashboard/businesses/list']);
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

  isBusinessComplianceValid(): boolean {
    return this.businessComplianceForm.valid;
  }

  isAllFormsValid(): boolean {
    return this.businessInfoForm.valid && this.businessDetailsForm.valid && this.businessComplianceForm.valid;
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
      // Process multiple files
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        
        // Validate file type (PDF, DOC, DOCX, JPG, PNG)
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
          this.error.set(`File "${file.name}" is not a valid document type (PDF, DOC, DOCX, JPG, PNG)`);
          continue;
        }
        
        // Validate file size (10MB max for documents)
        if (file.size > 10 * 1024 * 1024) {
          this.error.set(`File "${file.name}" size must be less than 10MB`);
          continue;
        }
        
        // Add to files array
        this.sosCertificationFiles.push(file);
        
        // Create preview for images, or show file name for documents
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const previews = this.sosCertificationPreviews();
            previews.push({
              file: file,
              preview: e.target?.result as string
            });
            this.sosCertificationPreviews.set([...previews]);
          };
          reader.readAsDataURL(file);
        } else {
          // For documents, just show the filename as preview
          const previews = this.sosCertificationPreviews();
          previews.push({
            file: file,
            preview: file.name
          });
          this.sosCertificationPreviews.set([...previews]);
        }
      }
      
      this.error.set(null);
    }
    
    // Clear the input to allow selecting the same files again
    input.value = '';
  }

  removeSosCertificationFile(previewToRemove: {file: File | null, preview: string}): void {
    // Remove from files array if it's an actual file
    if (previewToRemove.file) {
      const fileIndex = this.sosCertificationFiles.findIndex(f => f === previewToRemove.file);
      if (fileIndex > -1) {
        this.sosCertificationFiles.splice(fileIndex, 1);
      }
    }
    
    // Remove from previews
    const previews = this.sosCertificationPreviews().filter(p => p !== previewToRemove);
    this.sosCertificationPreviews.set(previews);
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
    if (field.errors['usaPhone']) {
      return field.errors['usaPhone'].message;
    }

    return 'This field is invalid';
  }

  // Form field getters
  get contact_phone() { return this.businessDetailsForm.get('contact_phone'); }
}

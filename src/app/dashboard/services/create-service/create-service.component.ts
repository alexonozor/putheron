import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthService } from '../../../shared/services/auth.service';
import { BusinessService, Business, CreateServiceDto, UpdateServiceDto, Service, PricingType } from '../../../shared/services/business.service';

@Component({
  selector: 'app-create-service',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatStepperModule
  ],
  templateUrl: './create-service.component.html',
  styleUrl: './create-service.component.scss'
})
export class CreateServiceComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly businessService = inject(BusinessService);
  private readonly fb = inject(FormBuilder);

  // Signals for component state
  readonly userBusinesses = signal<Business[]>([]);
  readonly currentService = signal<Service | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly isEditMode = signal(false);
  readonly serviceId = signal<string>('');
  readonly uploadingImages = signal(false);
  readonly selectedImages = signal<File[]>([]);
  readonly imagePreviewUrls = signal<string[]>([]);
  readonly existingImages = signal<string[]>([]);

  // Forms
  serviceInfoForm: FormGroup;
  servicePricingForm: FormGroup;
  
  readonly pricingTypes: PricingType[] = ['fixed', 'hourly', 'project', 'custom'];

  // Computed signals
  readonly hasBusinesses = computed(() => this.userBusinesses().length > 0);
  readonly canSubmitService = computed(() => this.hasBusinesses() && !this.submitting());
  readonly pageTitle = computed(() => this.isEditMode() ? 'Edit Service' : 'Create New Service');
  readonly submitButtonText = computed(() => this.isEditMode() ? 'Update Service' : 'Create Service');

  constructor() {
    this.serviceInfoForm = this.fb.group({
      business_id: ['', [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['']
    });

    this.servicePricingForm = this.fb.group({
      price: [null, [Validators.min(0)]],
      pricing_type: ['fixed' as PricingType],
      duration: [''],
      is_active: [true],
      is_featured: [false],
      features: [''],
      tags: ['']
    });

    // Auto-generate slug from name
    this.serviceInfoForm.get('name')?.valueChanges.subscribe(name => {
      // Slug generation removed as it's now handled on backend
    });
  }

  async ngOnInit(): Promise<void> {
    // Check if we're in edit mode
    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      this.isEditMode.set(true);
      this.serviceId.set(serviceId);
    }

    await this.loadUserBusinesses();
    
    // If user has no businesses, redirect to create business
    if (!this.hasBusinesses()) {
      this.router.navigate(['/dashboard/businesses/create-business']);
      return;
    }

    // If edit mode, load the service
    if (this.isEditMode()) {
      await this.loadService();
    } else {
      // Check for business ID from query parameters (from business profile)
      const businessIdFromQuery = this.route.snapshot.queryParamMap.get('businessId');
      if (businessIdFromQuery) {
        // Verify this business ID exists in user's businesses
        const businesses = this.userBusinesses();
        const selectedBusiness = businesses.find(b => b._id === businessIdFromQuery);
        if (selectedBusiness) {
          this.serviceInfoForm.get('business_id')?.setValue(businessIdFromQuery);
        }
      } else {
        // Auto-select business if only one exists
        const businesses = this.userBusinesses();
        if (businesses.length === 1) {
          this.serviceInfoForm.get('business_id')?.setValue(businesses[0]._id);
        }
      }
    }
  }

  private async loadUserBusinesses(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const businesses = await this.businessService.getMyBusinessesAsync();
      this.userBusinesses.set(businesses);
    } catch (error: any) {
      console.error('Error loading user businesses:', error);
      this.error.set(error?.message || 'Failed to load businesses');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadService(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const service = await this.businessService.getServiceAsync(this.serviceId());
      if (!service) {
        throw new Error('Service not found');
      }
      
      this.currentService.set(service);
      this.populateForm(service);
    } catch (error: any) {
      console.error('Error loading service:', error);
      this.error.set(error?.message || 'Failed to load service');
    } finally {
      this.loading.set(false);
    }
  }

  private populateForm(service: Service): void {
    // Service Info Form
    this.serviceInfoForm.patchValue({
      business_id: typeof service.business_id === 'string' ? service.business_id : service.business_id._id,
      name: service.name,
      short_description: service.short_description || '',
      description: service.description || ''
    });

    // Service Pricing Form
    this.servicePricingForm.patchValue({
      price: service.price,
      pricing_type: service.pricing_type || 'fixed',
      duration: service.duration || '',
      is_active: service.is_active ?? true,
      is_featured: service.is_featured ?? false,
      features: service.features?.join(', ') || '',
      tags: service.tags?.join(', ') || ''
    });

    // Handle existing images
    if (service.images && service.images.length > 0) {
      this.existingImages.set([...service.images]);
    }
  }

  private formatFeatures(featuresString: string): string[] {
    if (!featuresString.trim()) return [];
    return featuresString
      .split(',')
      .map(feature => feature.trim())
      .filter(feature => feature.length > 0);
  }

  private formatTags(tagsString: string): string[] {
    if (!tagsString.trim()) return [];
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  // Form validation methods
  isServiceInfoValid(): boolean {
    return this.serviceInfoForm.valid;
  }

  isServicePricingValid(): boolean {
    return this.servicePricingForm.valid;
  }

  // Navigation methods
  nextStep(stepper: any): void {
    stepper.next();
  }

  previousStep(stepper: any): void {
    stepper.previous();
  }

  async onSubmit(): Promise<void> {
    if (!this.isServiceInfoValid() || !this.isServicePricingValid() || this.submitting()) {
      this.markAllFormsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      const serviceInfoData = this.serviceInfoForm.value;
      const servicePricingData = this.servicePricingForm.value;

      let serviceResult: any;
      let serviceId: string;

      const serviceData = {
        name: serviceInfoData.name,
        short_description: serviceInfoData.short_description || undefined,
        description: serviceInfoData.description || undefined,
        features: this.formatFeatures(servicePricingData.features),
        price: servicePricingData.price || undefined,
        pricing_type: servicePricingData.pricing_type,
        duration: servicePricingData.duration || undefined,
        tags: this.formatTags(servicePricingData.tags),
        is_active: servicePricingData.is_active,
        is_featured: servicePricingData.is_featured
      };

      if (this.isEditMode()) {
        serviceId = this.serviceId();
        serviceResult = await this.businessService.updateServiceAsync(serviceId, serviceData as UpdateServiceDto);
      } else {
        serviceResult = await this.businessService.createServiceAsync(serviceInfoData.business_id, serviceData as CreateServiceDto);
        serviceId = serviceResult._id;
      }

      // Handle image uploads if any
      try {
        const imageUrls = await this.uploadImages(serviceId);
        
        // Update service with image URLs if we have images
        if (imageUrls.length > 0) {
          await this.businessService.updateServiceAsync(serviceId, { 
            images: imageUrls 
          } as UpdateServiceDto);
        }

        // Handle removal of existing images in edit mode
        if (this.isEditMode()) {
          const currentService = this.currentService();
          const originalImages = currentService?.images || [];
          const removedImages = originalImages.filter(img => !this.existingImages().includes(img));
          
          // Delete removed images
          for (const imageUrl of removedImages) {
            try {
              await this.businessService.deleteServiceImageAsync(serviceId, imageUrl);
            } catch (deleteError) {
              console.warn('Failed to delete image:', deleteError);
            }
          }
        }
      } catch (imageError: any) {
        console.error('Error handling images:', imageError);
        // Continue even if image upload fails, but show warning
        this.error.set(`Service saved but image upload failed: ${imageError.message}`);
      }
      
      // Navigate back to services list
      this.router.navigate(['/dashboard/services']);
    } catch (error: any) {
      console.error('Error saving service:', error);
      this.error.set(error?.message || `Failed to ${this.isEditMode() ? 'update' : 'create'} service`);
    } finally {
      this.submitting.set(false);
    }
  }

  private markAllFormsTouched(): void {
    Object.keys(this.serviceInfoForm.controls).forEach(key => {
      this.serviceInfoForm.get(key)?.markAsTouched();
    });
    Object.keys(this.servicePricingForm.controls).forEach(key => {
      this.servicePricingForm.get(key)?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/services']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/services']);
  }

  loadData(): void {
    if (this.isEditMode()) {
      this.loadService();
    } else {
      this.loadUserBusinesses();
    }
  }

  // Form field getters for template
  get business_id() { return this.serviceInfoForm.get('business_id'); }
  get name() { return this.serviceInfoForm.get('name'); }
  get short_description() { return this.serviceInfoForm.get('short_description'); }
  get description() { return this.serviceInfoForm.get('description'); }
  get features() { return this.serviceInfoForm.get('features'); }
  get price() { return this.servicePricingForm.get('price'); }
  get pricing_type() { return this.servicePricingForm.get('pricing_type'); }
  get duration() { return this.servicePricingForm.get('duration'); }
  get tags() { return this.servicePricingForm.get('tags'); }
  get is_active() { return this.servicePricingForm.get('is_active'); }
  get is_featured() { return this.servicePricingForm.get('is_featured'); }

  // Image handling methods
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      
      // Validate file types and sizes
      const validFiles = files.filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        return isValidType && isValidSize;
      });

      if (validFiles.length !== files.length) {
        this.error.set('Some files were rejected. Please ensure all files are images under 5MB.');
      }

      // Update selected images
      const currentImages = this.selectedImages();
      const newImages = [...currentImages, ...validFiles];
      
      // Limit to 5 images total
      if (newImages.length > 5) {
        this.selectedImages.set(newImages.slice(0, 5));
        this.error.set('Maximum 5 images allowed. Some images were not added.');
      } else {
        this.selectedImages.set(newImages);
      }

      // Generate preview URLs
      this.generateImagePreviews();
    }
  }

  removeImage(index: number): void {
    const currentImages = this.selectedImages();
    const newImages = currentImages.filter((_, i) => i !== index);
    this.selectedImages.set(newImages);
    this.generateImagePreviews();
  }

  removeExistingImage(imageUrl: string): void {
    const currentImages = this.existingImages();
    const newImages = currentImages.filter(url => url !== imageUrl);
    this.existingImages.set(newImages);
  }

  private generateImagePreviews(): void {
    const files = this.selectedImages();
    const previews: string[] = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        previews.push(result);
        
        // Update signal when all previews are ready
        if (previews.length === files.length) {
          this.imagePreviewUrls.set(previews);
        }
      };
      reader.readAsDataURL(file);
    });

    // If no files, clear previews
    if (files.length === 0) {
      this.imagePreviewUrls.set([]);
    }
  }

  private async uploadImages(serviceId: string): Promise<string[]> {
    const files = this.selectedImages();
    if (files.length === 0) {
      return this.existingImages();
    }

    this.uploadingImages.set(true);
    try {
      const result = await this.businessService.uploadServiceImagesAsync(serviceId, files);
      const allImages = [...this.existingImages(), ...result.images];
      return allImages;
    } catch (error: any) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    } finally {
      this.uploadingImages.set(false);
    }
  }
}

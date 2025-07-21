import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
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
    MatButtonModule,
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

  // Forms
  serviceInfoForm: FormGroup;
  servicePricingForm: FormGroup;
  serviceSeoForm: FormGroup;
  
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
      slug: [''],
      short_description: ['', [Validators.maxLength(160)]],
      description: [''],
      category: ['']
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

    this.serviceSeoForm = this.fb.group({
      meta_title: [''],
      meta_description: ['']
    });

    // Auto-generate slug from name
    this.serviceInfoForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.serviceInfoForm.get('slug')?.dirty) {
        const slug = this.generateSlug(name);
        this.serviceInfoForm.get('slug')?.setValue(slug);
      }
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
      // Auto-select business if only one exists
      const businesses = this.userBusinesses();
      if (businesses.length === 1) {
        this.serviceInfoForm.get('business_id')?.setValue(businesses[0]._id);
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
      slug: service.slug,
      short_description: service.short_description || '',
      description: service.description || '',
      category: service.category || ''
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

    // Service SEO Form
    this.serviceSeoForm.patchValue({
      meta_title: service.meta_title || '',
      meta_description: service.meta_description || ''
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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

  isServiceSeoValid(): boolean {
    return this.serviceSeoForm.valid;
  }

  // Navigation methods
  nextStep(stepper: any): void {
    stepper.next();
  }

  previousStep(stepper: any): void {
    stepper.previous();
  }

  async onSubmit(): Promise<void> {
    if (!this.isServiceInfoValid() || !this.isServicePricingValid() || !this.isServiceSeoValid() || this.submitting()) {
      this.markAllFormsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      const serviceInfoData = this.serviceInfoForm.value;
      const servicePricingData = this.servicePricingForm.value;
      const serviceSeoData = this.serviceSeoForm.value;

      const serviceData = {
        name: serviceInfoData.name,
        slug: serviceInfoData.slug || this.generateSlug(serviceInfoData.name),
        short_description: serviceInfoData.short_description || undefined,
        description: serviceInfoData.description || undefined,
        category: serviceInfoData.category || undefined,
        features: this.formatFeatures(servicePricingData.features),
        price: servicePricingData.price || undefined,
        pricing_type: servicePricingData.pricing_type,
        duration: servicePricingData.duration || undefined,
        tags: this.formatTags(servicePricingData.tags),
        is_active: servicePricingData.is_active,
        is_featured: servicePricingData.is_featured,
        meta_title: serviceSeoData.meta_title || undefined,
        meta_description: serviceSeoData.meta_description || undefined
      };

      if (this.isEditMode()) {
        await this.businessService.updateServiceAsync(this.serviceId(), serviceData as UpdateServiceDto);
      } else {
        await this.businessService.createServiceAsync(serviceInfoData.business_id, serviceData as CreateServiceDto);
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
    Object.keys(this.serviceSeoForm.controls).forEach(key => {
      this.serviceSeoForm.get(key)?.markAsTouched();
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
  get slug() { return this.serviceInfoForm.get('slug'); }
  get short_description() { return this.serviceInfoForm.get('short_description'); }
  get description() { return this.serviceInfoForm.get('description'); }
  get category() { return this.serviceInfoForm.get('category'); }
  get features() { return this.serviceInfoForm.get('features'); }
  get price() { return this.servicePricingForm.get('price'); }
  get pricing_type() { return this.servicePricingForm.get('pricing_type'); }
  get duration() { return this.servicePricingForm.get('duration'); }
  get tags() { return this.servicePricingForm.get('tags'); }
  get is_active() { return this.servicePricingForm.get('is_active'); }
  get is_featured() { return this.servicePricingForm.get('is_featured'); }
  get meta_title() { return this.serviceSeoForm.get('meta_title'); }
  get meta_description() { return this.serviceSeoForm.get('meta_description'); }
}

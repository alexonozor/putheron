import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProjectService, CreateProjectDto } from '../shared/services/project.service';
import { BusinessService, Business, Service } from '../shared/services/business.service';
import { AuthService } from '../shared/services/auth.service';
import { StripeService } from '../shared/services/stripe.service';
import { DashboardRefreshService } from '../shared/services/dashboard-refresh.service';

@Component({
  selector: 'app-create-project-steps',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatStepperModule,
    MatProgressBarModule,
  ],
  templateUrl: './create-project-steps.component.html',
  styleUrl: './create-project-steps.component.scss'
})
export class CreateProjectStepsComponent implements OnInit {
  @ViewChild('paymentElement', { static: false }) paymentElementRef!: ElementRef;

  private readonly formBuilder = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly businessService = inject(BusinessService);
  private readonly authService = inject(AuthService);
  private readonly stripeService = inject(StripeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardRefreshService = inject(DashboardRefreshService);

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly business = signal<Business | null>(null);
  readonly services = signal<Service[]>([]);
  readonly servicesLoading = signal(false);
  readonly submitting = signal(false);
  readonly paymentProcessing = signal(false);

  // Payment related
  readonly clientSecret = signal<string | null>(null);
  readonly paymentIntentId = signal<string | null>(null);
  readonly createdProject = signal<any | null>(null);
  
  // Image and file upload
  readonly imagePreview = signal<string | null>(null);
  readonly attachmentPreviews = signal<{ name: string; url: string; type: string; size: number }[]>([]);
  
  // File storage
  public imageFile: File | null = null;
  public attachmentFiles: File[] = [];
  
  // Project form data storage
  private projectFormData: CreateProjectDto | null = null;
  
  // Stripe Elements
  private elements: any = null;
  private paymentElement: any = null;

  // Stepper reference
  @ViewChild('stepper') stepper!: any;

  // Forms
  projectInfoForm: FormGroup;
  paymentForm: FormGroup;

  // Computed signals
  readonly user = this.authService.user;
  readonly selectedServiceIds = signal<string[]>([]);
  
  readonly selectedServices = computed(() => {
    const selectedIds = this.selectedServiceIds();
    return this.services().filter(service => selectedIds.includes(service._id));
  });

  readonly isServiceSelected = computed(() => {
    const selectedIds = this.selectedServiceIds();
    return (serviceId: string) => selectedIds.includes(serviceId);
  });

  readonly totalEstimatedCost = computed(() => {
    return this.selectedServices().reduce((total, service) => {
      return total + (service.price || 0);
    }, 0);
  });

  readonly canContinue = computed(() => {
    const formValid = this.projectInfoForm?.valid || false;
    const hasServices = this.selectedServices().length > 0;
    const notSubmitting = !this.submitting();
    
    return formValid && hasServices && notSubmitting;
  });

  // Custom validator for services
  private atLeastOneService(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || !Array.isArray(value) || value.length === 0) {
      return { atLeastOneService: true };
    }
    return null;
  }

  constructor() {
    this.projectInfoForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      selectedServices: [[], [Validators.required, this.atLeastOneService]],
      deadline: [''],
      additionalNotes: ['', [Validators.maxLength(500)]]
    });

    this.paymentForm = this.formBuilder.group({
      termsAccepted: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Get business ID from route parameters
    const businessId = this.route.snapshot.params['businessId'];
    if (!businessId) {
      this.error.set('Business ID is required');
      this.router.navigate(['/']);
      return;
    }

    // Load business data and services
    this.loadBusinessAndServices(businessId);

    // Listen to form changes to update signal
    this.projectInfoForm.get('selectedServices')?.valueChanges.subscribe((value: string[] | null) => {
      this.selectedServiceIds.set(value || []);
    });
  }

  async loadBusinessAndServices(businessId: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load business details
      const business = await this.businessService.getBusinessAsync(businessId);
      this.business.set(business);

      // Load business services
      this.servicesLoading.set(true);
      const services = await this.businessService.getBusinessServicesAsync(businessId);
      this.services.set(services.filter(service => service.is_active));
    } catch (error: any) {
      console.error('Error loading business data:', error);
      this.error.set('Failed to load business information');
    } finally {
      this.loading.set(false);
      this.servicesLoading.set(false);
    }
  }

  async onProjectInfoSubmit() {
    if (this.projectInfoForm.invalid) {
      this.markFormGroupTouched(this.projectInfoForm);
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      const formValue = this.projectInfoForm.value;
      const business = this.business();
      
      if (!business) {
        throw new Error('Business information not loaded');
      }

      // Calculate total cost from selected services
      const selectedServiceIds = formValue.selectedServices;
      const selectedServices = this.services().filter(service => 
        selectedServiceIds.includes(service._id)
      );
      
      const totalCost = selectedServices.reduce((total, service) => 
        total + (service.price || 0), 0
      );

      console.log('Creating payment intent for services:', selectedServiceIds);
      console.log('Total cost:', totalCost);

      // Create payment intent for the calculated amount
      const paymentData = await this.projectService.calculatePaymentIntentAsync(selectedServiceIds);
      console.log('Payment intent created:', paymentData);
      
      this.clientSecret.set(paymentData.clientSecret);
      this.paymentIntentId.set(paymentData.paymentIntentId);

      // Store form data for later project creation (AFTER payment)
      this.projectFormData = {
        title: formValue.title,
        description: formValue.description,
        business_id: business._id,
        selected_services: formValue.selectedServices,
        deadline: formValue.deadline ? new Date(formValue.deadline).toISOString() : undefined,
        additional_notes: formValue.additionalNotes
      };

      console.log('Project form data stored for after payment:', this.projectFormData);

      // Initialize Stripe Elements
      await this.initializePaymentElement(paymentData.clientSecret);

      // Move to next step (payment)
      this.stepper.next();
      
    } catch (error: any) {
      console.error('Error preparing payment:', error);
      this.error.set(error.error?.message || error.message || 'Failed to prepare payment');
    } finally {
      this.submitting.set(false);
    }
  }

  async initializePaymentElement(clientSecret: string) {
    try {
      const { elements, paymentElement } = await this.stripeService.createElement(clientSecret);
      this.elements = elements;
      this.paymentElement = paymentElement;

      // Mount the payment element
      setTimeout(() => {
        if (this.paymentElementRef?.nativeElement) {
          this.paymentElement.mount(this.paymentElementRef.nativeElement);
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing payment element:', error);
      this.error.set('Failed to initialize payment system');
    }
  }

  async onPaymentSubmit() {
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched(this.paymentForm);
      return;
    }

    if (!this.elements || !this.clientSecret()) {
      this.error.set('Payment system not properly initialized');
      return;
    }

    if (!this.projectFormData || !this.paymentIntentId()) {
      this.error.set('Project data not found. Please go back and fill the form again.');
      return;
    }

    this.paymentProcessing.set(true);
    this.error.set(null);

    try {
      console.log('=== Starting Payment Process ===');
      console.log('Client Secret:', this.clientSecret());
      console.log('Payment Intent ID:', this.paymentIntentId());
      console.log('Project Form Data ready for creation:', this.projectFormData);

      // Confirm payment with Stripe (without redirect)
      console.log('Confirming payment with Stripe...');
      const result = await this.stripeService.confirmPaymentWithoutRedirect(
        this.clientSecret()!,
        this.elements
      );

      console.log('Stripe payment confirmation result:', result);

      if (result.error) {
        console.error('Payment confirmation failed:', result.error);
        throw new Error(result.error.message || 'Payment confirmation failed');
      }

      // Check if payment succeeded
      if ('paymentIntent' in result) {
        const paymentIntent = result.paymentIntent as any;
        console.log('Payment Intent Status:', paymentIntent?.status);
        if (paymentIntent?.status !== 'succeeded') {
          console.error('Payment not succeeded. Status:', paymentIntent?.status);
          throw new Error('Payment was not completed successfully');
        }
      } else {
        console.log('Payment confirmation successful, no paymentIntent in result');
      }

      console.log('✅ Payment confirmed successfully!');
      console.log('Now creating project with payment intent:', this.paymentIntentId());

      // Create project after successful payment
      const createdProject = await this.projectService.createProjectAfterPaymentAsync(
        this.projectFormData!,
        this.paymentIntentId()!
      );
      
      console.log('✅ Project created successfully:', createdProject);
      this.createdProject.set(createdProject);
      
      // Upload image if selected
      if (this.imageFile) {
        try {
          console.log('Uploading project image...');
          await this.projectService.uploadProjectImageAsync(createdProject._id, this.imageFile);
          console.log('✅ Project image uploaded successfully');
        } catch (imageError) {
          console.warn('⚠️ Failed to upload project image:', imageError);
          // Don't fail the entire process for image upload
        }
      }

      // Upload attachments if selected
      if (this.attachmentFiles.length > 0) {
        try {
          console.log('Uploading project attachments...');
          await this.projectService.uploadProjectAttachmentsAsync(createdProject._id, this.attachmentFiles);
          console.log('✅ Project attachments uploaded successfully');
        } catch (attachmentError) {
          console.warn('⚠️ Failed to upload project attachments:', attachmentError);
          // Don't fail the entire process for attachment upload
        }
      }
      
      console.log('Refreshing dashboard and navigating...');
      // Refresh dashboard
      this.dashboardRefreshService.triggerRefresh();
      
      // Navigate to success page or project details
      this.router.navigate(['/dashboard/projects', createdProject._id], {
        queryParams: { payment: 'success' }
      });

      console.log('=== Payment and Project Creation Process Completed Successfully ===');
      
    } catch (error: any) {
      console.error('❌ Error in payment/project creation process:', error);
      console.error('Full error object:', error);
      
      // More detailed error handling
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check if it's a specific payment error vs project creation error
      if (errorMessage.includes('payment') || errorMessage.includes('Payment')) {
        console.error('This appears to be a payment-related error');
      } else {
        console.error('This appears to be a project creation error');
      }
      
      this.error.set(errorMessage);
    } finally {
      this.paymentProcessing.set(false);
    }
  }

  onCancel() {
    this.router.navigate(['/']);
  }

  onBackToBusiness() {
    const business = this.business();
    if (business) {
      this.router.navigate(['/business', business.slug]);
    } else {
      this.router.navigate(['/']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['requiredTrue']) return 'You must accept the terms';
    }
    return '';
  }

  onServiceToggle(serviceId: string): void {
    const control = this.projectInfoForm.get('selectedServices')!;
    const currentValue = control.value || [];
    
    let newValue: string[];
    if (currentValue.includes(serviceId)) {
      newValue = currentValue.filter((id: string) => id !== serviceId);
    } else {
      newValue = [...currentValue, serviceId];
    }
    
    // Update form control
    control.setValue(newValue);
    control.markAsTouched();
    
    // Update signal
    this.selectedServiceIds.set(newValue);
  }

  // Image upload methods
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error.set('Please select an image file.');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('Image file size must be less than 5MB.');
        return;
      }

      this.imageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      this.error.set(null);
    }
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview.set(null);
  }

  // File attachment methods
  onFilesSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      
      // Validate individual file size (10MB limit)
      for (const file of newFiles) {
        if (file.size > 10 * 1024 * 1024) {
          this.error.set(`File "${file.name}" is too large. Maximum size is 10MB.`);
          return;
        }
      }

      // Validate total files count (max 5 files)
      if (this.attachmentFiles.length + newFiles.length > 5) {
        this.error.set('Maximum 5 files allowed.');
        return;
      }

      // Add files
      this.attachmentFiles.push(...newFiles);
      
      // Create previews
      const currentPreviews = this.attachmentPreviews();
      const newPreviews = newFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size
      }));
      
      this.attachmentPreviews.set([...currentPreviews, ...newPreviews]);
      this.error.set(null);
    }
  }

  removeAttachment(index: number): void {
    // Remove from files array
    this.attachmentFiles.splice(index, 1);
    
    // Update previews
    const previews = this.attachmentPreviews();
    URL.revokeObjectURL(previews[index].url); // Clean up object URL
    previews.splice(index, 1);
    this.attachmentPreviews.set([...previews]);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(type: string): string {
    if (type.startsWith('image/')) return 'image';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('sheet') || type.includes('excel')) return 'table_chart';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'slideshow';
    if (type.includes('text')) return 'text_snippet';
    return 'attach_file';
  }
}

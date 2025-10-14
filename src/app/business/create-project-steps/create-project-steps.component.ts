import { Component, OnInit, inject, signal, computed, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { ProjectService, CreateProjectDto } from '../../shared/services/project.service';
import { BusinessService, Business, Service } from '../../shared/services/business.service';
import { AuthService } from '../../shared/services/auth.service';
import { DashboardRefreshService } from '../../shared/services/dashboard-refresh.service';

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
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './create-project-steps.component.html',
  styleUrl: './create-project-steps.component.scss'
})
export class CreateProjectStepsComponent implements OnInit {

  private readonly formBuilder = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly businessService = inject(BusinessService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardRefreshService = inject(DashboardRefreshService);
  private readonly dialogRef = inject(MatDialogRef<CreateProjectStepsComponent>);
  
  // Dialog data interface
  public dialogData = inject(MAT_DIALOG_DATA) as { 
    businessId: string; 
    preSelectedServiceId?: string 
  } | null;

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly business = signal<Business | null>(null);
  readonly services = signal<Service[]>([]);
  readonly servicesLoading = signal(false);
  readonly submitting = signal(false);

  // Image and file upload
  readonly imagePreview = signal<string | null>(null);
  readonly attachmentPreviews = signal<{ name: string; url: string; type: string; size: number }[]>([]);
  
  // File storage
  public imageFile: File | null = null;
  public attachmentFiles: File[] = [];

  // Forms
  projectInfoForm: FormGroup;

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

  readonly canSubmit = computed(() => {
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

  // Custom validator for deadline (no past dates)
  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Allow empty dates since deadline is optional
    }
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    if (selectedDate < today) {
      return { pastDate: true };
    }
    
    return null;
  }

  constructor() {
    this.projectInfoForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      selectedServices: [[], [Validators.required, this.atLeastOneService]],
      deadline: ['', [this.futureDateValidator]],
      additionalNotes: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.user()) {
      if (this.dialogRef) {
        this.dialogRef.close({ error: 'Authentication required' });
      } else {
        this.router.navigate(['/auth']);
      }
      return;
    }

    // Get business ID from dialog data or route parameters (for backward compatibility)
    const businessId = this.dialogData?.businessId || this.route.snapshot.params['businessId'];
    if (!businessId) {
      this.error.set('Business ID is required');
      if (this.dialogRef) {
        this.dialogRef.close({ error: 'Business ID is required' });
      } else {
        this.router.navigate(['/']);
      }
      return;
    }

    // Load business data and services
    this.loadBusinessAndServices(businessId);

    // Listen to form changes to update signal
    this.projectInfoForm.get('selectedServices')?.valueChanges.subscribe((value: string[] | null) => {
      this.selectedServiceIds.set(value || []);
      
      // If there's a pre-selected service from dialog data, select it
      if (this.dialogData?.preSelectedServiceId && !value?.includes(this.dialogData.preSelectedServiceId)) {
        const currentValue = value || [];
        if (!currentValue.includes(this.dialogData.preSelectedServiceId)) {
          const newValue = [...currentValue, this.dialogData.preSelectedServiceId];
          this.projectInfoForm.get('selectedServices')?.setValue(newValue, { emitEvent: false });
          this.selectedServiceIds.set(newValue);
        }
      }
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

      // Pre-select service if provided in dialog data
      if (this.dialogData?.preSelectedServiceId) {
        const preSelectedService = services.find(service => 
          service._id === this.dialogData?.preSelectedServiceId && service.is_active
        );
        if (preSelectedService) {
          this.projectInfoForm.get('selectedServices')?.setValue([this.dialogData.preSelectedServiceId]);
          this.selectedServiceIds.set([this.dialogData.preSelectedServiceId]);
        }
      }
    } catch (error: any) {
      console.error('Error loading business data:', error);
      this.error.set('Failed to load business information');
    } finally {
      this.loading.set(false);
      this.servicesLoading.set(false);
    }
  }

  async onProjectSubmit() {
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

      // Create project data
      const projectData: CreateProjectDto = {
        title: formValue.title,
        description: formValue.description,
        business_id: business._id,
        selected_services: formValue.selectedServices,
        deadline: formValue.deadline ? new Date(formValue.deadline).toISOString() : undefined,
        additional_notes: formValue.additionalNotes
      };

      console.log('Creating project request:', projectData);

      // Create project directly (no payment required)
      const createdProject = await this.projectService.createProjectAsync(projectData);
      
      console.log('✅ Project request created successfully:', createdProject);
      
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
      
      // Close modal with success data or navigate if not in modal
      if (this.dialogRef) {
        this.dialogRef.close({ 
          success: true, 
          project: createdProject,
          message: 'Project request submitted successfully!'
        });
      } else {
        // Navigate to project details (fallback for non-modal usage)
        this.router.navigate(['/dashboard/projects', createdProject._id]);
      }

      console.log('=== Project Request Submission Process Completed Successfully ===');
      
    } catch (error: any) {
      console.error('❌ Error in project request submission:', error);
      console.error('Full error object:', error);
      
      let errorMessage = 'Failed to submit project request. Please try again.';
      
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.error.set(errorMessage);
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel() {
    if (this.dialogRef) {
      this.dialogRef.close({ cancelled: true });
    } else {
      this.router.navigate(['/']);
    }
  }

  onBackToBusiness() {
    if (this.dialogRef) {
      this.dialogRef.close({ cancelled: true });
    } else {
      const business = this.business();
      if (business) {
        this.router.navigate(['/business/profile', business._id]);
      } else {
        this.router.navigate(['/']);
      }
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
      if (field.errors['atLeastOneService']) return 'Please select at least one service';
      if (field.errors['pastDate']) return 'Deadline cannot be in the past';
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

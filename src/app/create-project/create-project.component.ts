import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
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
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectService, CreateProjectDto } from '../shared/services/project.service';
import { BusinessService, Business, Service } from '../shared/services/business.service';
import { AuthService } from '../shared/services/auth.service';
import { DashboardRefreshService } from '../shared/services/dashboard-refresh.service';

@Component({
  selector: 'app-create-project',
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
  ],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.scss'
})
export class CreateProjectComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly businessService = inject(BusinessService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardRefreshService = inject(DashboardRefreshService);

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly business = signal<Business | null>(null);
  readonly services = signal<Service[]>([]);
  readonly servicesLoading = signal(false);

  // Form
  projectForm: FormGroup;

  // Computed signals
  readonly user = this.authService.user;
  readonly selectedServices = computed(() => {
    const formValue = this.projectForm?.get('selectedServices')?.value || [];
    return this.services().filter(service => formValue.includes(service._id));
  });

  readonly totalEstimatedCost = computed(() => {
    return this.selectedServices().reduce((total, service) => {
      return total + (service.price || 0);
    }, 0);
  });

  constructor() {
    this.projectForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      selectedServices: [[], [Validators.required]],
      offeredPrice: ['', [Validators.maxLength(100)]], // Now optional, accepts text
      deadline: [''],
      additionalNotes: ['', [Validators.maxLength(500)]]
    });

    // Update offered price when services selection changes
    this.projectForm.get('selectedServices')?.valueChanges.subscribe(() => {
      const estimatedCost = this.totalEstimatedCost();
      if (estimatedCost > 0) {
        this.projectForm.patchValue({
          offeredPrice: estimatedCost
        }, { emitEvent: false });
      }
    });
  }

  ngOnInit() {
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

    this.loadBusinessData(businessId);
  }

  async loadBusinessData(businessId: string) {
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

  async onSubmit() {
    if (this.projectForm.valid && this.business()) {
      this.loading.set(true);
      this.error.set(null);

      try {
        const formValue = this.projectForm.value;
        const projectData: CreateProjectDto = {
          title: formValue.title,
          description: formValue.description || undefined,
          business_id: this.business()!._id,
          selected_services: formValue.selectedServices,
          offered_price: formValue.offeredPrice,
          deadline: formValue.deadline ? new Date(formValue.deadline).toISOString() : undefined,
          additional_notes: formValue.additionalNotes || undefined,
        };

        const project = await this.projectService.createProjectAsync(projectData);
        
        // Trigger dashboard refresh
        this.dashboardRefreshService.triggerRefresh();
        
        // Navigate to the created project details page
        this.router.navigate(['/dashboard/projects', project._id]);

      } catch (error: any) {
        console.error('Error creating project:', error);
        this.error.set(error.error?.message || 'Failed to create project');
      } finally {
        this.loading.set(false);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    // Navigate back to the business profile or home
    const businessId = this.route.snapshot.params['businessId'];
    if (businessId) {
      this.router.navigate(['/business', businessId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.projectForm.controls).forEach(key => {
      const control = this.projectForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.projectForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
    }
    return '';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getServicePrice(service: Service): string {
    if (!service.price) return 'Price on request';
    return this.formatPrice(service.price);
  }
}

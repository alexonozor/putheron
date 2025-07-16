import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { HeaderComponent } from '../shared/components/header/header.component';
import { ProjectChatService, ProjectFormData } from '../shared/services/project-chat.service';
import { SupabaseService } from '../shared/services/supabase.service';
import { AuthService } from '../shared/services/auth.service';
import { Tables } from '../shared/types/database.types';

interface Business extends Tables<'businesses'> {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Service extends Tables<'services'> {}

@Component({
  selector: 'app-create-project',
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
    MatRadioModule,
    HeaderComponent
  ],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.scss'
})
export class CreateProjectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private projectChatService = inject(ProjectChatService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  // Signals
  public business = signal<Business | null>(null);
  public services = signal<Service[]>([]);
  public loading = signal(false);
  public submitting = signal(false);
  public error = signal<string | null>(null);
  public businessId = signal<string | null>(null);

  // Form
  public serviceSelectionForm: FormGroup;
  public projectDetailsForm: FormGroup;

  // Computed
  public activeServices = computed(() => 
    this.services().filter(service => service.is_active)
  );
  public hasServices = computed(() => this.services().length > 0);
  public selectedService = computed(() => {
    const serviceId = this.serviceSelectionForm?.get('serviceId')?.value;
    if (!serviceId) return null;
    return this.services().find(s => s.id === parseInt(serviceId)) || null;
  });

  constructor() {
    this.serviceSelectionForm = this.fb.group({
      serviceId: ['']
    });

    this.projectDetailsForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      budgetRange: [''],
      timeline: [''],
      priority: ['medium', Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['businessId'];
      if (id) {
        this.businessId.set(id); // Keep as string since business IDs are UUIDs
        this.loadBusinessAndServices(id);
      }
    });
  }

  async loadBusinessAndServices(businessId: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Load business and services in parallel
      const [businessResult, servicesResult] = await Promise.all([
        this.supabaseService.getClient()
          .from('businesses')
          .select(`
            *,
            profile:profiles!businesses_profile_id_fkey (
              full_name,
              avatar_url
            )
          `)
          .eq('id', businessId as any)
          .single(),
        
        this.supabaseService.getClient()
          .from('services')
          .select('*')
          .eq('business_id', businessId as any)
          .eq('is_active', true)
          .order('name')
      ]);

      if (businessResult.error) {
        this.error.set('Business not found');
        return;
      }

      if (servicesResult.error) {
        console.error('Error loading services:', servicesResult.error);
      }

      this.business.set(businessResult.data as Business);
      this.services.set(servicesResult.data || []);

    } catch (err) {
      console.error('Error loading business and services:', err);
      this.error.set('Failed to load business information');
    } finally {
      this.loading.set(false);
    }
  }

  getServicePrice(service: Service): string {
    if (service.price === null) return 'Contact for pricing';
    return `$${service.price.toFixed(2)}`;
  }

  getServiceDuration(service: Service): string {
    if (!service.duration_minutes) return 'Duration varies';
    
    if (service.duration_minutes < 60) {
      return `${service.duration_minutes} minutes`;
    } else {
      const hours = Math.floor(service.duration_minutes / 60);
      const remainingMinutes = service.duration_minutes % 60;
      
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  }

  async submitProject() {
    if (!this.hasServices() || this.serviceSelectionForm.valid) {
      // For businesses without services, allow submission without service selection
    } else if (this.hasServices() && this.serviceSelectionForm.invalid) {
      return;
    }

    if (this.projectDetailsForm.invalid || !this.businessId()) {
      return;
    }

    try {
      this.submitting.set(true);

      const currentUser = this.authService.currentUser;
      if (!currentUser) {
        this.router.navigate(['/auth'], { 
          queryParams: { 
            returnUrl: `/create-project/${this.businessId()}` 
          } 
        });
        return;
      }

      // Combine form values
      const serviceId = this.serviceSelectionForm.get('serviceId')?.value;
      const projectDetails = this.projectDetailsForm.value;

      const projectData: ProjectFormData = {
        businessId: this.businessId()!,
        serviceId: serviceId ? parseInt(serviceId) : undefined,
        title: projectDetails.title,
        description: projectDetails.description,
        budget: this.getBudgetFromRange(projectDetails.budgetRange),
        timeline: projectDetails.timeline,
        requirements: `Priority: ${projectDetails.priority}`,
        contactPreference: 'chat',
        urgency: projectDetails.priority
      };

      // Create the project
      const projectId = await this.projectChatService.createUserBusinessProject(projectData);
      
      // Start chat conversation
      const conversationId = await this.projectChatService.startChatConversation(
        currentUser.id,
        this.businessId()!,
        projectId
      );

      // Navigate to chat conversation
      this.router.navigate(['/chat', conversationId], { 
        queryParams: { 
          message: 'Project created successfully! You can now chat with the business.' 
        }
      });

    } catch (err) {
      console.error('Error creating project:', err);
      this.error.set('Failed to create project. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  // Stepper navigation methods
  nextStep(stepper: any) {
    stepper.next();
  }

  previousStep(stepper: any) {
    stepper.previous();
  }

  // Form helper methods
  getBudgetFromRange(range: string): number | undefined {
    switch (range) {
      case 'under-500': return 250;
      case '500-1000': return 750;
      case '1000-2500': return 1750;
      case '2500-5000': return 3750;
      case '5000-10000': return 7500;
      case 'over-10000': return 15000;
      default: return undefined;
    }
  }

  getBudgetLabel(range: string): string {
    switch (range) {
      case 'under-500': return 'Under $500';
      case '500-1000': return '$500 - $1,000';
      case '1000-2500': return '$1,000 - $2,500';
      case '2500-5000': return '$2,500 - $5,000';
      case '5000-10000': return '$5,000 - $10,000';
      case 'over-10000': return 'Over $10,000';
      case 'not-sure': return 'Not sure yet';
      default: return range;
    }
  }

  getTimelineLabel(timeline: string): string {
    switch (timeline) {
      case 'asap': return 'ASAP';
      case '1-week': return 'Within 1 week';
      case '2-weeks': return 'Within 2 weeks';
      case '1-month': return 'Within 1 month';
      case '2-months': return 'Within 2 months';
      case '3-months': return 'Within 3 months';
      case 'flexible': return 'Flexible';
      default: return timeline;
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'low': return 'Low Priority';
      case 'medium': return 'Medium Priority';
      case 'high': return 'High Priority';
      default: return priority;
    }
  }

  loadData() {
    if (this.businessId()) {
      this.loadBusinessAndServices(this.businessId()!);
    }
  }

  formatDuration(minutes: number | null): string {
    if (!minutes) return 'Duration varies';
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  }

  goBack() {
    if (this.businessId()) {
      this.router.navigate(['/business', this.businessId()]);
    } else {
      this.router.navigate(['/search']);
    }
  }

  getBusinessImageUrl(): string {
    const business = this.business();
    if (business?.logo_url) {
      return business.logo_url;
    }
    return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop';
  }

  getOwnerAvatar(): string {
    const business = this.business();
    if (business?.profile?.avatar_url) {
      return business.profile.avatar_url;
    }
    return 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop';
  }

  handleImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop';
  }
}

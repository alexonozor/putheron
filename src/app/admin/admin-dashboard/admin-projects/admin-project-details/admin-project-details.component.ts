import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminProjectsService, AdminUpdateProjectDto } from '../admin-projects.service';
import { Project } from '../../../../shared/services/project.service';

@Component({
  selector: 'app-admin-project-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-project-details.component.html',
  styleUrl: './admin-project-details.component.scss'
})
export class AdminProjectDetailsComponent implements OnInit {
  private readonly adminProjectsService = inject(AdminProjectsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Signals
  project = signal<Project | null>(null);
  projectActivity = signal<any[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  isEditing = signal(false);
  
  // Form
  projectForm: FormGroup;

  constructor() {
    this.projectForm = this.fb.group({
      status: ['', [Validators.required]],
      offered_price: ['', [Validators.required, Validators.min(0)]],
      deadline: [''],
      rejection_reason: [''],
      admin_notes: [''],
      is_archived: [false]
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await Promise.all([
        this.loadProject(id),
        this.loadProjectActivity(id)
      ]);
    }
  }

  async loadProject(id: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const project = await this.adminProjectsService.getProjectAsync(id);
      console.log('🔍 Loaded project data:', project);
      console.log('🔍 Selected services type:', typeof project.selected_services);
      console.log('🔍 Selected services data:', project.selected_services);
      
      if (Array.isArray(project.selected_services) && project.selected_services.length > 0) {
        console.log('🔍 First service:', project.selected_services[0]);
        console.log('🔍 First service type:', typeof project.selected_services[0]);
      }
      
      this.project.set(project);
      this.populateForm(project);
    } catch (err: any) {
      console.error('Error loading project:', err);
      this.error.set('Failed to load project details. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadProjectActivity(id: string) {
    try {
      console.log('Loading project activity for project ID:', id);
      const activity = await this.adminProjectsService.getProjectActivityAsync(id);
      console.log('Project activity loaded:', activity);
      this.projectActivity.set(activity);
    } catch (err: any) {
      console.error('Error loading project activity:', err);
      this.projectActivity.set([]);
    }
  }

  populateForm(project: Project) {
    this.projectForm.patchValue({
      status: project.status,
      offered_price: project.offered_price,
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
      rejection_reason: project.rejection_reason || '',
      admin_notes: (project as any).admin_notes || '',
      is_archived: project.is_archived
    });
  }

  async saveProject() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const project = this.project();
    if (!project) return;

    this.loading.set(true);
    try {
      const formData = this.projectForm.value as AdminUpdateProjectDto;
      const updatedProject = await this.adminProjectsService.updateProjectAsync(project._id, formData);
      
      this.project.set(updatedProject);
      this.isEditing.set(false);
      this.error.set(null);
      
      // Reload activity to show the update
      await this.loadProjectActivity(project._id);
    } catch (err: any) {
      console.error('Error updating project:', err);
      this.error.set('Failed to update project. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  cancelEdit() {
    const project = this.project();
    if (project) {
      this.populateForm(project);
    }
    this.isEditing.set(false);
  }

  async toggleArchiveStatus() {
    const project = this.project();
    if (!project) return;

    try {
      const updatedProject = await this.adminProjectsService.toggleArchiveProjectAsync(project._id);
      this.project.set(updatedProject);
      this.populateForm(updatedProject);
    } catch (err: any) {
      console.error('Error toggling archive status:', err);
      this.error.set('Failed to update project status.');
    }
  }

  async deleteProject() {
    const project = this.project();
    if (!project) return;

    if (!confirm(`Are you sure you want to permanently delete the project "${project.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await this.adminProjectsService.deleteProjectAsync(project._id);
      this.goBack();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      this.error.set('Failed to delete project.');
    }
  }

  goBack() {
    this.router.navigate(['/admin/dashboard/projects']);
  }

  // Computed values
  projectValue = computed(() => {
    const project = this.project();
    if (!project) return 0;
    return project.offered_price + ((project as any).additional_payments_total || 0);
  });

  projectDuration = computed(() => {
    const project = this.project();
    if (!project || !project.accepted_at) return null;
    
    const start = new Date(project.accepted_at);
    const end = project.completed_at ? new Date(project.completed_at) : new Date();
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return days;
  });

  isOverdue = computed(() => {
    const project = this.project();
    if (!project?.deadline || ['completed', 'settled', 'cancelled'].includes(project.status)) {
      return false;
    }
    
    return new Date(project.deadline) < new Date();
  });

  daysUntilDeadline = computed(() => {
    const project = this.project();
    if (!project?.deadline) return null;
    
    const deadline = new Date(project.deadline);
    const now = new Date();
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  });

  // Utility methods
  getStatusColor = this.adminProjectsService.getStatusColor.bind(this.adminProjectsService);
  getStatusLabel = this.adminProjectsService.getStatusLabel.bind(this.adminProjectsService);
  formatCurrency = this.adminProjectsService.formatCurrency.bind(this.adminProjectsService);
  formatDate = this.adminProjectsService.formatDate.bind(this.adminProjectsService);

  // Service helper methods
  getServices(): any[] {
    const project = this.project();
    if (!project || !project.selected_services) {
      return [];
    }
    
    // The backend should now populate services with full objects
    return Array.isArray(project.selected_services) ? project.selected_services : [];
  }

  getServiceName(service: any): string {
    // Handle both string IDs and populated service objects
    if (typeof service === 'string') {
      return `Service ID: ${service}`;
    }
    return service?.name || 'Unknown Service';
  }

  getServiceDescription(service: any): string {
    // Handle both string IDs and populated service objects
    if (typeof service === 'string') {
      return '';
    }
    return service?.description || service?.short_description || '';
  }

  getServiceFeatures(service: any): string[] {
    // Handle both string IDs and populated service objects
    if (typeof service === 'string') {
      return [];
    }
    return service?.features || [];
  }

  getServicePrice(service: any): number | null {
    // Handle both string IDs and populated service objects
    if (typeof service === 'string') {
      return null;
    }
    return service?.price || null;
  }

  getServicePricingType(service: any): string {
    // Handle both string IDs and populated service objects
    if (typeof service === 'string') {
      return '';
    }
    return service?.pricing_type || '';
  }

  getServiceDuration(service: any): string {
    // Handle both string IDs and populated service objects
    if (typeof service === 'string') {
      return '';
    }
    // Service duration is a string in the schema (e.g., "2 hours", "1 week")
    return service?.duration || '';
  }

  // Attachment helper methods
  isImageFile(type: string): boolean {
    return type.startsWith('image/');
  }

  isPdfFile(type: string): boolean {
    return type === 'application/pdf';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  viewAttachment(url: string) {
    window.open(url, '_blank');
  }

  downloadAttachment(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openImageModal(url: string, name: string) {
    // For now, just open in new tab
    // In the future, you could implement a proper image modal
    this.viewAttachment(url);
  }

  getClientName(project: Project): string {
    if (typeof project.client_id === 'string') return 'Unknown Client';
    const client = project.client_id as any;
    return `${client.first_name} ${client.last_name}`;
  }

  getClientEmail(project: Project): string {
    if (typeof project.client_id === 'string') return '';
    const client = project.client_id as any;
    return client.email || '';
  }

  getBusinessName(project: Project): string {
    if (typeof project.business_id === 'string') return 'Unknown Business';
    const business = project.business_id as any;
    return business.name;
  }

  getBusinessOwnerName(project: Project): string {
    if (typeof project.business_owner_id === 'string') return 'Unknown Owner';
    const owner = project.business_owner_id as any;
    return `${owner.first_name} ${owner.last_name}`;
  }

  getBusinessOwnerEmail(project: Project): string {
    if (typeof project.business_owner_id === 'string') return '';
    const owner = project.business_owner_id as any;
    return owner.email || '';
  }

  getServicesCount(project: Project): number {
    if (Array.isArray(project.selected_services)) {
      return project.selected_services.length;
    }
    return 0;
  }

  getServicesDetails(project: Project): any[] {
    if (Array.isArray(project.selected_services) && project.selected_services.length > 0) {
      const firstService = project.selected_services[0];
      if (typeof firstService === 'object' && firstService !== null && '_id' in firstService) {
        return project.selected_services as any[];
      }
    }
    return [];
  }

  getFieldError(fieldName: string): string | null {
    const field = this.projectForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['min']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['min'].min}`;
      }
    }
    return null;
  }

  getDeadlineStatus(): { text: string; color: string } {
    const days = this.daysUntilDeadline();
    if (days === null) return { text: 'No deadline', color: 'text-gray-500' };
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, color: 'text-red-600' };
    if (days === 0) return { text: 'Due today', color: 'text-orange-600' };
    if (days === 1) return { text: 'Due tomorrow', color: 'text-orange-600' };
    if (days <= 3) return { text: `Due in ${days} days`, color: 'text-yellow-600' };
    if (days <= 7) return { text: `Due in ${days} days`, color: 'text-blue-600' };
    return { text: `Due in ${days} days`, color: 'text-gray-600' };
  }

  getPaymentStatus(project: Project): { text: string; color: string } {
    const paymentStatus = (project as any).payment_status;
    if (!paymentStatus) {
      return { text: 'No payment', color: 'text-gray-500' };
    }
    
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'pending': { text: 'Payment Pending', color: 'text-yellow-600' },
      'processing': { text: 'Processing Payment', color: 'text-blue-600' },
      'succeeded': { text: 'Payment Successful', color: 'text-green-600' },
      'failed': { text: 'Payment Failed', color: 'text-red-600' },
      'cancelled': { text: 'Payment Cancelled', color: 'text-gray-600' }
    };
    
    return statusMap[paymentStatus] || { text: paymentStatus, color: 'text-gray-600' };
  }

  onStatusChange() {
    const status = this.projectForm.get('status')?.value;
    const rejectionReasonControl = this.projectForm.get('rejection_reason');
    
    if (status === 'rejected') {
      rejectionReasonControl?.setValidators([Validators.required]);
    } else {
      rejectionReasonControl?.clearValidators();
    }
    
    rejectionReasonControl?.updateValueAndValidity();
  }
}

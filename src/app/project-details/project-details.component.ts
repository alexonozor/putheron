import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService, Project } from '../shared/services/project.service';
import { AuthService } from '../shared/services/auth.service';
import { ChatService } from '../shared/services/chat.service';
import { DashboardRefreshService } from '../shared/services/dashboard-refresh.service';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private readonly dashboardRefreshService = inject(DashboardRefreshService);

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly project = signal<Project | null>(null);

  // Computed signals
  readonly user = this.authService.user;
  readonly isClient = computed(() => {
    const project = this.project();
    const user = this.user();
    if (!project || !user) return false;
    
    const clientId = typeof project.client_id === 'string' 
      ? project.client_id 
      : project.client_id?._id;
    
    return user._id === clientId;
  });

  readonly isBusinessOwner = computed(() => {
    const project = this.project();
    const user = this.user();
    if (!project || !user) return false;
    
    const businessOwnerId = typeof project.business_owner_id === 'string' 
      ? project.business_owner_id 
      : project.business_owner_id?._id;
    
    return user._id === businessOwnerId;
  });

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }

    const projectId = this.route.snapshot.params['id'];
    if (!projectId) {
      this.error.set('Project ID is required');
      this.router.navigate(['/dashboard/projects']);
      return;
    }

    this.loadProject(projectId);
  }

  async loadProject(projectId: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const project = await this.projectService.getProjectAsync(projectId);
      this.project.set(project);
    } catch (error: any) {
      console.error('Error loading project:', error);
      this.error.set('Failed to load project details');
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard/projects']);
  }

  async acceptProject() {
    const project = this.project();
    if (!project) return;

    try {
      await this.projectService.updateProjectAsync(project._id, { status: 'accepted' });
      this.loadProject(project._id); // Reload to get updated data
      this.dashboardRefreshService.triggerRefresh(); // Refresh dashboard counters
    } catch (error: any) {
      console.error('Error accepting project:', error);
      this.error.set('Failed to accept project');
    }
  }

  async rejectProject() {
    const project = this.project();
    if (!project) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await this.projectService.updateProjectAsync(project._id, { 
        status: 'rejected',
        rejection_reason: reason 
      });
      this.loadProject(project._id); // Reload to get updated data
      this.dashboardRefreshService.triggerRefresh(); // Refresh dashboard counters
    } catch (error: any) {
      console.error('Error rejecting project:', error);
      this.error.set('Failed to reject project');
    }
  }

  async markInProgress() {
    const project = this.project();
    if (!project) return;

    try {
      await this.projectService.updateProjectAsync(project._id, { status: 'in_progress' });
      this.loadProject(project._id); // Reload to get updated data
      this.dashboardRefreshService.triggerRefresh(); // Refresh dashboard counters
    } catch (error: any) {
      console.error('Error marking project as in progress:', error);
      this.error.set('Failed to update project status');
    }
  }

  async markCompleted() {
    const project = this.project();
    if (!project) return;

    try {
      await this.projectService.updateProjectAsync(project._id, { status: 'completed' });
      this.loadProject(project._id); // Reload to get updated data
      this.dashboardRefreshService.triggerRefresh(); // Refresh dashboard counters
    } catch (error: any) {
      console.error('Error marking project as completed:', error);
      this.error.set('Failed to update project status');
    }
  }

  async startChat() {
    const project = this.project();
    if (!project) return;

    try {
      const chat = await this.chatService.createOrGetChatAsync({ project_id: project._id });
      this.router.navigate(['/messages/chat', chat._id]);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'accepted': 'bg-blue-100 text-blue-800 border-blue-200',
      'in_progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Not set';
    
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  }

  getBusinessName(project: Project): string {
    if (typeof project.business_id === 'object' && project.business_id.name) {
      return project.business_id.name;
    }
    return 'Unknown Business';
  }

  getClientName(project: Project): string {
    if (typeof project.client_id === 'object') {
      const client = project.client_id;
      return `${client.first_name} ${client.last_name}`;
    }
    return 'Unknown Client';
  }

  getServiceNames(project: Project): string[] {
    if (project.selected_services && Array.isArray(project.selected_services)) {
      return project.selected_services.map(service => {
        if (typeof service === 'object' && service.name) {
          return service.name;
        }
        return 'Unknown Service';
      });
    }
    return [];
  }

  // Helper methods for type-safe access to populated fields
  getBusinessInfo(project: Project): { name: string; logo_url?: string; slug: string } | null {
    if (typeof project.business_id === 'object' && project.business_id) {
      return {
        name: project.business_id.name || 'Unknown Business',
        logo_url: project.business_id.logo_url,
        slug: project.business_id.slug
      };
    }
    return null;
  }

  getClientInfo(project: Project): { first_name: string; last_name: string; email: string } | null {
    if (typeof project.client_id === 'object' && project.client_id) {
      return {
        first_name: project.client_id.first_name || 'Unknown',
        last_name: project.client_id.last_name || 'Client',
        email: project.client_id.email
      };
    }
    return null;
  }
}

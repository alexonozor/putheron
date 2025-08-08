import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../shared/services/auth.service';
import { ProjectService, Project } from '../../shared/services/project.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly myProjects = signal<Project[]>([]);
  readonly businessProjects = signal<Project[]>([]);
  readonly activeTab = signal(0);

  // Computed signals
  readonly user = this.authService.user;
  readonly pendingMyProjects = computed(() => 
    this.myProjects().filter(p => p.status === 'pending')
  );
  readonly activeMyProjects = computed(() => 
    this.myProjects().filter(p => ['accepted', 'in_progress'].includes(p.status))
  );
  readonly completedMyProjects = computed(() => 
    this.myProjects().filter(p => ['completed', 'settled'].includes(p.status))
  );
  readonly rejectedMyProjects = computed(() => 
    this.myProjects().filter(p => p.status === 'rejected')
  );
  readonly cancelledMyProjects = computed(() => 
    this.myProjects().filter(p => p.status === 'cancelled')
  );
  readonly pendingBusinessProjects = computed(() => 
    this.businessProjects().filter(p => p.status === 'pending')
  );
  readonly activeBusinessProjects = computed(() => 
    this.businessProjects().filter(p => ['accepted', 'in_progress'].includes(p.status))
  );
  readonly completedBusinessProjects = computed(() => 
    this.businessProjects().filter(p => ['completed', 'settled'].includes(p.status))
  );
  readonly rejectedBusinessProjects = computed(() => 
    this.businessProjects().filter(p => p.status === 'rejected')
  );
  readonly cancelledBusinessProjects = computed(() => 
    this.businessProjects().filter(p => p.status === 'cancelled')
  );

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }
    
    this.loadProjects();
  }

  async loadProjects() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load projects as client
      const clientProjects = await this.projectService.getMyProjectsAsync('client');
      this.myProjects.set(clientProjects);

      // Load projects as business owner
      const businessOwnerProjects = await this.projectService.getMyProjectsAsync('business_owner');
      this.businessProjects.set(businessOwnerProjects);

    } catch (error: any) {
      console.error('Error loading projects:', error);
      this.error.set('Failed to load projects');
    } finally {
      this.loading.set(false);
    }
  }

  onTabChange(index: number) {
    this.activeTab.set(index);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'settled': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'settled': 'Settled',
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

  formatDate(date: string | Date): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
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

  viewProject(project: Project) {
    this.router.navigate(['/dashboard/projects', project._id]);
  }

  async acceptProject(project: Project) {
    try {
      await this.projectService.updateProjectAsync(project._id, { status: 'accepted' });
      this.loadProjects(); // Reload projects
    } catch (error: any) {
      console.error('Error accepting project:', error);
      this.error.set('Failed to accept project');
    }
  }

  async rejectProject(project: Project) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await this.projectService.updateProjectAsync(project._id, { 
        status: 'rejected',
        rejection_reason: reason 
      });
      this.loadProjects(); // Reload projects
    } catch (error: any) {
      console.error('Error rejecting project:', error);
      this.error.set('Failed to reject project');
    }
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}

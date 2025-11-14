import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { ReactiveFormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../shared/services/auth.service';
import { ProjectService, Project } from '../../shared/services/project.service';
import { DashboardSubheaderComponent } from '../../shared/components/dashboard-subheader/dashboard-subheader.component';
import { BusinessSearchFilterComponent } from '../../shared/components/business-search-filter/business-search-filter.component';
import { ProjectCardComponent } from './components/project-card/project-card.component';
import { ProjectListCardComponent } from './components/project-list-card/project-list-card.component';
import { EmptyStateComponent, EmptyStateButton } from '../../shared/components/empty-state/empty-state.component';

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
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatMenuModule,
    ReactiveFormsModule,
    DashboardSubheaderComponent,
    BusinessSearchFilterComponent,
    ProjectCardComponent,
    ProjectListCardComponent,
    EmptyStateComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly myProjects = signal<Project[]>([]);
  readonly businessProjects = signal<Project[]>([]);
  readonly viewMode = signal<'grid' | 'list'>('list'); // Default to list view for projects
  readonly projectType = signal<'all' | 'my_requests' | 'business_inquiries'>('all');
  readonly selectedStatus = signal<string>('all');
  readonly searchTerm = signal<string>('');
  readonly isMobile = signal(false);
  readonly displayedColumns = signal<string[]>(['title', 'client', 'budget', 'status', 'date', 'actions']);

  // Computed signals
  readonly user = this.authService.user;
  readonly filteredProjects = computed(() => {
    let projects: Project[] = [];
    
    // Get projects based on type
    if (this.projectType() === 'my_requests') {
      projects = this.myProjects();
    } else if (this.projectType() === 'business_inquiries') {
      projects = this.businessProjects();
    } else {
      // 'all' - combine both
      projects = [...this.myProjects(), ...this.businessProjects()];
    }
    
    // Filter by status
    const statusFilter = this.selectedStatus();
    if (statusFilter !== 'all') {
      projects = projects.filter(p => p.status === statusFilter);
    }
    
    // Filter by search term
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      projects = projects.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    }
    
    return projects;
  });

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Setup mobile detection
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
    });
    
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

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'requested': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'started': 'bg-indigo-100 text-indigo-800',
      'payment_requested': 'bg-orange-100 text-orange-800',
      'payment_pending': 'bg-orange-100 text-orange-800',
      'payment_completed': 'bg-emerald-100 text-emerald-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'awaiting_client_approval': 'bg-amber-100 text-amber-800',
      'completed': 'bg-green-100 text-green-800',
      'settled': 'bg-teal-100 text-teal-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'requested': 'Requested',
      'under_review': 'Under Review',
      'accepted': 'Accepted',
      'started': 'Started',
      'payment_requested': 'Payment Requested',
      'payment_pending': 'Payment Pending',
      'payment_completed': 'Payment Completed',
      'in_progress': 'In Progress',
      'awaiting_client_approval': 'Awaiting Approval',
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

  // Empty state callback
  handleClearFilters = () => {
    this.clearSearch();
    this.selectedStatus.set('all');
  };
}

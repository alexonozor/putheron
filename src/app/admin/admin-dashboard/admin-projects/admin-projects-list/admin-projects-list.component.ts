import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminProjectsService, ProjectStats, AdminProjectFilters, ProjectsListResponse } from '../admin-projects.service';
import { Project } from '../../../../shared/services/project.service';

@Component({
  selector: 'app-admin-projects-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-projects-list.component.html',
  styleUrl: './admin-projects-list.component.scss'
})
export class AdminProjectsListComponent implements OnInit {
  private readonly adminProjectsService = inject(AdminProjectsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Signals
  projects = signal<Project[]>([]);
  stats = signal<ProjectStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedProjects = signal<Set<string>>(new Set());
  
  // Pagination
  currentPage = signal(1);
  totalPages = signal(0);
  totalProjects = signal(0);
  perPage = 25;

  // Filters
  filterForm: FormGroup;
  showAdvancedFilters = signal(false);
  
  // View options
  viewMode = signal<'list' | 'grid'>('list');
  sortBy = signal<'createdAt' | 'updatedAt' | 'offered_price' | 'deadline' | 'status'>('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      dateFrom: [''],
      dateTo: [''],
      minAmount: [''],
      maxAmount: [''],
      businessId: [''],
      clientId: ['']
    });
  }

  async ngOnInit() {
    await this.loadProjects();
    await this.loadStats();
    
    // Watch for filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.onFiltersChange();
    });
  }

  async loadProjects() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const filters: AdminProjectFilters = {
        ...this.filterForm.value,
        page: this.currentPage(),
        limit: this.perPage,
        sortBy: this.sortBy(),
        sortOrder: this.sortOrder()
      };

      const response: ProjectsListResponse = await this.adminProjectsService.getProjectsAsync(filters);
      
      // Ensure response and its properties exist
      if (response && response.projects) {
        this.projects.set(response.projects);
      } else {
        this.projects.set([]);
      }
      
      if (response && response.pagination) {
        this.totalProjects.set(response.pagination.total || 0);
        this.totalPages.set(response.pagination.totalPages || 0);
      } else {
        this.totalProjects.set(0);
        this.totalPages.set(0);
      }
    } catch (err: any) {
      console.error('Error loading projects:', err);
      this.error.set('Failed to load projects. Please try again.');
      // Set safe defaults on error
      this.projects.set([]);
      this.totalProjects.set(0);
      this.totalPages.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  async loadStats() {
    try {
      const stats = await this.adminProjectsService.getProjectStatsAsync();
      this.stats.set(stats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      // Set null on error, template should handle this
      this.stats.set(null);
    }
  }

  onFiltersChange() {
    this.currentPage.set(1);
    this.debounceLoadProjects();
  }

  private debounceTimer: any;
  private debounceLoadProjects() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.loadProjects();
    }, 500);
  }

  onSortChange(field: typeof this.sortBy extends () => infer T ? T : never) {
    if (this.sortBy() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('desc');
    }
    this.loadProjects();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadProjects();
  }

  // Selection methods
  toggleProjectSelection(projectId: string) {
    const selected = new Set(this.selectedProjects());
    if (selected.has(projectId)) {
      selected.delete(projectId);
    } else {
      selected.add(projectId);
    }
    this.selectedProjects.set(selected);
  }

  toggleAllSelection() {
    const allSelected = this.allProjectsSelected();
    if (allSelected) {
      this.selectedProjects.set(new Set());
    } else {
      this.selectedProjects.set(new Set(this.projects().map(p => p._id)));
    }
  }

  clearSelection() {
    this.selectedProjects.set(new Set());
  }

  // Project actions
  viewProjectDetails(projectId: string) {
    this.router.navigate(['/admin/dashboard/projects', projectId]);
  }

  async toggleArchiveProject(project: Project) {
    try {
      await this.adminProjectsService.toggleArchiveProjectAsync(project._id);
      await this.loadProjects();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error toggling archive status:', err);
      this.error.set('Failed to update project status.');
    }
  }

  async deleteProject(project: Project) {
    if (!confirm(`Are you sure you want to permanently delete the project "${project.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await this.adminProjectsService.deleteProjectAsync(project._id);
      await this.loadProjects();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      this.error.set('Failed to delete project.');
    }
  }

  // Bulk actions
  async bulkUpdateStatus(status: string) {
    const selectedIds = Array.from(this.selectedProjects());
    if (selectedIds.length === 0) return;

    try {
      await this.adminProjectsService.bulkUpdateProjectsAsync(selectedIds, { status });
      this.clearSelection();
      await this.loadProjects();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error bulk updating projects:', err);
      this.error.set('Failed to update projects.');
    }
  }

  async bulkArchive(archive: boolean) {
    const selectedIds = Array.from(this.selectedProjects());
    if (selectedIds.length === 0) return;

    try {
      await this.adminProjectsService.bulkUpdateProjectsAsync(selectedIds, { is_archived: archive });
      this.clearSelection();
      await this.loadProjects();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error bulk archiving projects:', err);
      this.error.set('Failed to update projects.');
    }
  }

  // Export functionality
  async exportProjects() {
    try {
      const filters: AdminProjectFilters = this.filterForm.value;
      const blob = await this.adminProjectsService.exportProjectsAsync(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `projects-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting projects:', err);
      this.error.set('Failed to export projects.');
    }
  }

  // Clear filters
  clearFilters() {
    this.filterForm.reset();
    this.showAdvancedFilters.set(false);
    this.currentPage.set(1);
    this.loadProjects();
  }

  // Computed values
  allProjectsSelected = computed(() => {
    const selected = this.selectedProjects();
    const projects = this.projects();
    return projects.length > 0 && projects.every(p => selected.has(p._id));
  });

  someProjectsSelected = computed(() => {
    const selected = this.selectedProjects();
    return selected.size > 0 && !this.allProjectsSelected();
  });

  selectedCount = computed(() => this.selectedProjects().size);

  filteredProjectsCount = computed(() => this.projects().length);

  completionRate = computed(() => {
    const stats = this.stats();
    return stats ? this.adminProjectsService.calculateCompletionRate(stats) : 0;
  });

  // Utility methods
  getStatusColor = this.adminProjectsService.getStatusColor.bind(this.adminProjectsService);
  getStatusLabel = this.adminProjectsService.getStatusLabel.bind(this.adminProjectsService);
  formatCurrency = this.adminProjectsService.formatCurrency.bind(this.adminProjectsService);
  formatDate = this.adminProjectsService.formatDate.bind(this.adminProjectsService);
  getProjectPriorityColor = this.adminProjectsService.getProjectPriorityColor.bind(this.adminProjectsService);
  
  // Math for template
  Math = Math;

  getClientName(project: Project): string {
    if (typeof project.client_id === 'string') return 'Unknown Client';
    const client = project.client_id as any;
    return `${client.first_name} ${client.last_name}`;
  }

  getBusinessName(project: Project): string {
    if (typeof project.business_id === 'string') return 'Unknown Business';
    const business = project.business_id as any;
    return business.name;
  }

  getDaysUntilDeadline(project: Project): number | null {
    if (!project.deadline) return null;
    const deadline = new Date(project.deadline);
    const now = new Date();
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDeadlineText(project: Project): string {
    const days = this.getDaysUntilDeadline(project);
    if (days === null) return 'No deadline';
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  }
}

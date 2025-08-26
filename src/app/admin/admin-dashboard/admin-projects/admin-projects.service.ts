import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from '../../../shared/services/config.service';
import { Project } from '../../../shared/services/project.service';

export interface ProjectStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  settled: number;
  awaiting_client_approval: number;
  total_value: number;
  monthly_projects: number;
  completion_rate: number;
}

export interface AdminUpdateProjectDto {
  status?: string;
  rejection_reason?: string;
  admin_notes?: string;
  is_archived?: boolean;
  deadline?: string;
  offered_price?: number;
  additional_notes?: string;
}

export interface BackendProjectsResponse {
  success: boolean;
  data: {
    projects: Project[];
    total: number;
    page: number;
    totalPages: number;
  };
  message: string;
}

export interface ProjectsListResponse {
  projects: Project[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: ProjectStats;
}

export interface AdminProjectFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  businessId?: string;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'offered_price' | 'deadline' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUpdateProjectDto {
  status?: string;
  offered_price?: number;
  deadline?: string;
  rejection_reason?: string;
  admin_notes?: string;
  is_archived?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminProjectsService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  
  private get apiUrl(): string {
    return this.configService.getApiUrl('/admin/projects');
  }

  // Get all projects with filtering and pagination
  getProjects(filters: AdminProjectFilters = {}): Observable<BackendProjectsResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<BackendProjectsResponse>(this.apiUrl, { params });
  }

  // Get projects async
  async getProjectsAsync(filters: AdminProjectFilters = {}): Promise<ProjectsListResponse> {
    const backendResponse = await firstValueFrom(this.getProjects(filters));
    
    // Transform backend response to frontend format
    const perPage = filters.limit || 25;
    const currentPage = backendResponse.data.page || 1;
    const total = backendResponse.data.total || 0;
    const totalPages = backendResponse.data.totalPages || 0;
    
    return {
      projects: backendResponse.data.projects || [],
      pagination: {
        total,
        totalPages,
        currentPage,
        perPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      },
      stats: null as any // Will be loaded separately
    };
  }

  // Get project statistics
  getProjectStats(): Observable<{ success: boolean; data: ProjectStats; message: string }> {
    return this.http.get<{ success: boolean; data: ProjectStats; message: string }>(
      `${this.apiUrl}/stats`
    );
  }

  // Get project stats async
  async getProjectStatsAsync(): Promise<ProjectStats> {
    const response = await firstValueFrom(this.getProjectStats());
    return response.data;
  }

  // Get single project (admin view with all details)
  getProject(id: string): Observable<{ success: boolean; data: Project; message: string }> {
    return this.http.get<{ success: boolean; data: Project; message: string }>(
      `${this.apiUrl}/${id}?populate=selected_services,business_id,client_id,business_owner_id`
    );
  }

  // Get project async
  async getProjectAsync(id: string): Promise<Project> {
    const response = await firstValueFrom(this.getProject(id));
    return response.data;
  }

  // Update project (admin)
  updateProject(id: string, updateData: AdminUpdateProjectDto): Observable<{ success: boolean; data: Project; message: string }> {
    return this.http.patch<{ success: boolean; data: Project; message: string }>(
      `${this.apiUrl}/${id}`,
      updateData
    );
  }

  // Update project async
  async updateProjectAsync(id: string, updateData: AdminUpdateProjectDto): Promise<Project> {
    const response = await firstValueFrom(this.updateProject(id, updateData));
    return response.data;
  }

  // Archive/unarchive project
  toggleArchiveProject(id: string): Observable<{ success: boolean; data: Project; message: string }> {
    return this.http.patch<{ success: boolean; data: Project; message: string }>(
      `${this.apiUrl}/${id}/toggle-archive`,
      {}
    );
  }

  // Archive project async
  async toggleArchiveProjectAsync(id: string): Promise<Project> {
    const response = await firstValueFrom(this.toggleArchiveProject(id));
    return response.data;
  }

  // Delete project (admin only - permanent deletion)
  deleteProject(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`
    );
  }

  // Delete project async
  async deleteProjectAsync(id: string): Promise<void> {
    await firstValueFrom(this.deleteProject(id));
  }

  // Bulk operations
  bulkUpdateProjects(projectIds: string[], updateData: Partial<AdminUpdateProjectDto>): Observable<{ success: boolean; data: { updated: number }; message: string }> {
    return this.http.patch<{ success: boolean; data: { updated: number }; message: string }>(
      `${this.apiUrl}/bulk-update`,
      { projectIds, updateData }
    );
  }

  // Bulk update async
  async bulkUpdateProjectsAsync(projectIds: string[], updateData: Partial<AdminUpdateProjectDto>): Promise<{ updated: number }> {
    const response = await firstValueFrom(this.bulkUpdateProjects(projectIds, updateData));
    return response.data;
  }

  // Export projects to CSV
  exportProjects(filters: AdminProjectFilters = {}): Observable<Blob> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // Export projects async
  async exportProjectsAsync(filters: AdminProjectFilters = {}): Promise<Blob> {
    const response = await firstValueFrom(this.exportProjects(filters));
    return response;
  }

  // Get project activity/history
  getProjectActivity(id: string): Observable<{ success: boolean; data: { project_id: string; activity: any[]; total_activities: number }; message: string }> {
    return this.http.get<{ success: boolean; data: { project_id: string; activity: any[]; total_activities: number }; message: string }>(
      `${this.apiUrl}/${id}/activity`
    );
  }

  // Get project activity async
  async getProjectActivityAsync(id: string): Promise<any[]> {
    const response = await firstValueFrom(this.getProjectActivity(id));
    return response.data.activity || [];
  }

  // Utility methods
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'text-yellow-600 bg-yellow-100 border-yellow-200',
      'accepted': 'text-blue-600 bg-blue-100 border-blue-200',
      'rejected': 'text-red-600 bg-red-100 border-red-200',
      'in_progress': 'text-purple-600 bg-purple-100 border-purple-200',
      'awaiting_client_approval': 'text-orange-600 bg-orange-100 border-orange-200',
      'completed': 'text-green-600 bg-green-100 border-green-200',
      'cancelled': 'text-gray-600 bg-gray-100 border-gray-200',
      'settled': 'text-emerald-600 bg-emerald-100 border-emerald-200'
    };
    return colors[status] || 'text-gray-600 bg-gray-100 border-gray-200';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'in_progress': 'In Progress',
      'awaiting_client_approval': 'Awaiting Approval',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'settled': 'Settled'
    };
    return labels[status] || status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateCompletionRate(stats: ProjectStats): number {
    const totalCompleted = stats.completed + stats.settled;
    const totalProcessed = stats.total - stats.pending;
    return totalProcessed > 0 ? Math.round((totalCompleted / totalProcessed) * 100) : 0;
  }

  getProjectPriorityColor(project: Project): string {
    if (!project.deadline) return '';
    
    const deadline = new Date(project.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) return 'border-l-4 border-red-500'; // Overdue
    if (daysUntilDeadline <= 3) return 'border-l-4 border-orange-500'; // Due soon
    if (daysUntilDeadline <= 7) return 'border-l-4 border-yellow-500'; // Due this week
    
    return '';
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

export interface Project {
  _id: string;
  client_id: string | {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  business_id: string | {
    _id: string;
    name: string;
    logo_url?: string;
    slug: string;
  };
  business_owner_id: string | {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  title: string;
  description?: string;
  selected_services: string[] | {
    _id: string;
    name: string;
    price?: number;
    pricing_type?: string;
    description?: string;
    short_description?: string;
    duration?: number;
    features?: string[];
  }[];
  offered_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'awaiting_client_approval' | 'completed' | 'cancelled';
  deadline?: Date | string;
  additional_notes?: string;
  image_url?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    public_id: string;
  }>;
  accepted_at?: Date | string;
  rejected_at?: Date | string;
  completed_at?: Date | string;
  rejection_reason?: string;
  chat_room_id?: string;
  is_archived: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateProjectDto {
  title: string;
  description?: string;
  business_id: string;
  selected_services: string[];
  offered_price?: number;
  deadline?: string;
  additional_notes?: string;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  selected_services?: string[];
  offered_price?: number;
  deadline?: string;
  additional_notes?: string;
  status?: string;
  rejection_reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  
  private get apiUrl(): string {
    return this.configService.getApiUrl('/projects');
  }

  // Create a new project
  createProject(projectData: CreateProjectDto): Observable<{ success: boolean; data: Project; message: string }> {
    return this.http.post<{ success: boolean; data: Project; message: string }>(
      this.apiUrl,
      projectData
    );
  }

  // Create project async
  async createProjectAsync(projectData: CreateProjectDto): Promise<Project> {
    const response = await firstValueFrom(this.createProject(projectData));
    return response.data;
  }

  // Get all projects for current user
  getMyProjects(role: 'client' | 'business_owner' = 'client'): Observable<{ success: boolean; data: Project[]; message: string }> {
    return this.http.get<{ success: boolean; data: Project[]; message: string }>(
      `${this.apiUrl}?role=${role}`
    );
  }

  // Get projects async
  async getMyProjectsAsync(role: 'client' | 'business_owner' = 'client'): Promise<Project[]> {
    const response = await firstValueFrom(this.getMyProjects(role));
    return response.data;
  }

  // Get all projects for user (both as client and business owner)
  async getAllMyProjectsAsync(): Promise<Project[]> {
    try {
      const [clientProjects, businessProjects] = await Promise.all([
        this.getMyProjectsAsync('client'),
        this.getMyProjectsAsync('business_owner')
      ]);
      
      // Combine and deduplicate projects (in case a user is both client and business owner for same project)
      const allProjects = [...clientProjects, ...businessProjects];
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p._id === project._id)
      );
      
      return uniqueProjects;
    } catch (error) {
      console.error('Error loading all projects:', error);
      return [];
    }
  }

  // Get projects for a specific business
  getBusinessProjects(businessId: string): Observable<{ success: boolean; data: Project[]; message: string }> {
    return this.http.get<{ success: boolean; data: Project[]; message: string }>(
      `${this.apiUrl}/business/${businessId}`
    );
  }

  // Get business projects async
  async getBusinessProjectsAsync(businessId: string): Promise<Project[]> {
    const response = await firstValueFrom(this.getBusinessProjects(businessId));
    return response.data;
  }

  // Get business portfolio (completed projects for public viewing)
  getBusinessPortfolio(businessId: string): Observable<{ success: boolean; data: Project[]; message: string }> {
    return this.http.get<{ success: boolean; data: Project[]; message: string }>(
      `${this.apiUrl}/business/${businessId}/portfolio`
    );
  }

  // Get business portfolio async
  async getBusinessPortfolioAsync(businessId: string): Promise<Project[]> {
    const response = await firstValueFrom(this.getBusinessPortfolio(businessId));
    return response.data;
  }

  // Get projects by status
  getProjectsByStatus(status: string, role: 'client' | 'business_owner' = 'client'): Observable<{ success: boolean; data: Project[]; message: string }> {
    return this.http.get<{ success: boolean; data: Project[]; message: string }>(
      `${this.apiUrl}/status/${status}?role=${role}`
    );
  }

  // Get projects by status async
  async getProjectsByStatusAsync(status: string, role: 'client' | 'business_owner' = 'client'): Promise<Project[]> {
    const response = await firstValueFrom(this.getProjectsByStatus(status, role));
    return response.data;
  }

  // Get single project
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

  // Update project
  updateProject(id: string, updateData: UpdateProjectDto): Observable<{ success: boolean; data: Project; message: string }> {
    return this.http.patch<{ success: boolean; data: Project; message: string }>(
      `${this.apiUrl}/${id}`,
      updateData
    );
  }

  // Update project async
  async updateProjectAsync(id: string, updateData: UpdateProjectDto): Promise<Project> {
    const response = await firstValueFrom(this.updateProject(id, updateData));
    return response.data;
  }

  // Delete project
  deleteProject(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`
    );
  }

  // Delete project async
  async deleteProjectAsync(id: string): Promise<void> {
    await firstValueFrom(this.deleteProject(id));
  }

  // Calculate payment intent for service selection
  calculatePaymentIntent(serviceIds: string[]): Observable<{ success: boolean; data: { clientSecret: string; paymentIntentId: string; totalAmount: number }; message: string }> {
    return this.http.post<{ success: boolean; data: { clientSecret: string; paymentIntentId: string; totalAmount: number }; message: string }>(
      `${this.apiUrl}/calculate-payment-intent`,
      { serviceIds }
    );
  }

  // Calculate payment intent async
  async calculatePaymentIntentAsync(serviceIds: string[]): Promise<{ clientSecret: string; paymentIntentId: string; totalAmount: number }> {
    const response = await firstValueFrom(this.calculatePaymentIntent(serviceIds));
    return response.data;
  }

  // Create project after payment
  createProjectAfterPayment(createProjectDto: CreateProjectDto, paymentIntentId: string): Observable<{ success: boolean; data: Project; message: string }> {
    return this.http.post<{ success: boolean; data: Project; message: string }>(
      `${this.apiUrl}/create-after-payment`,
      { ...createProjectDto, paymentIntentId }
    );
  }

  // Create project after payment async
  async createProjectAfterPaymentAsync(createProjectDto: CreateProjectDto, paymentIntentId: string): Promise<Project> {
    try {
      console.log('ProjectService: Creating project after payment');
      console.log('Project Data:', createProjectDto);
      console.log('Payment Intent ID:', paymentIntentId);
      
      const response = await firstValueFrom(this.createProjectAfterPayment(createProjectDto, paymentIntentId));
      console.log('ProjectService: Project creation response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create project');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('ProjectService: Error creating project after payment:', error);
      
      // Enhanced error handling
      if (error.error) {
        console.error('ProjectService: Server error details:', error.error);
        throw error; // Preserve the original error structure
      }
      
      throw error;
    }
  }

  // Image upload methods
  uploadProjectImage(projectId: string, file: File): Observable<{ success: boolean; data: any; message: string }> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<{ success: boolean; data: any; message: string }>(
      `${this.apiUrl}/${projectId}/upload-image`,
      formData
    );
  }

  async uploadProjectImageAsync(projectId: string, file: File): Promise<any> {
    const response = await firstValueFrom(this.uploadProjectImage(projectId, file));
    if (!response.success) {
      throw new Error(response.message || 'Failed to upload project image');
    }
    return response.data;
  }

  // File attachments upload methods
  uploadProjectAttachments(projectId: string, files: File[]): Observable<{ success: boolean; data: any; message: string }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });

    return this.http.post<{ success: boolean; data: any; message: string }>(
      `${this.apiUrl}/${projectId}/upload-attachments`,
      formData
    );
  }

  async uploadProjectAttachmentsAsync(projectId: string, files: File[]): Promise<any> {
    const response = await firstValueFrom(this.uploadProjectAttachments(projectId, files));
    if (!response.success) {
      throw new Error(response.message || 'Failed to upload project attachments');
    }
    return response.data;
  }
}

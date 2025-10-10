import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

export interface User {
  _id: string;
  username?: string;
  email: string;
  firstName?: string; // Legacy support
  lastName?: string;  // Legacy support
  first_name?: string; // New API format
  last_name?: string;  // New API format
  isActive?: boolean;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private getApiUrl(endpoint: string): string {
    return this.config.getApiUrl(`/users${endpoint}`);
  }

  // Get all users
  getAllUsers(filters?: {
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Observable<ApiResponse<User[]>> {
    const params: any = {};
    if (filters?.isActive !== undefined) params.isActive = filters.isActive.toString();
    if (filters?.search) params.search = filters.search;
    if (filters?.limit) params.limit = filters.limit.toString();
    if (filters?.offset) params.offset = filters.offset.toString();

    return this.http.get<ApiResponse<User[]>>(
      this.getApiUrl(''),
      { params }
    );
  }

  async getAllUsersAsync(filters?: {
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const response = await firstValueFrom(this.getAllUsers(filters));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch users');
    }
    return response.data;
  }

  // Get user by ID
  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(
      this.getApiUrl(`/${id}`)
    );
  }

  async getUserByIdAsync(id: string): Promise<User> {
    const response = await firstValueFrom(this.getUserById(id));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch user');
    }
    return response.data;
  }
}

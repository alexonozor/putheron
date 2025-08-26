import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from '../../../shared/services/config.service';

export interface Review {
  _id: string;
  user_id: string | {
    _id: string;
    first_name: string;
    last_name: string;
    email:   any;
    profile_picture?: string;
  };
  business_id: string | {
    _id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  project_id: string | {
    _id: string;
    title: string;
    status: string;
    description?: string;
    offered_price?: number;
    deadline?: string;
  };
  rating: number;
  review_text?: string;
  service_quality?: number;
  communication?: number;
  timeliness?: number;
  value_for_money?: number;
  is_verified: boolean;
  is_flagged: boolean;
  flagged_reason?: string;
  verified_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  rating?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  businessId?: string;
  userId?: string;
  isVerified?: boolean;
  isFlagged?: boolean;
}

export interface ReviewStats {
  total: number;
  verified: number;
  flagged: number;
  averageRating: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  detailedAverages: {
    service_quality: number;
    communication: number;
    timeliness: number;
    value_for_money: number;
  };
  monthlyGrowth: number;
}

export interface ReviewsListResponse {
  reviews: Review[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: ReviewStats | null;
}

interface BackendReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminReviewsService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  
  private get apiUrl(): string {
    return this.configService.getApiUrl('/admin/reviews');
  }

  // Get reviews with filters
  getReviews(filters: AdminReviewFilters = {}): Observable<BackendReviewsResponse> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    if (filters.rating) params = params.set('rating', filters.rating.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.businessId) params = params.set('businessId', filters.businessId);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.isVerified !== undefined) params = params.set('isVerified', filters.isVerified.toString());
    if (filters.isFlagged !== undefined) params = params.set('isFlagged', filters.isFlagged.toString());

    return this.http.get<BackendReviewsResponse>(this.apiUrl, { params });
  }

  // Get reviews async
  async getReviewsAsync(filters: AdminReviewFilters = {}): Promise<ReviewsListResponse> {
    const backendResponse = await firstValueFrom(this.getReviews(filters));
    
    // Transform backend response to frontend format
    const perPage = filters.limit || 25;
    const currentPage = backendResponse.data.page || 1;
    const total = backendResponse.data.total || 0;
    const totalPages = backendResponse.data.totalPages || 0;
    
    return {
      reviews: backendResponse.data.reviews || [],
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

  // Get review statistics
  getReviewStats(): Observable<{ success: boolean; data: ReviewStats; message: string }> {
    return this.http.get<{ success: boolean; data: ReviewStats; message: string }>(
      `${this.apiUrl}/stats`
    );
  }

  // Get review stats async
  async getReviewStatsAsync(): Promise<ReviewStats> {
    const response = await firstValueFrom(this.getReviewStats());
    return response.data;
  }

  // Get single review (admin view with all details)
  getReview(id: string): Observable<{ success: boolean; data: Review; message: string }> {
    return this.http.get<{ success: boolean; data: Review; message: string }>(
      `${this.apiUrl}/${id}`
    );
  }

  // Get review async
  async getReviewAsync(id: string): Promise<Review> {
    const response = await firstValueFrom(this.getReview(id));
    return response.data;
  }

  // Update review status (verify, flag, etc.)
  updateReviewStatus(id: string, isVerified: boolean, isFlagged: boolean, flaggedReason?: string): Observable<{ success: boolean; data: Review; message: string }> {
    return this.http.patch<{ success: boolean; data: Review; message: string }>(
      `${this.apiUrl}/${id}/status`,
      { is_verified: isVerified, is_flagged: isFlagged, flagged_reason: flaggedReason }
    );
  }

  // Update review status async
  async updateReviewStatusAsync(id: string, isVerified: boolean, isFlagged: boolean, flaggedReason?: string): Promise<Review> {
    const response = await firstValueFrom(this.updateReviewStatus(id, isVerified, isFlagged, flaggedReason));
    return response.data;
  }

  // Delete review (admin)
  deleteReview(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`
    );
  }

  // Delete review async
  async deleteReviewAsync(id: string): Promise<void> {
    await firstValueFrom(this.deleteReview(id));
  }

  // Bulk update reviews
  bulkUpdateReviews(reviewIds: string[], updateData: { is_verified?: boolean; is_flagged?: boolean; flagged_reason?: string }): Observable<{ success: boolean; data: { updated: number }; message: string }> {
    return this.http.post<{ success: boolean; data: { updated: number }; message: string }>(
      `${this.apiUrl}/bulk-update`,
      { reviewIds, updateData }
    );
  }

  // Bulk update reviews async
  async bulkUpdateReviewsAsync(reviewIds: string[], updateData: { is_verified?: boolean; is_flagged?: boolean; flagged_reason?: string }): Promise<{ updated: number }> {
    const response = await firstValueFrom(this.bulkUpdateReviews(reviewIds, updateData));
    return response.data;
  }

  // Export reviews
  exportReviews(filters: { rating?: number; search?: string; dateFrom?: string; dateTo?: string; businessId?: string; format?: 'csv' | 'excel' }): Observable<{ success: boolean; data: any; message: string }> {
    let params = new HttpParams();

    if (filters.rating) params = params.set('rating', filters.rating.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.businessId) params = params.set('businessId', filters.businessId);
    if (filters.format) params = params.set('format', filters.format);

    return this.http.get<{ success: boolean; data: any; message: string }>(
      `${this.apiUrl}/export`,
      { params }
    );
  }

  // Export reviews async
  async exportReviewsAsync(filters: { rating?: number; search?: string; dateFrom?: string; dateTo?: string; businessId?: string; format?: 'csv' | 'excel' }): Promise<any> {
    const response = await firstValueFrom(this.exportReviews(filters));
    return response.data;
  }

  // Helper methods for UI
  getStatusColor(isVerified: boolean, isFlagged: boolean): string {
    if (isFlagged) return 'bg-red-100 text-red-800';
    if (isVerified) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  }

  getStatusLabel(isVerified: boolean, isFlagged: boolean): string {
    if (isFlagged) return 'Flagged';
    if (isVerified) return 'Verified';
    return 'Unverified';
  }

  getRatingColor(rating: number): string {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  }

  formatDate(date: string | Date): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  }

  getUserName(user: Review['user_id']): string {
    if (typeof user === 'object' && user.first_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return 'Unknown User';
  }

  getBusinessName(business: Review['business_id']): string {
    if (typeof business === 'object' && business.name) {
      return business.name;
    }
    return 'Unknown Business';
  }

  getProjectTitle(project: Review['project_id']): string {
    if (typeof project === 'object' && project.title) {
      return project.title;
    }
    return 'Unknown Project';
  }

  generateStarDisplay(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }
}

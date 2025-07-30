import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { Review, CreateReviewRequest, ReviewStats, CompletedProjectForReview } from '../interfaces/review.interface';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  private apiUrl = this.configService.apiBaseUrl;

  // Create a new review
  createReview(reviewData: CreateReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.apiUrl}/reviews`, reviewData);
  }

  async createReviewAsync(reviewData: CreateReviewRequest): Promise<Review> {
    const response = await firstValueFrom(this.createReview(reviewData));
    return response.data;
  }

  // Get reviews for a business
  getBusinessReviews(businessId: string): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${this.apiUrl}/reviews/business/${businessId}`);
  }

  async getBusinessReviewsAsync(businessId: string): Promise<Review[]> {
    try {
      const response = await firstValueFrom(this.getBusinessReviews(businessId));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching business reviews:', {
        businessId,
        error: error.message,
        status: error.status,
        url: error.url
      });
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // Get business rating stats
  getBusinessRatingStats(businessId: string): Observable<ApiResponse<ReviewStats>> {
    return this.http.get<ApiResponse<ReviewStats>>(`${this.apiUrl}/reviews/business/${businessId}/stats`);
  }

  async getBusinessRatingStatsAsync(businessId: string): Promise<ReviewStats> {
    const response = await firstValueFrom(this.getBusinessRatingStats(businessId));
    return response.data;
  }

  // Get user's own reviews
  getUserReviews(): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${this.apiUrl}/reviews/user/reviews`);
  }

  async getUserReviewsAsync(): Promise<Review[]> {
    const response = await firstValueFrom(this.getUserReviews());
    return response.data;
  }

  // Get completed projects that user can review
  getCompletedProjectsForReview(): Observable<ApiResponse<CompletedProjectForReview[]>> {
    return this.http.get<ApiResponse<CompletedProjectForReview[]>>(`${this.apiUrl}/reviews/user/projects-for-review`);
  }

  async getCompletedProjectsForReviewAsync(): Promise<CompletedProjectForReview[]> {
    try {
      console.log('Fetching completed projects for review...');
      const response = await firstValueFrom(this.getCompletedProjectsForReview());
      console.log('Completed projects response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching completed projects for review:', {
        error: error.message,
        status: error.status,
        url: error.url
      });
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // Check if user can review a specific project
  canUserReviewProject(projectId: string): Observable<ApiResponse<{ can_review: boolean }>> {
    return this.http.get<ApiResponse<{ can_review: boolean }>>(`${this.apiUrl}/reviews/project/${projectId}/can-review`);
  }

  async canUserReviewProjectAsync(projectId: string): Promise<boolean> {
    const response = await firstValueFrom(this.canUserReviewProject(projectId));
    return response.data.can_review;
  }

  // Update a review
  updateReview(reviewId: string, reviewData: Partial<CreateReviewRequest>): Observable<ApiResponse<Review>> {
    return this.http.patch<ApiResponse<Review>>(`${this.apiUrl}/reviews/${reviewId}`, reviewData);
  }

  async updateReviewAsync(reviewId: string, reviewData: Partial<CreateReviewRequest>): Promise<Review> {
    const response = await firstValueFrom(this.updateReview(reviewId, reviewData));
    return response.data;
  }

  // Delete a review
  deleteReview(reviewId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/reviews/${reviewId}`);
  }

  async deleteReviewAsync(reviewId: string): Promise<void> {
    await firstValueFrom(this.deleteReview(reviewId));
  }

  // Helper methods
  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(rating));
    }
    return stars;
  }

  getRatingLabel(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Fair';
    if (rating >= 2.5) return 'Poor';
    return 'Very Poor';
  }

  formatReviewDate(date: Date | string): string {
    if (!date) return 'Date not specified';
    
    const reviewDate = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return reviewDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

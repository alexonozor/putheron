import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Tables } from '../types/database.types';

// Interface for review with user and project details
export interface ReviewWithDetails {
  id: number;
  rating: number;
  review_text: string | null;
  service_quality: number | null;
  communication: number | null;
  timeliness: number | null;
  value: number | null;
  created_at: string | null;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  project_title: string | null;
  project_completion_date: string | null;
}

// Interface for review stats
export interface ReviewStats {
  business_id: number;
  business_name: string;
  average_rating: number;
  review_count: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  avg_service_quality: number;
  avg_communication: number;
  avg_timeliness: number;
  avg_value: number;
}

// Interface for user business project
export interface UserBusinessProject extends Tables<'user_business_projects'> {
  business?: {
    name: string;
    logo_url: string | null;
  } | null;
  project?: {
    title: string;
    description: string | null;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private supabaseService = inject(SupabaseService);

  async getBusinessReviews(businessId: number): Promise<ReviewWithDetails[]> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('business_reviews')
        .select(`
          id,
          rating,
          review_text,
          service_quality,
          communication,
          timeliness,
          value,
          created_at,
          user_id,
          user_business_project_id,
          user_business_projects!inner (
            project_title,
            completion_date
          )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching business reviews:', error);
        throw error;
      }

      // Get user profiles separately to avoid relationship issues
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profileData } = await this.supabaseService.getClient()
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', review.user_id)
            .single();

          return {
            id: review.id,
            rating: review.rating,
            review_text: review.review_text,
            service_quality: review.service_quality,
            communication: review.communication,
            timeliness: review.timeliness,
            value: review.value,
            created_at: review.created_at,
            reviewer_name: profileData?.full_name || 'Anonymous',
            reviewer_avatar: profileData?.avatar_url || null,
            project_title: review.user_business_projects?.project_title || null,
            project_completion_date: review.user_business_projects?.completion_date || null
          };
        })
      );

      return reviewsWithProfiles;
    } catch (error) {
      console.error('Error in getBusinessReviews:', error);
      throw error;
    }
  }

  async getBusinessReviewStats(businessId: number): Promise<ReviewStats | null> {
    try {
      // Get business basic info
      const { data: businessData, error: businessError } = await this.supabaseService.getClient()
        .from('businesses')
        .select('id, name, average_rating, review_count')
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('Error fetching business stats:', businessError);
        return null;
      }

      if (!businessData) {
        return null;
      }

      // Get all reviews for detailed analysis
      const { data: reviewsData, error: reviewsError } = await this.supabaseService.getClient()
        .from('business_reviews')
        .select('rating, service_quality, communication, timeliness, value')
        .eq('business_id', businessId);

      if (reviewsError) {
        console.error('Error fetching reviews for stats:', reviewsError);
        // Return basic stats without detailed breakdown
        return {
          business_id: businessData.id,
          business_name: businessData.name,
          average_rating: businessData.average_rating || 0,
          review_count: businessData.review_count || 0,
          five_star_count: 0,
          four_star_count: 0,
          three_star_count: 0,
          two_star_count: 0,
          one_star_count: 0,
          avg_service_quality: 0,
          avg_communication: 0,
          avg_timeliness: 0,
          avg_value: 0
        };
      }

      const reviews = reviewsData || [];
      
      // Calculate rating breakdown
      const ratingBreakdown = {
        five_star_count: reviews.filter(r => r.rating === 5).length,
        four_star_count: reviews.filter(r => r.rating === 4).length,
        three_star_count: reviews.filter(r => r.rating === 3).length,
        two_star_count: reviews.filter(r => r.rating === 2).length,
        one_star_count: reviews.filter(r => r.rating === 1).length,
      };

      // Calculate average detailed ratings
      const serviceQualityRatings = reviews.filter(r => r.service_quality !== null).map(r => r.service_quality!);
      const communicationRatings = reviews.filter(r => r.communication !== null).map(r => r.communication!);
      const timelinessRatings = reviews.filter(r => r.timeliness !== null).map(r => r.timeliness!);
      const valueRatings = reviews.filter(r => r.value !== null).map(r => r.value!);

      const detailedAverages = {
        avg_service_quality: serviceQualityRatings.length > 0 
          ? serviceQualityRatings.reduce((sum, rating) => sum + rating, 0) / serviceQualityRatings.length 
          : 0,
        avg_communication: communicationRatings.length > 0 
          ? communicationRatings.reduce((sum, rating) => sum + rating, 0) / communicationRatings.length 
          : 0,
        avg_timeliness: timelinessRatings.length > 0 
          ? timelinessRatings.reduce((sum, rating) => sum + rating, 0) / timelinessRatings.length 
          : 0,
        avg_value: valueRatings.length > 0 
          ? valueRatings.reduce((sum, rating) => sum + rating, 0) / valueRatings.length 
          : 0
      };

      // Calculate overall average from actual reviews if we have them
      const overallRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : businessData.average_rating || 0;

      return {
        business_id: businessData.id,
        business_name: businessData.name,
        average_rating: overallRating,
        review_count: reviews.length || businessData.review_count || 0,
        ...ratingBreakdown,
        ...detailedAverages
      };
    } catch (error) {
      console.error('Error in getBusinessReviewStats:', error);
      return null;
    }
  }

  async getBusinessReviewStatsFromEdgeFunction(businessId: number): Promise<ReviewStats | null> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .functions
        .invoke('get-business-review-stats', {
          body: { business_id: businessId }
        });

      if (error) {
        console.error('Error fetching business review stats from edge function:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getBusinessReviewStatsFromEdgeFunction:', error);
      return null;
    }
  }

  async getUserBusinessProjects(userId: string): Promise<UserBusinessProject[]> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('user_business_projects')
        .select(`
          *,
          business:businesses!user_business_projects_business_id_fkey (
            name,
            logo_url
          ),
          project:projects!user_business_projects_project_id_fkey (
            title,
            description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user business projects:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserBusinessProjects:', error);
      throw error;
    }
  }

  async createUserBusinessProject(
    userId: string,
    businessId: number,
    projectTitle: string,
    projectDescription?: string,
    startDate?: string,
    status: string = 'in_progress'
  ): Promise<number> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .rpc('create_user_business_project', {
          p_user_id: userId,
          p_business_id: businessId,
          p_project_title: projectTitle,
          p_project_description: projectDescription,
          p_start_date: startDate,
          p_status: status
        });

      if (error) {
        console.error('Error creating user business project:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createUserBusinessProject:', error);
      throw error;
    }
  }

  async completeUserBusinessProject(
    projectId: number,
    completionDate?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .rpc('complete_user_business_project', {
          p_project_id: projectId,
          p_completion_date: completionDate
        });

      if (error) {
        console.error('Error completing user business project:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in completeUserBusinessProject:', error);
      throw error;
    }
  }

  async submitBusinessReview(
    userId: string,
    businessId: number,
    userBusinessProjectId: number,
    rating: number,
    reviewText?: string,
    serviceQuality?: number,
    communication?: number,
    timeliness?: number,
    value?: number
  ): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('business_reviews')
        .insert({
          user_id: userId,
          business_id: businessId,
          user_business_project_id: userBusinessProjectId,
          rating,
          review_text: reviewText,
          service_quality: serviceQuality,
          communication,
          timeliness,
          value
        });

      if (error) {
        console.error('Error submitting business review:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in submitBusinessReview:', error);
      throw error;
    }
  }

  async getBusinessReviewsAndStats(businessId: number): Promise<{
    reviews: ReviewWithDetails[];
    stats: ReviewStats | null;
  }> {
    try {
      // Get business info and reviews in parallel
      const [businessResult, reviewsResult] = await Promise.all([
        this.supabaseService.getClient()
          .from('businesses')
          .select('id, name, average_rating, review_count')
          .eq('id', businessId)
          .single(),
        
        this.supabaseService.getClient()
          .from('business_reviews')
          .select(`
            id,
            rating,
            review_text,
            service_quality,
            communication,
            timeliness,
            value,
            created_at,
            user_id,
            user_business_project_id,
            user_business_projects!inner (
              project_title,
              completion_date
            )
          `)
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
      ]);

      if (businessResult.error) {
        console.error('Error fetching business:', businessResult.error);
        return { reviews: [], stats: null };
      }

      if (reviewsResult.error) {
        console.error('Error fetching reviews:', reviewsResult.error);
        return { reviews: [], stats: null };
      }

      const businessData = businessResult.data;
      const reviewsData = reviewsResult.data || [];

      // Get user profiles for reviewers
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profilesData } = await this.supabaseService.getClient()
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      // Transform reviews
      const reviews: ReviewWithDetails[] = reviewsData.map(review => {
        const profile = profilesMap.get(review.user_id);
        return {
          id: review.id,
          rating: review.rating,
          review_text: review.review_text,
          service_quality: review.service_quality,
          communication: review.communication,
          timeliness: review.timeliness,
          value: review.value,
          created_at: review.created_at,
          reviewer_name: profile?.full_name || 'Anonymous',
          reviewer_avatar: profile?.avatar_url || null,
          project_title: review.user_business_projects?.project_title || null,
          project_completion_date: review.user_business_projects?.completion_date || null
        };
      });

      // Calculate stats
      const ratingBreakdown = {
        five_star_count: reviewsData.filter(r => r.rating === 5).length,
        four_star_count: reviewsData.filter(r => r.rating === 4).length,
        three_star_count: reviewsData.filter(r => r.rating === 3).length,
        two_star_count: reviewsData.filter(r => r.rating === 2).length,
        one_star_count: reviewsData.filter(r => r.rating === 1).length,
      };

      const serviceQualityRatings = reviewsData.filter(r => r.service_quality !== null).map(r => r.service_quality!);
      const communicationRatings = reviewsData.filter(r => r.communication !== null).map(r => r.communication!);
      const timelinessRatings = reviewsData.filter(r => r.timeliness !== null).map(r => r.timeliness!);
      const valueRatings = reviewsData.filter(r => r.value !== null).map(r => r.value!);

      const detailedAverages = {
        avg_service_quality: serviceQualityRatings.length > 0 
          ? serviceQualityRatings.reduce((sum, rating) => sum + rating, 0) / serviceQualityRatings.length 
          : 0,
        avg_communication: communicationRatings.length > 0 
          ? communicationRatings.reduce((sum, rating) => sum + rating, 0) / communicationRatings.length 
          : 0,
        avg_timeliness: timelinessRatings.length > 0 
          ? timelinessRatings.reduce((sum, rating) => sum + rating, 0) / timelinessRatings.length 
          : 0,
        avg_value: valueRatings.length > 0 
          ? valueRatings.reduce((sum, rating) => sum + rating, 0) / valueRatings.length 
          : 0
      };

      const overallRating = reviewsData.length > 0 
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
        : businessData.average_rating || 0;

      const stats: ReviewStats = {
        business_id: businessData.id,
        business_name: businessData.name,
        average_rating: overallRating,
        review_count: reviewsData.length || businessData.review_count || 0,
        ...ratingBreakdown,
        ...detailedAverages
      };

      return { reviews, stats };
    } catch (error) {
      console.error('Error in getBusinessReviewsAndStats:', error);
      return { reviews: [], stats: null };
    }
  }

  // Helper methods
  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
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

  formatReviewDate(dateString: string | null): string {
    if (!dateString) return 'Date not specified';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }
}

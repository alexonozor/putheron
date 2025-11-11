import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom, catchError, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';

export interface Favorite {
  _id: string;
  user_id: string;
  business_id: string | {
    _id: string;
    name: string;
    slug: string;
    description: string;
    logo_url?: string;
    banner_url?: string;
    city: string;
    state: string;
    rating: number;
    review_count: number;
    category_id?: {
      _id: string;
      name: string;
      slug: string;
    };
  };
  business?: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    logo_url?: string;
    banner_url?: string;
    city: string;
    state: string;
    rating: number;
    review_count: number;
    category_id?: {
      name: string;
      slug: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly authService = inject(AuthService);

  private readonly apiUrl = `${this.config.apiBaseUrl}/favorites`;
  
  // Signals for reactive state management
  readonly userFavorites = signal<Favorite[]>([]);
  readonly loading = signal<boolean>(false);
  
  // BehaviorSubject to track favorite business IDs for quick lookups
  private favoritedBusinessIds = new BehaviorSubject<Set<string>>(new Set());
  
  constructor() {
    // Only load user favorites if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.loadUserFavorites();
    }
  }

  /**
   * Add a business to user's favorites
   */
  addToFavorites(businessId: string): Observable<ApiResponse<Favorite>> {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, data: {} as Favorite, error: 'User must be authenticated to add favorites' });
    }

    this.loading.set(true);
    
    return this.http.post<ApiResponse<Favorite>>(this.apiUrl, { business_id: businessId })
      .pipe(
        tap(response => {
          if (response.success) {
            // Update local state
            const currentFavorites = this.userFavorites();
            this.userFavorites.set([...currentFavorites, response.data]);
            
            // Update favorited business IDs set
            const currentIds = new Set(this.favoritedBusinessIds.value);
            currentIds.add(businessId);
            this.favoritedBusinessIds.next(currentIds);
          }
          this.loading.set(false);
        }),
        catchError(error => {
          this.loading.set(false);
          console.error('Error adding to favorites:', error);
          return of({ success: false, data: {} as Favorite, error: error.message });
        })
      );
  }

  /**
   * Remove a business from user's favorites
   */
  removeFromFavorites(businessId: string): Observable<ApiResponse<{ message: string }>> {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, data: { message: '' }, error: 'User must be authenticated to remove favorites' });
    }

    this.loading.set(true);
    
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.apiUrl}/${businessId}`)
      .pipe(
        tap(response => {
          if (response.success) {
            // Update local state
            const currentFavorites = this.userFavorites();
            const updatedFavorites = currentFavorites.filter(fav => fav.business_id !== businessId);
            this.userFavorites.set(updatedFavorites);
            
            // Update favorited business IDs set
            const currentIds = new Set(this.favoritedBusinessIds.value);
            currentIds.delete(businessId);
            this.favoritedBusinessIds.next(currentIds);
          }
          this.loading.set(false);
        }),
        catchError(error => {
          this.loading.set(false);
          console.error('Error removing from favorites:', error);
          return of({ success: false, data: { message: '' }, error: error.message });
        })
      );
  }

  /**
   * Get all user's favorites
   */
  getUserFavorites(): Observable<ApiResponse<Favorite[]>> {
    // Don't make request if user is not authenticated
    if (!this.authService.isAuthenticated()) {
      return of({ success: true, data: [] });
    }

    return this.http.get<ApiResponse<Favorite[]>>(this.apiUrl)
      .pipe(
        tap(response => {
          if (response.success) {
            this.userFavorites.set(response.data);
            
            // Update favorited business IDs set - handle both populated and string business_id
            const businessIds = new Set(response.data.map(fav => 
              typeof fav.business_id === 'string' ? fav.business_id : fav.business_id._id
            ));
            this.favoritedBusinessIds.next(businessIds);
          }
        }),
        catchError(error => {
          console.error('Error fetching favorites:', error);
          return of({ success: false, data: [], error: error.message });
        })
      );
  }

  /**
   * Get favorites count for a specific business (for business owners)
   */
  getBusinessFavoritesCount(businessId: string): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.config.apiBaseUrl}/businesses/${businessId}/favorites-count`);
  }

  /**
   * Check if a business is favorited by current user
   */
  isBusinessFavorited(businessId: string): Observable<boolean> {
    return this.favoritedBusinessIds.asObservable().pipe(
      map(favoritedIds => favoritedIds.has(businessId))
    );
  }

  /**
   * Get favorited business IDs as observable for reactive updates
   */
  getFavoritedBusinessIds(): Observable<Set<string>> {
    return this.favoritedBusinessIds.asObservable();
  }

  /**
   * Async methods for easier usage in components
   */
  async addToFavoritesAsync(businessId: string): Promise<Favorite> {
    const response = await firstValueFrom(this.addToFavorites(businessId));
    if (!response.success) {
      throw new Error(response.error || 'Failed to add to favorites');
    }
    return response.data;
  }

  async removeFromFavoritesAsync(businessId: string): Promise<void> {
    const response = await firstValueFrom(this.removeFromFavorites(businessId));
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove from favorites');
    }
  }

  async getUserFavoritesAsync(): Promise<Favorite[]> {
    try {
      const response = await firstValueFrom(this.getUserFavorites());
      if (!response.success) {
        throw new Error(response.error || 'Failed to load favorites');
      }
      return response.data;
    } catch (error: any) {
      console.error('Error in getUserFavoritesAsync:', error);
      throw error;
    }
  }

  async getBusinessFavoritesCountAsync(businessId: string): Promise<number> {
    const response = await firstValueFrom(this.getBusinessFavoritesCount(businessId));
    if (!response.success) {
      throw new Error(response.error || 'Failed to load favorites count');
    }
    return response.data.count;
  }

  /**
   * Load user favorites on service initialization
   */
  private async loadUserFavorites(): Promise<void> {
    // Only load if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, skipping favorites load');
      return;
    }

    try {
      console.log('Loading user favorites...');
      await this.getUserFavoritesAsync();
      console.log('User favorites loaded successfully');
    } catch (error) {
      console.warn('Failed to load user favorites on initialization:', error);
    }
  }

  /**
   * Refresh favorites data
   */
  async refreshFavorites(): Promise<void> {
    await this.loadUserFavorites();
  }

  /**
   * Toggle favorite status of a business
   */
  async toggleFavorite(businessId: string): Promise<boolean> {
    const isCurrentlyFavorited = this.favoritedBusinessIds.value.has(businessId);
    
    if (isCurrentlyFavorited) {
      await this.removeFromFavoritesAsync(businessId);
      return false;
    } else {
      await this.addToFavoritesAsync(businessId);
      return true;
    }
  }

  /**
   * Get current favorites count
   */
  getFavoritesCount(): number {
    return this.userFavorites().length;
  }

  /**
   * Get favorites count for multiple businesses
   */
  async getMultipleBusinessesFavoritesCount(businessIds: string[]): Promise<{[businessId: string]: number}> {
    try {
      // For now, we'll fetch each business individually
      // In a real app, you'd want a batch endpoint
      const counts: {[businessId: string]: number} = {};
      
      await Promise.all(
        businessIds.map(async (businessId) => {
          try {
            const count = await this.getBusinessFavoritesCountAsync(businessId);
            counts[businessId] = count;
          } catch (error) {
            console.warn(`Failed to get favorites count for business ${businessId}:`, error);
            counts[businessId] = 0;
          }
        })
      );
      
      return counts;
    } catch (error) {
      console.error('Error getting multiple businesses favorites count:', error);
      return {};
    }
  }
}

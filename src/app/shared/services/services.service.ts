import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { 
  Service, 
  ServiceInsert, 
  ServiceUpdate, 
  Category,
  Review,
  ServiceWithProfile 
} from '../types/database.types';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private supabaseService = inject(SupabaseService);
  
  // Signals for reactive state management
  public services = signal<ServiceWithProfile[]>([]);
  public featuredServices = signal<ServiceWithProfile[]>([]);
  public categories = signal<Category[]>([]);
  public currentService = signal<Service | null>(null);
  public serviceReviews = signal<Review[]>([]);
  public loading = signal(false);
  public error = signal<string | null>(null);

  // Computed signals
  public totalServices = computed(() => this.services().length);
  public averageRating = computed(() => {
    const reviews = this.serviceReviews();
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  });

  async loadServices(limit = 20, offset = 0, category?: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      let query = this.supabaseService
        .from('services')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url,
            rating,
            is_verified
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.services.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadFeaturedServices() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService
        .from('services')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url,
            rating,
            is_verified
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(6);
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.featuredServices.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadServiceById(serviceId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.getServiceById(serviceId);
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      if (data) {
        this.currentService.set(data);
        // Increment view count
        await this.incrementViewCount(serviceId);
      }
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async createService(service: ServiceInsert) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.createService(service);
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      // Reload services to include the new one
      await this.loadServices();
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async updateService(serviceId: string, updates: ServiceUpdate) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.updateService(serviceId, updates);
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      // Update current service if it's the one being updated
      if (this.currentService()?.id === serviceId && data) {
        this.currentService.set(data);
      }
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async searchServices(query: string, category?: string, minPrice?: number, maxPrice?: number) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      let dbQuery = this.supabaseService
        .from('services')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url,
            rating,
            is_verified
          )
        `)
        .eq('is_active', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }

      if (minPrice !== undefined) {
        dbQuery = dbQuery.gte('price', minPrice);
      }

      if (maxPrice !== undefined) {
        dbQuery = dbQuery.lte('price', maxPrice);
      }

      const { data, error } = await dbQuery.order('rating', { ascending: false });
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.getCategories();
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.categories.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadServiceReviews(serviceId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.getReviewsForService(serviceId);
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.serviceReviews.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  private async incrementViewCount(serviceId: string) {
    try {
      const { data: currentData } = await this.supabaseService
        .from('services')
        .select('views_count')
        .eq('id', serviceId)
        .single();

      if (currentData) {
        await this.supabaseService
          .from('services')
          .update({ 
            views_count: (currentData.views_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', serviceId);
      }
    } catch (error) {
      // Silently fail for view count increment
      console.warn('Failed to increment view count:', error);
    }
  }

  async uploadServiceImages(files: File[], serviceId: string) {
    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceId}_${index}.${fileExt}`;
      const filePath = `services/${fileName}`;

      const { error } = await this.supabaseService.uploadFile('services', filePath, file);
      
      if (error) throw error;
      
      return this.supabaseService.getPublicUrl('services', filePath);
    });

    return await Promise.all(uploadPromises);
  }

  // Clear service data
  clearServiceData() {
    this.services.set([]);
    this.featuredServices.set([]);
    this.currentService.set(null);
    this.serviceReviews.set([]);
    this.error.set(null);
  }
}

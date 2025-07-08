import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { 
  Business, 
  BusinessInsert, 
  BusinessUpdate, 
  BusinessWithProfile, 
  BusinessSearchFilters,
  BusinessFormData 
} from '../../models';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private supabaseService = inject(SupabaseService);
  
  // Signals for reactive state management
  public businesses = signal<any[]>([]);
  public featuredBusinesses = signal<any[]>([]);
  public currentBusiness = signal<any>(null);
  public userBusinesses = signal<any[]>([]);
  public loading = signal(false);
  public error = signal<string | null>(null);

  // Computed signals
  public totalBusinesses = computed(() => this.businesses().length);
  public verifiedBusinesses = computed(() => 
    this.businesses().filter((b: any) => b.verification_status === 'verified')
  );

  async loadBusinesses(filters?: BusinessSearchFilters) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      let query = this.supabaseService
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      if (filters?.membership_tier) {
        query = query.eq('membership_tier', filters.membership_tier);
      }
      
      if (filters?.verification_status) {
        query = query.eq('verification_status', filters.verification_status);
      }
      
      if (filters?.search_query) {
        query = query.or(`name.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error } = await query;
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.businesses.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadFeaturedBusinesses(limit = 6) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService
        .from('businesses')
        .select('*')
        .eq('verification_status', 'verified')
        .or('membership_tier.eq.spotlight,membership_tier.eq.luminary')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.featuredBusinesses.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadBusinessById(id: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      this.currentBusiness.set(data);
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadUserBusinesses(userId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService
        .from('businesses')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.userBusinesses.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async createBusiness(businessData: BusinessFormData) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const currentUser = this.supabaseService.user;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const businessInsert: BusinessInsert = {
        ...businessData,
        profile_id: currentUser.id
      };

      const { data, error } = await this.supabaseService
        .from('businesses')
        .insert(businessInsert)
        .select()
        .single();
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      // Add to user businesses
      const currentUserBusinesses = this.userBusinesses();
      this.userBusinesses.set([data, ...currentUserBusinesses]);
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async updateBusiness(id: string, updates: BusinessUpdate) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService
        .from('businesses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      // Update current business if it's the same
      const current = this.currentBusiness();
      if (current && current.id === id) {
        this.currentBusiness.set(data);
      }
      
      // Update in user businesses list
      const userBusinesses = this.userBusinesses();
      const updatedList = userBusinesses.map(b => b.id === id ? data : b);
      this.userBusinesses.set(updatedList);
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async deleteBusiness(id: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { error } = await this.supabaseService
        .from('businesses')
        .delete()
        .eq('id', id);
      
      if (error) {
        this.error.set(error.message);
        return { error };
      }
      
      // Remove from user businesses
      const userBusinesses = this.userBusinesses();
      this.userBusinesses.set(userBusinesses.filter(b => b.id !== id));
      
      // Clear current business if it's the deleted one
      const current = this.currentBusiness();
      if (current && current.id === id) {
        this.currentBusiness.set(null);
      }
      
      return { error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async uploadBusinessImage(file: File, businessId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}.${fileExt}`;
      const filePath = `business-images/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await this.supabaseService.uploadFile(
        'business-images', 
        filePath, 
        file
      );

      if (uploadError) {
        this.error.set(uploadError.message);
        return { data: null, error: uploadError };
      }

      // Get public URL
      const publicUrl = this.supabaseService.getPublicUrl('business-images', filePath);

      // Update business with new image URL
      const { data, error } = await this.updateBusiness(businessId, {
        logo_url: publicUrl
      });

      return { data: publicUrl, error };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  // Clear business data
  clearBusinessData() {
    this.businesses.set([]);
    this.featuredBusinesses.set([]);
    this.currentBusiness.set(null);
    this.userBusinesses.set([]);
    this.error.set(null);
  }
}

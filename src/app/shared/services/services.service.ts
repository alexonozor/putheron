// import { Injectable, inject, signal, computed } from '@angular/core';
// import { SupabaseService } from './supabase.service';
// import { Business, BusinessSearchFilters, BUSINESS_CATEGORIES } from '../../models';

// @Injectable({
//   providedIn: 'root'
// })
// export class ServicesService {
//   private supabaseService = inject(SupabaseService);
  
//   // Signals for reactive state management
//   public businesses = signal<any[]>([]);
//   public featuredBusinesses = signal<any[]>([]);
//   public categories = signal<string[]>(BUSINESS_CATEGORIES.slice());
//   public currentBusiness = signal<any>(null);
//   public loading = signal(false);
//   public error = signal<string | null>(null);

//   // Computed signals
//   public totalBusinesses = computed(() => this.businesses().length);

//   async loadServices(filters?: BusinessSearchFilters) {
//     this.loading.set(true);
//     this.error.set(null);
    
//     try {
//       let query = this.supabaseService
//         .from('businesses')
//         .select('*')
//         .eq('verification_status', 'verified')
//         .order('created_at', { ascending: false });

//       if (filters?.category) {
//         query = query.eq('category', filters.category);
//       }

//       if (filters?.location) {
//         query = query.ilike('location', `%${filters.location}%`);
//       }

//       if (filters?.search_query) {
//         query = query.or(`name.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
//       }

//       if (filters?.limit) {
//         query = query.limit(filters.limit);
//       }

//       if (filters?.offset) {
//         query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
//       }

//       const { data, error } = await query;
      
//       if (error) {
//         this.error.set(error.message);
//         return { data: [], error };
//       }
      
//       this.businesses.set(data || []);
//       return { data: data || [], error: null };
//     } catch (err: any) {
//       this.error.set(err.message);
//       return { data: [], error: err };
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   async loadFeaturedServices(limit = 6) {
//     this.loading.set(true);
//     this.error.set(null);
    
//     try {
//       const { data, error } = await this.supabaseService
//         .from('businesses')
//         .select('*')
//         .eq('verification_status', 'verified')
//         .or('membership_tier.eq.spotlight,membership_tier.eq.luminary')
//         .order('created_at', { ascending: false })
//         .limit(limit);
      
//       if (error) {
//         this.error.set(error.message);
//         return { data: [], error };
//       }
      
//       this.featuredBusinesses.set(data || []);
//       return { data: data || [], error: null };
//     } catch (err: any) {
//       this.error.set(err.message);
//       return { data: [], error: err };
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   async loadServiceById(id: string) {
//     this.loading.set(true);
//     this.error.set(null);
    
//     try {
//       const { data, error } = await this.supabaseService
//         .from('businesses')
//         .select('*')
//         .eq('id', id)
//         .single();
      
//       if (error) {
//         this.error.set(error.message);
//         return { data: null, error };
//       }
      
//       this.currentBusiness.set(data);
//       return { data, error: null };
//     } catch (err: any) {
//       this.error.set(err.message);
//       return { data: null, error: err };
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   async getCategories() {
//     // Return predefined categories for now
//     // In the future, this could fetch from a categories table
//     return { data: BUSINESS_CATEGORIES.slice(), error: null };
//   }

//   async searchBusinesses(query: string, filters?: BusinessSearchFilters) {
//     const searchFilters: BusinessSearchFilters = {
//       ...filters,
//       search_query: query,
//       limit: filters?.limit || 20,
//       offset: filters?.offset || 0
//     };

//     return this.loadServices(searchFilters);
//   }

//   // Clear service data
//   clearServiceData() {
//     this.businesses.set([]);
//     this.featuredBusinesses.set([]);
//     this.currentBusiness.set(null);
//     this.error.set(null);
//   }
// }

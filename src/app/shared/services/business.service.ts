import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

// Business types
export type BusinessType = 'service' | 'product' | 'both';
export type PricingType = 'fixed' | 'hourly' | 'project' | 'custom';

// Service interfaces
export interface Service {
  _id: string;
  business_id: string | Business;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price?: number;
  pricing_type?: PricingType;
  duration?: string;
  features?: string[];
  images?: string[];
  category?: string;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  order_index?: number;
  meta_title?: string;
  meta_description?: string;
  custom_fields?: { [key: string]: any };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceDto {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  price?: number;
  pricing_type?: PricingType;
  duration?: string;
  features?: string[];
  images?: string[];
  category?: string;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  order_index?: number;
  meta_title?: string;
  meta_description?: string;
  custom_fields?: { [key: string]: any };
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {}

// Business interfaces matching the backend schema
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category_id: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  business_type: BusinessType;
  category_id: Category | string;
  subcategory_id?: Subcategory | string;
  owner_id: string | any; // Can be string ID or populated user object
  logo_url?: string;
  banner_url?: string;
  cover_image_url?: string;
  images?: string[];
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  location?: {
    type: { type: string; enum: ['Point']; default: 'Point' };
    coordinates: [number, number]; // [longitude, latitude]
  };
  services?: string[];
  tags?: string[];
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  business_hours?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
  is_active: boolean;
  is_featured: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  review_count: number;
  view_count: number;
  meta_title?: string;
  meta_description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusinessDto {
  name: string;
  description?: string;
  short_description?: string;
  business_type: BusinessType;
  category_id: string;
  subcategory_id?: string;
  logo_url?: string;
  images?: string[];
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  services?: string[];
  tags?: string[];
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  business_hours?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateBusinessDto extends Partial<CreateBusinessDto> {}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly apiUrl = `${this.config.apiBaseUrl}/businesses`;

  // Categories
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.config.apiBaseUrl}/categories`);
  }

  async getCategoriesAsync(): Promise<Category[]> {
    try {
      const response = await firstValueFrom(this.getCategories());
      return response.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Subcategories
  getSubcategories(categoryId: string): Observable<ApiResponse<Subcategory[]>> {
    return this.http.get<ApiResponse<Subcategory[]>>(`${this.config.apiBaseUrl}/subcategories/category/${categoryId}`);
  }

  async getSubcategoriesAsync(categoryId: string): Promise<Subcategory[]> {
    try {
      const response = await firstValueFrom(this.getSubcategories(categoryId));
      return response.data || [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }

  // Businesses
  getMyBusinesses(): Observable<ApiResponse<{businesses: Business[], total: number, page: number, totalPages: number}>> {
    return this.http.get<ApiResponse<{businesses: Business[], total: number, page: number, totalPages: number}>>(`${this.apiUrl}/my-businesses`);
  }

  async getMyBusinessesAsync(): Promise<Business[]> {
    try {
      const response = await firstValueFrom(this.getMyBusinesses());
      return response.data?.businesses || [];
    } catch (error) {
      console.error('Error fetching my businesses:', error);
      throw error;
    }
  }

  getBusiness(id: string): Observable<ApiResponse<Business>> {
    return this.http.get<ApiResponse<Business>>(`${this.apiUrl}/${id}`);
  }

  async getBusinessAsync(id: string): Promise<Business | null> {
    try {
      const response = await firstValueFrom(this.getBusiness(id));
      return response.data || null;
    } catch (error) {
      console.error('Error fetching business:', error);
      throw error;
    }
  }

  createBusiness(businessData: CreateBusinessDto): Observable<ApiResponse<Business>> {
    return this.http.post<ApiResponse<Business>>(this.apiUrl, businessData);
  }

  async createBusinessAsync(businessData: CreateBusinessDto): Promise<Business> {
    try {
      const response = await firstValueFrom(this.createBusiness(businessData));
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create business');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating business:', error);
      throw error;
    }
  }

  updateBusiness(id: string, businessData: UpdateBusinessDto): Observable<ApiResponse<Business>> {
    return this.http.patch<ApiResponse<Business>>(`${this.apiUrl}/${id}`, businessData);
  }

  async updateBusinessAsync(id: string, businessData: UpdateBusinessDto): Promise<Business> {
    try {
      const response = await firstValueFrom(this.updateBusiness(id, businessData));
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update business');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating business:', error);
      throw error;
    }
  }

  deleteBusiness(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  async deleteBusinessAsync(id: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.deleteBusiness(id));
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete business');
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  }

  // Public business operations (no auth required)
  getAllBusinesses(page = 1, limit = 20, categoryId?: string, subcategoryId?: string): Observable<ApiResponse<{ businesses: Business[], total: number, page: number, limit: number }>> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    if (subcategoryId) url += `&subcategoryId=${subcategoryId}`;
    
    return this.http.get<ApiResponse<{ businesses: Business[], total: number, page: number, limit: number }>>(url);
  }

  searchBusinesses(query: string, page = 1, limit = 20): Observable<ApiResponse<{ businesses: Business[], total: number, page: number, limit: number }>> {
    return this.http.get<ApiResponse<{ businesses: Business[], total: number, page: number, limit: number }>>(
      `${this.apiUrl}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  // Services methods
  getServices(
    page: number = 1,
    limit: number = 10,
    filters: {
      businessId?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      category?: string;
      priceMin?: number;
      priceMax?: number;
      search?: string;
    } = {}
  ): Observable<ApiResponse<{
    services: Service[];
    total: number;
    page: number;
    totalPages: number;
  }>> {
    let params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<{
      services: Service[];
      total: number;
      page: number;
      totalPages: number;
    }>>(`${this.config.apiBaseUrl}/services?${params.toString()}`);
  }

  async getServicesAsync(
    page: number = 1,
    limit: number = 10,
    filters: {
      businessId?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      category?: string;
      priceMin?: number;
      priceMax?: number;
      search?: string;
    } = {}
  ): Promise<{
    services: Service[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await firstValueFrom(this.getServices(page, limit, filters));
      return response.data || { services: [], total: 0, page: 1, totalPages: 0 };
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  getBusinessServices(businessId: string, includeInactive: boolean = false): Observable<ApiResponse<Service[]>> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<ApiResponse<Service[]>>(`${this.config.apiBaseUrl}/services/business/${businessId}${params}`);
  }

  async getBusinessServicesAsync(businessId: string, includeInactive: boolean = false): Promise<Service[]> {
    try {
      const response = await firstValueFrom(this.getBusinessServices(businessId, includeInactive));
      return response.data || [];
    } catch (error) {
      console.error('Error fetching business services:', error);
      throw error;
    }
  }

  getService(id: string): Observable<ApiResponse<Service>> {
    return this.http.get<ApiResponse<Service>>(`${this.config.apiBaseUrl}/services/${id}`);
  }

  async getServiceAsync(id: string): Promise<Service | null> {
    try {
      const response = await firstValueFrom(this.getService(id));
      return response.data || null;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  }

  getServiceBySlug(slug: string): Observable<ApiResponse<Service>> {
    return this.http.get<ApiResponse<Service>>(`${this.config.apiBaseUrl}/services/slug/${slug}`);
  }

  async getServiceBySlugAsync(slug: string): Promise<Service | null> {
    try {
      const response = await firstValueFrom(this.getServiceBySlug(slug));
      return response.data || null;
    } catch (error) {
      console.error('Error fetching service by slug:', error);
      throw error;
    }
  }

  createService(businessId: string, serviceData: CreateServiceDto): Observable<ApiResponse<Service>> {
    return this.http.post<ApiResponse<Service>>(`${this.config.apiBaseUrl}/services/${businessId}`, serviceData);
  }

  async createServiceAsync(businessId: string, serviceData: CreateServiceDto): Promise<Service> {
    try {
      const response = await firstValueFrom(this.createService(businessId, serviceData));
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create service');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  updateService(id: string, serviceData: UpdateServiceDto): Observable<ApiResponse<Service>> {
    return this.http.patch<ApiResponse<Service>>(`${this.config.apiBaseUrl}/services/${id}`, serviceData);
  }

  async updateServiceAsync(id: string, serviceData: UpdateServiceDto): Promise<Service> {
    try {
      const response = await firstValueFrom(this.updateService(id, serviceData));
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update service');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  deleteService(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.config.apiBaseUrl}/services/${id}`);
  }

  async deleteServiceAsync(id: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.deleteService(id));
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  reorderServices(businessId: string, serviceIds: string[]): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.config.apiBaseUrl}/services/reorder/${businessId}`, { serviceIds });
  }

  async reorderServicesAsync(businessId: string, serviceIds: string[]): Promise<void> {
    try {
      const response = await firstValueFrom(this.reorderServices(businessId, serviceIds));
      if (!response.success) {
        throw new Error(response.message || 'Failed to reorder services');
      }
    } catch (error) {
      console.error('Error reordering services:', error);
      throw error;
    }
  }

//   // Legacy commented code below for Supabase migration reference
//   async loadFeaturedBusinesses(limit = 6) {
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

//   async loadBusinessById(id: string) {
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

//   async loadUserBusinesses(userId: string) {
//     this.loading.set(true);
//     this.error.set(null);
    
//     try {
//       const { data, error } = await this.supabaseService
//         .from('businesses')
//         .select('*')
//         .eq('owner_id', userId)
//         .order('created_at', { ascending: false });
      
//       if (error) {
//         this.error.set(error.message);
//         return { data: [], error };
//       }
      
//       this.userBusinesses.set(data || []);
//       return { data: data || [], error: null };
//     } catch (err: any) {
//       this.error.set(err.message);
//       return { data: [], error: err };
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   async createBusiness(businessData: BusinessFormData) {
//     this.loading.set(true);
//     this.error.set(null);
    
//     try {
//       const currentUser = this.supabaseService.user;
//       if (!currentUser) {
//         throw new Error('No authenticated user');
//       }

//       const businessInsert: BusinessInsert = {
//         ...businessData,
//         profile_id: currentUser.id
//       };

//       const { data, error } = await this.supabaseService
//         .from('businesses')
//         .insert(businessInsert)
//         .select()
//         .single();
      
//       if (error) {
//         this.error.set(error.message);
//         return { data: null, error };
//       }
      
//       // Add to user businesses
//       const currentUserBusinesses = this.userBusinesses();
//       this.userBusinesses.set([data, ...currentUserBusinesses]);
      
//       return { data, error: null };
//     } catch (err: any) {
//       this.error.set(err.message);
//       return { data: null, error: err };
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   async updateBusiness(id: string, updates: BusinessUpdate) {
//     this.loading.set(true);
//     this.error.set(null);
    
//     try {
//       const { data, error } = await this.supabaseService
//         .from('businesses')
//         .update(updates)
//         .eq('id', id)
//         .select()
//         .single();
      
//       if (error) {
//         this.error.set(error.message);
//         return { data: null, error };
//       }
      
//       // Update current business if it's the same
//       const current = this.currentBusiness();
//       if (current && current.id === id) {
//         this.currentBusiness.set(data);
//       }
      
//       // Update in user businesses list
//       const userBusinesses = this.userBusinesses();
//       const updatedList = userBusinesses.map(b => b.id === id ? data : b);
//       this.userBusinesses.set(updatedList);
      
//       return { data, error: null };
//     } catch (err: any) {
//       this.error.set(err.message);
//       return { data: null, error: err };
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   async deleteBusiness(id: string) {
//     this.loading.set(true);
//     this.error.set(null);
    
//     try {
//       const { error } = await this.supabaseService
//         .from('businesses')
//         .delete()
//         .eq('id', id);
      
//       if (error) {
//         this.error.set(error.message);
//         return { error };
//       }
      
//       // Remove from user businesses
//       const userBusinesses = this.userBusinesses();
//       this.userBusinesses.set(userBusinesses.filter(b => b.id !== id));
      
//       // Clear current business if it's the deleted one
//       const current = this.currentBusiness();
//       if (current && current.id === id) {
//         this.currentBusiness.set(null);
//       }
      
//       return { error: null };
//     } catch (err: any) {
//       this.error.set(err.message);
//       return { error: err };
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   async uploadBusinessImage(file: File, businessId: string) {
//     this.loading.set(true);
//     this.error.set(null);
    
//     try {
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${businessId}.${fileExt}`;
//       const filePath = `business-images/${fileName}`;

//       // Upload file to Supabase storage
//       const { error: uploadError } = await this.supabaseService.uploadFile(
//         'business-images', 
//         filePath, 
//         file
//       );

//       if (uploadError) {
//         this.error.set(uploadError.message);
//         return { data: null, error: uploadError };
//       }

//       // Get public URL
//       const publicUrl = this.supabaseService.getPublicUrl('business-images', filePath);

//       // Update business with new image URL
//       const { data, error } = await this.updateBusiness(businessId, {
//         logo_url: publicUrl
//       });

//       return { data: publicUrl, error };
//     } catch (err: any) {
//       this.error.set(err.message);
//       return { data: null, error: err };
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   // Clear business data
//   clearBusinessData() {
//     this.businesses.set([]);
//     this.featuredBusinesses.set([]);
//     this.currentBusiness.set(null);
//     this.userBusinesses.set([]);
//     this.error.set(null);
//   }

  // Image upload methods
  uploadLogo(businessId: string, file: File): Observable<{ success: boolean; data: { logo_url: string }; message: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    
    return this.http.post<{ success: boolean; data: { logo_url: string }; message: string }>(
      `${this.apiUrl}/${businessId}/upload-logo`,
      formData
    );
  }

  async uploadLogoAsync(businessId: string, file: File): Promise<{ logo_url: string }> {
    const response = await firstValueFrom(this.uploadLogo(businessId, file));
    return response.data;
  }

  uploadBanner(businessId: string, file: File): Observable<{ success: boolean; data: { banner_url: string }; message: string }> {
    const formData = new FormData();
    formData.append('banner', file);
    
    return this.http.post<{ success: boolean; data: { banner_url: string }; message: string }>(
      `${this.apiUrl}/${businessId}/upload-banner`,
      formData
    );
  }

  async uploadBannerAsync(businessId: string, file: File): Promise<{ banner_url: string }> {
    const response = await firstValueFrom(this.uploadBanner(businessId, file));
    return response.data;
  }

  // Service image upload methods
  uploadServiceImages(serviceId: string, files: File[]): Observable<{ success: boolean; data: { images: string[] }; message: string }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    return this.http.post<{ success: boolean; data: { images: string[] }; message: string }>(
      `${this.config.apiBaseUrl}/services/${serviceId}/upload-images`,
      formData
    );
  }

  async uploadServiceImagesAsync(serviceId: string, files: File[]): Promise<{ images: string[] }> {
    const response = await firstValueFrom(this.uploadServiceImages(serviceId, files));
    return response.data;
  }

  deleteServiceImage(serviceId: string, imageUrl: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.config.apiBaseUrl}/services/${serviceId}/delete-image`,
      { body: { imageUrl } }
    );
  }

  async deleteServiceImageAsync(serviceId: string, imageUrl: string): Promise<void> {
    await firstValueFrom(this.deleteServiceImage(serviceId, imageUrl));
  }
// }
}

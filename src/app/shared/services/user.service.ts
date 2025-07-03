import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile, ProfileUpdate, Service } from '../types/database.types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private supabaseService = inject(SupabaseService);
  
  // Signals for reactive state management
  public currentProfile = signal<Profile | null>(null);
  public userServices = signal<Service[]>([]);
  public loading = signal(false);
  public error = signal<string | null>(null);

  // Computed signals
  public isProfileComplete = computed(() => {
    const profile = this.currentProfile();
    return profile && profile.full_name && profile.bio && profile.profession;
  });

  public serviceCount = computed(() => this.userServices().length);

  async loadUserProfile(userId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService.getProfile(userId);
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      if (data) {
        this.currentProfile.set(data);
      }
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async updateProfile(updates: ProfileUpdate) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const currentUser = this.supabaseService.user;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }
      
      const { data, error } = await this.supabaseService.updateProfile(
        currentUser.id, 
        updates
      );
      
      if (error) {
        this.error.set(error.message);
        return { data: null, error };
      }
      
      if (data) {
        this.currentProfile.set(data);
      }
      
      return { data, error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async loadUserServices(userId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabaseService
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        this.error.set(error.message);
        return { data: [], error };
      }
      
      this.userServices.set(data || []);
      return { data: data || [], error: null };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: [], error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async uploadAvatar(file: File, userId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await this.supabaseService.uploadFile(
        'avatars', 
        filePath, 
        file
      );

      if (uploadError) {
        this.error.set(uploadError.message);
        return { data: null, error: uploadError };
      }

      // Get public URL
      const publicUrl = this.supabaseService.getPublicUrl('avatars', filePath);

      // Update profile with new avatar URL
      const { data, error } = await this.updateProfile({
        avatar_url: publicUrl
      });

      return { data: publicUrl, error };
    } catch (err: any) {
      this.error.set(err.message);
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async toggleFeaturedStatus(userId: string) {
    const currentProfile = this.currentProfile();
    if (!currentProfile) return;

    return await this.updateProfile({
      is_featured: !currentProfile.is_featured
    });
  }

  // Clear user data on logout
  clearUserData() {
    this.currentProfile.set(null);
    this.userServices.set([]);
    this.error.set(null);
  }
}

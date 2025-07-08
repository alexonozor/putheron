import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile, UserProfile, ProfileUpdate, User } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private supabaseService = inject(SupabaseService);
  
  // Signals for reactive state management
  public currentProfile = signal<Profile | null>(null);
  public loading = signal(false);
  public error = signal<string | null>(null);

  // Computed signals
  public isProfileComplete = computed(() => {
    const profile = this.currentProfile();
    return profile && profile.full_name;
  });

  public isBuyer = computed(() => {
    const profile = this.currentProfile();
    return profile?.is_buyer || false;
  });

  public isSeller = computed(() => {
    const profile = this.currentProfile();
    return profile?.is_seller || false;
  });

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

  async updatePersonalInfo(data: {
    full_name?: string;
    avatar_url?: string;
    country_of_origin?: string;
    is_buyer?: boolean;
    is_seller?: boolean;
    last_name?: string;
  }) {
    return await this.updateProfile(data);
  }

  // Clear user data on logout
  clearUserData() {
    this.currentProfile.set(null);
    this.error.set(null);
  }
}

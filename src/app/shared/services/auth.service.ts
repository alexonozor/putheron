import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { UserService } from './user.service';
import { Tables, TablesUpdate } from '../types/database.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  
  // Signals for state management
  readonly loading = signal<boolean>(false);
  
  // Convert observables to signals
  readonly authState = toSignal(this.supabaseService.authState$, { initialValue: { user: null, session: null } });
  readonly user = computed(() => this.authState().user);
  readonly isAuthenticated = computed(() => !!this.authState().user);
  
  // Legacy observables for backward compatibility
  get loading$() {
    return this.supabaseService.authState$.pipe(
      map(() => this.loading())
    );
  }

  get user$() {
    return this.supabaseService.authState$.pipe(
      map(state => state.user)
    );
  }

  get isAuthenticated$() {
    return this.supabaseService.authState$.pipe(
      map(state => !!state.user)
    );
  }

  get currentUser() {
    return this.supabaseService.user;
  }

  async signUp(email: string, password: string, fullName?: string) {
    try {
      this.loading.set(true);
      
      const { data, error } = await this.supabaseService.signUp(
        email, 
        password,
        { full_name: fullName }
      );

      if (error) throw error;

      // If signup is successful, the profile should be created automatically by database triggers
      // If not, we can create it manually as a fallback
      if (data.user && data.user.email_confirmed_at) {
        // User is immediately confirmed, check if profile exists
        try {
          const { data: profileData, error: profileError } = await this.supabaseService.getProfile(data.user.id);
          if (profileError || !profileData) {
            // Profile doesn't exist, create it
            await this.supabaseService.createProfile({
              id: data.user.id,
              full_name: fullName,
              is_buyer: true,
              is_seller: false
            });
          }
        } catch (profileError: any) {
          console.log('Profile check/creation error:', profileError);
          // Don't throw error here, as the user was successfully created
        }
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('SignUp error:', error);
      return { data: null, error };
    } finally {
      this.loading.set(false);
    }
  }

  async signIn(email: string, password: string) {
    try {
      this.loading.set(true);
      
      const { data, error } = await this.supabaseService.signIn(email, password);
      
      if (error) throw error;
      
      // Load user profile after successful login
      if (data.user) {
        await this.userService.loadUserProfile(data.user.id);
      }
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      this.loading.set(false);
    }
  }

  async signOut() {
    try {
      this.loading.set(true);
      
      const { error } = await this.supabaseService.signOut();
      
      if (error) throw error;
      
      // Clear user data when signing out
      this.userService.clearUserData();
      
      // Redirect to home page after logout
      this.router.navigate(['/']);
      
      return { error: null };
    } catch (error: any) {
      return { error };
    } finally {
      this.loading.set(false);
    }
  }

  async signInWithGoogle() {
    try {
      this.loading.set(true);
      
      const { data, error } = await this.supabaseService.signInWithGoogle();
      
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      this.loading.set(false);
    }
  }

  async resetPassword(email: string) {
    try {
      this.loading.set(true);
      
      const { data, error } = await this.supabaseService.resetPassword(email);
      
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      this.loading.set(false);
    }
  }

  async updatePassword(password: string) {
    try {
      this.loading.set(true);
      
      const { data, error } = await this.supabaseService.updatePassword(password);
      
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      this.loading.set(false);
    }
  }

  async getCurrentProfile(): Promise<Tables<'profiles'> | null> {
    const user = this.currentUser;
    if (!user) return null;

    console.log('Getting profile for user:', user);
    console.log('User ID:', user.id);
    console.log('User ID type:', typeof user.id);

    const { data, error } = await this.supabaseService.getProfile(user.id);
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    console.log('Profile data retrieved:', data);
    return data;
  }

  async updateProfile(updates: TablesUpdate<'profiles'>) {
    const user = this.currentUser;
    if (!user) throw new Error('No authenticated user');

    try {
      this.loading.set(true);
      
      const { data, error } = await this.supabaseService.updateProfile(user.id, updates);
      
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      this.loading.set(false);
    }
  }
}

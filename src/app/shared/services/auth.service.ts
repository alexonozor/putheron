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

      // Create profile after successful signup
      if (data.user) {
        await this.supabaseService.createProfile({
          id: data.user.id,
          full_name: fullName
        });
      }

      return { data, error: null };
    } catch (error: any) {
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
      
      // Redirect to dashboard or intended route after successful login
      this.router.navigate(['/dashboard']);
      
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

    const { data, error } = await this.supabaseService.getProfile(user.id);
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
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

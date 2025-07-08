import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  Database, 
  Tables,
  TablesInsert,
  TablesUpdate
} from '../types/database.types';

// Define auth state interface
export interface AuthState {
  user: User | null;
  session: any;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;
  private authStateSubject = new BehaviorSubject<AuthState>({ user: null, session: null });
  
  constructor() {
    this.supabase = createClient<Database>(
      environment.supabase.url,
      environment.supabase.key
    );

    // Listen to auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.authStateSubject.next({
        user: session?.user ?? null,
        session
      });
    });
  }

  get authState$(): Observable<AuthState> {
    return this.authStateSubject.asObservable();
  }

  get user() {
    return this.authStateSubject.value.user;
  }

  get session() {
    return this.authStateSubject.value.session;
  }

  // Auth methods
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  }

  async updatePassword(password: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password
    });
    return { data, error };
  }

  // Google OAuth
  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    return { data, error };
  }

  // Profile methods
  async getProfile(userId: string): Promise<{ data: Tables<'profiles'> | null; error: any }> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  }

  async updateProfile(userId: string, updates: TablesUpdate<'profiles'>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  async createProfile(profile: TablesInsert<'profiles'>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    return { data, error };
  }

  // File upload methods
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file);

    return { data, error };
  }

  async downloadFile(bucket: string, path: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .download(path);

    return { data, error };
  }

  getPublicUrl(bucket: string, path: string) {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async deleteFile(bucket: string, path: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    return { data, error };
  }

  // Generic database methods
  from(table: keyof Database['public']['Tables']) {
    return this.supabase.from(table);
  }

  // Real-time subscriptions
  subscribeToTable(table: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  }

  // Utility method to get the Supabase client if needed
  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  // Business-related methods
  async getBusinesses(limit?: number, offset?: number) {
    let query = this.supabase
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    return await query;
  }

  async getBusinessById(businessId: number) {
    return await this.supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
  }

  async createBusiness(business: TablesInsert<'businesses'>) {
    return await this.supabase
      .from('businesses')
      .insert(business)
      .select()
      .single();
  }

  async updateBusiness(businessId: number, updates: TablesUpdate<'businesses'>) {
    return await this.supabase
      .from('businesses')
      .update(updates)
      .eq('id', businessId)
      .select()
      .single();
  }
}

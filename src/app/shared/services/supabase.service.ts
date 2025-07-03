import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  Database, 
  Profile, 
  ProfileInsert, 
  ProfileUpdate,
  AuthState,
  Service,
  ServiceInsert,
  ServiceUpdate,
  Order,
  OrderInsert,
  OrderUpdate,
  Review,
  ReviewInsert,
  ReviewUpdate,
  Category,
  Message,
  MessageInsert
} from '../types/database.types';

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
  async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  }

  async updateProfile(userId: string, updates: ProfileUpdate) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  async createProfile(profile: ProfileInsert) {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('profiles')
      .insert({
        ...profile,
        created_at: now,
        updated_at: now
      })
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
  from(table: string) {
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

  // Additional service methods for your database tables
  
  // Services table methods
  async getServices(limit?: number, offset?: number) {
    let query = this.supabase
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

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    return await query;
  }

  async getServiceById(serviceId: string) {
    return await this.supabase
      .from('services')
      .select(`
        *,
        profiles (
          id,
          full_name,
          avatar_url,
          bio,
          rating,
          total_reviews,
          is_verified
        )
      `)
      .eq('id', serviceId)
      .single();
  }

  async createService(service: ServiceInsert) {
    const now = new Date().toISOString();
    return await this.supabase
      .from('services')
      .insert({
        ...service,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
  }

  async updateService(serviceId: string, updates: ServiceUpdate) {
    return await this.supabase
      .from('services')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .select()
      .single();
  }

  // Orders table methods
  async getOrdersByUser(userId: string, type: 'buyer' | 'seller' = 'buyer') {
    const column = type === 'buyer' ? 'buyer_id' : 'seller_id';
    
    return await this.supabase
      .from('orders')
      .select(`
        *,
        services (
          id,
          title,
          images
        ),
        buyer_profile:profiles!buyer_id (
          id,
          full_name,
          avatar_url
        ),
        seller_profile:profiles!seller_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq(column, userId)
      .order('created_at', { ascending: false });
  }

  async createOrder(order: OrderInsert) {
    const now = new Date().toISOString();
    return await this.supabase
      .from('orders')
      .insert({
        ...order,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
  }

  async updateOrder(orderId: string, updates: OrderUpdate) {
    return await this.supabase
      .from('orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
  }

  // Reviews table methods
  async getReviewsForService(serviceId: string) {
    return await this.supabase
      .from('reviews')
      .select(`
        *,
        reviewer_profile:profiles!reviewer_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('service_id', serviceId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });
  }

  async createReview(review: ReviewInsert) {
    const now = new Date().toISOString();
    return await this.supabase
      .from('reviews')
      .insert({
        ...review,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
  }

  // Categories table methods
  async getCategories() {
    return await this.supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
  }

  // Messages table methods
  async getMessagesForOrder(orderId: string) {
    return await this.supabase
      .from('messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
  }

  async sendMessage(message: MessageInsert) {
    const now = new Date().toISOString();
    return await this.supabase
      .from('messages')
      .insert({
        ...message,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
  }

  async markMessageAsRead(messageId: string) {
    return await this.supabase
      .from('messages')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);
  }
}

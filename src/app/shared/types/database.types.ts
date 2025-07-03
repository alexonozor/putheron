export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          website: string | null;
          phone: string | null;
          date_of_birth: string | null;
          gender: string | null;
          profession: string | null;
          skills: string[] | null;
          social_links: Record<string, any> | null;
          is_verified: boolean;
          is_featured: boolean;
          rating: number | null;
          total_reviews: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          profession?: string | null;
          skills?: string[] | null;
          social_links?: Record<string, any> | null;
          is_verified?: boolean;
          is_featured?: boolean;
          rating?: number | null;
          total_reviews?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          profession?: string | null;
          skills?: string[] | null;
          social_links?: Record<string, any> | null;
          is_verified?: boolean;
          is_featured?: boolean;
          rating?: number | null;
          total_reviews?: number;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          subcategory: string | null;
          price: number;
          currency: string;
          duration: string | null;
          delivery_time: string | null;
          images: string[] | null;
          tags: string[] | null;
          requirements: string | null;
          packages: Record<string, any> | null;
          is_active: boolean;
          is_featured: boolean;
          views_count: number;
          orders_count: number;
          rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          subcategory?: string | null;
          price: number;
          currency?: string;
          duration?: string | null;
          delivery_time?: string | null;
          images?: string[] | null;
          tags?: string[] | null;
          requirements?: string | null;
          packages?: Record<string, any> | null;
          is_active?: boolean;
          is_featured?: boolean;
          views_count?: number;
          orders_count?: number;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          category?: string;
          subcategory?: string | null;
          price?: number;
          currency?: string;
          duration?: string | null;
          delivery_time?: string | null;
          images?: string[] | null;
          tags?: string[] | null;
          requirements?: string | null;
          packages?: Record<string, any> | null;
          is_active?: boolean;
          is_featured?: boolean;
          views_count?: number;
          orders_count?: number;
          rating?: number | null;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          service_id: string;
          buyer_id: string;
          seller_id: string;
          package_type: string;
          total_amount: number;
          currency: string;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
          requirements_submitted: boolean;
          delivery_date: string | null;
          payment_status: 'pending' | 'paid' | 'refunded';
          payment_intent_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          buyer_id: string;
          seller_id: string;
          package_type: string;
          total_amount: number;
          currency?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
          requirements_submitted?: boolean;
          delivery_date?: string | null;
          payment_status?: 'pending' | 'paid' | 'refunded';
          payment_intent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          buyer_id?: string;
          seller_id?: string;
          package_type?: string;
          total_amount?: number;
          currency?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
          requirements_submitted?: boolean;
          delivery_date?: string | null;
          payment_status?: 'pending' | 'paid' | 'refunded';
          payment_intent_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          reviewer_id: string;
          reviewee_id: string;
          service_id: string;
          rating: number;
          comment: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          reviewer_id: string;
          reviewee_id: string;
          service_id: string;
          rating: number;
          comment?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          service_id?: string;
          rating?: number;
          comment?: string | null;
          is_public?: boolean;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          order_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          attachments: string[] | null;
          is_read: boolean;
          message_type: 'text' | 'file' | 'system';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          attachments?: string[] | null;
          is_read?: boolean;
          message_type?: 'text' | 'file' | 'system';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          attachments?: string[] | null;
          is_read?: boolean;
          message_type?: 'text' | 'file' | 'system';
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      order_status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
      payment_status: 'pending' | 'paid' | 'refunded';
      message_type: 'text' | 'file' | 'system';
    };
  };
}

// Export specific types for easier use
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

// Enum types
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type MessageType = Database['public']['Enums']['message_type'];

// Common interfaces for application use
export interface AuthState {
  user: any | null;
  session: any | null;
}

export interface ServiceWithProfile extends Service {
  profiles: Profile;
}

export interface OrderWithDetails extends Order {
  services: Service;
  buyer_profile: Profile;
  seller_profile: Profile;
}

export interface ReviewWithDetails extends Review {
  reviewer_profile: Profile;
  service: Service;
}

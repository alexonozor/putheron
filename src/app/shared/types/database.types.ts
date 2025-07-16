export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      business_reviews: {
        Row: {
          business_id: string
          communication: number | null
          created_at: string | null
          id: number
          rating: number
          review_text: string | null
          service_quality: number | null
          timeliness: number | null
          updated_at: string | null
          user_business_project_id: number
          user_id: string
          value: number | null
        }
        Insert: {
          business_id: string
          communication?: number | null
          created_at?: string | null
          id?: never
          rating: number
          review_text?: string | null
          service_quality?: number | null
          timeliness?: number | null
          updated_at?: string | null
          user_business_project_id: number
          user_id: string
          value?: number | null
        }
        Update: {
          business_id?: string
          communication?: number | null
          created_at?: string | null
          id?: never
          rating?: number
          review_text?: string | null
          service_quality?: number | null
          timeliness?: number | null
          updated_at?: string | null
          user_business_project_id?: number
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_categories_view"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profile_businesses"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_reviews_user_business_project_id_fkey"
            columns: ["user_business_project_id"]
            isOneToOne: false
            referencedRelation: "user_business_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          average_rating: number | null
          business_type: string | null
          category_id: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          postal_code: string | null
          profile_id: string
          review_count: number | null
          state: string | null
          subcategory_id: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          business_type?: string | null
          category_id?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          postal_code?: string | null
          profile_id: string
          review_count?: number | null
          state?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          business_type?: string | null
          category_id?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          postal_code?: string | null
          profile_id?: string
          review_count?: number | null
          state?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_categories_view"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "business_categories_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "businesses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_businesses"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "businesses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "business_categories_view"
            referencedColumns: ["subcategory_id"]
          },
          {
            foreignKeyName: "businesses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          project_id: number
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          project_id: number
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          project_id?: number
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: number
          message: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: number
          message: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: number
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          country_of_origin: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_buyer: boolean | null
          is_seller: boolean | null
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_buyer?: boolean | null
          is_seller?: boolean | null
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_buyer?: boolean | null
          is_seller?: boolean | null
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          business_id: string
          category: string | null
          client_name: string | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          gallery_urls: string[] | null
          id: number
          image_url: string | null
          is_featured: boolean | null
          testimonial: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          client_name?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          gallery_urls?: string[] | null
          id?: never
          image_url?: string | null
          is_featured?: boolean | null
          testimonial?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          client_name?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          gallery_urls?: string[] | null
          id?: never
          image_url?: string | null
          is_featured?: boolean | null
          testimonial?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_categories_view"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profile_businesses"
            referencedColumns: ["business_id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: number
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: never
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: never
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_categories_view"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profile_businesses"
            referencedColumns: ["business_id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_categories_view"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_business_projects: {
        Row: {
          business_id: string
          completion_date: string | null
          created_at: string | null
          id: number
          project_description: string | null
          project_id: string | null
          project_title: string
          start_date: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          completion_date?: string | null
          created_at?: string | null
          id?: never
          project_description?: string | null
          project_id?: string | null
          project_title: string
          start_date?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          completion_date?: string | null
          created_at?: string | null
          id?: never
          project_description?: string | null
          project_id?: string | null
          project_title?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_business_projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_categories_view"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "user_business_projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "user_business_projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_business_projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profile_businesses"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "user_business_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "user_business_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      business_categories_view: {
        Row: {
          address: string | null
          business_description: string | null
          business_id: string | null
          business_name: string | null
          category_id: string | null
          category_name: string | null
          city: string | null
          country: string | null
          profile_id: string | null
          profile_name: string | null
          state: string | null
          subcategory_id: string | null
          subcategory_name: string | null
        }
        Relationships: []
      }
      business_projects: {
        Row: {
          business_description: string | null
          business_id: string | null
          business_name: string | null
          client_name: string | null
          completion_date: string | null
          gallery_urls: string[] | null
          image_url: string | null
          is_featured: boolean | null
          project_category: string | null
          project_description: string | null
          project_id: string | null
          project_title: string | null
          testimonial: string | null
        }
        Relationships: []
      }
      business_review_details: {
        Row: {
          business_id: string | null
          business_name: string | null
          communication: number | null
          project_completion_date: string | null
          project_id: string | null
          project_title: string | null
          rating: number | null
          review_date: string | null
          review_id: number | null
          review_text: string | null
          reviewer_name: string | null
          service_quality: number | null
          timeliness: number | null
          user_id: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_categories_view"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_projects"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profile_businesses"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_reviews_user_business_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_business_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_businesses: {
        Row: {
          business_id: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          full_name: string | null
          is_buyer: boolean | null
          is_seller: boolean | null
          profile_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      complete_user_business_project: {
        Args: { p_project_id: number; p_completion_date?: string }
        Returns: boolean
      }
      create_user_business_project: {
        Args: {
          p_user_id: string
          p_business_id: string
          p_project_title: string
          p_project_description?: string
          p_start_date?: string
          p_status?: string
        }
        Returns: number
      }
      get_business_review_stats: {
        Args: { p_business_id: string }
        Returns: {
          business_id: string
          business_name: string
          average_rating: number
          review_count: number
          avg_service_quality: number
          avg_communication: number
          avg_timeliness: number
          avg_value: number
          five_star_count: number
          four_star_count: number
          three_star_count: number
          two_star_count: number
          one_star_count: number
        }[]
      }
      get_business_reviews: {
        Args: { p_business_id: string }
        Returns: {
          review_id: number
          business_id: string
          business_name: string
          reviewer_name: string
          project_title: string
          rating: number
          review_text: string
          service_quality: number
          communication: number
          timeliness: number
          value: number
          review_date: string
          project_completion_date: string
        }[]
      }
      insert_sample_review_data: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      start_chat_conversation: {
        Args: { p_user_id: string; p_business_id: string; p_project_id: number }
        Returns: string
      }
      submit_business_review: {
        Args: {
          p_business_id: string
          p_project_id: number
          p_rating: number
          p_review_text: string
          p_service_quality: number
          p_communication: number
          p_timeliness: number
          p_value: number
        }
        Returns: number
      }
      update_business_membership: {
        Args: {
          _business_id: string
          _tier: Database["public"]["Enums"]["membership_tier"]
          _billing_frequency: string
          _months: number
        }
        Returns: undefined
      }
    }
    Enums: {
      membership_tier: "starter" | "spotlight" | "luminary"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      membership_tier: ["starter", "spotlight", "luminary"],
    },
  },
} as const

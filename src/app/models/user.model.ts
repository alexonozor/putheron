import { Tables, TablesInsert, TablesUpdate } from '../shared/types/database.types';

// Base profile type from database
export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

// Extended user profile with additional computed fields
export interface UserProfile extends Profile {
  businesses_count?: number;
  businesses?: any[]; // Will be typed more specifically when needed
  favorites_count?: number;
  posts_count?: number;
}

// User roles
export const USER_ROLES = ['user', 'admin', 'consultant', 'reviewer'] as const;
export type UserRole = typeof USER_ROLES[number];

// Legacy User interface for backward compatibility (to be phased out)
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
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
  created_at: string;
  updated_at?: string;
}

export interface UserInsert {
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
}

export interface UserUpdate {
  full_name?: string | null;
  avatar_url?: string | null;
  consultant_services?: string | null;
  open_to_consulting?: boolean | null;
  role?: string | null;
  amount_paid?: number | null;
  payment_status?: string | null;
  coupon_code?: string | null;
  email?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  user: AuthUser;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

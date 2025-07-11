import { Tables, TablesInsert, TablesUpdate, Database } from '../shared/types/database.types';

// Base business type from database
export type Business = Tables<'businesses'>;
export type BusinessInsert = TablesInsert<'businesses'>;
export type BusinessUpdate = TablesUpdate<'businesses'>;

// Extended business type with computed fields
export interface BusinessWithProfile extends Business {
  owner_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  favorites_count?: number;
  is_favorited?: boolean;
  reviews_count?: number;
  // Note: average_rating is already defined in Business type as number | null
}

// Business search filters
export interface BusinessSearchFilters {
  category?: string;
  subcategory_tags?: string[];
  location?: string;
  membership_tier?: Database['public']['Enums']['membership_tier'];
  is_certified?: boolean;
  has_online_presence?: boolean;
  is_ada_accessible?: boolean;
  verification_status?: string;
  search_query?: string;
  price_range?: {
    min?: number;
    max?: number;
  };
  rating_min?: number;
  sort_by?: 'created_at' | 'name' | 'rating' | 'location';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Business creation form data
export interface BusinessFormData {
  name: string;
  description: string;
  category: string;
  subcategory_tags?: string[];
  location: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: string;
  image_url?: string;
  owner_name?: string;
  owner_bio?: string;
  owner_image_url?: string;
  use_owner_image_as_primary?: boolean;
  is_online_business?: boolean;
  is_ada_accessible?: boolean;
  is_registered?: boolean;
  registration_state?: string;
  profit_status?: string;
  business_stage?: string;
  interested_in_certification?: boolean;
  certification_type?: string;
  wbe_certified?: boolean;
  mbe_certified?: boolean;
  majority_ownership_attestation?: boolean;
  open_to_collaboration?: boolean;
  collaboration_types?: string[];
  open_to_consulting?: boolean;
  support_needs?: string[];
  nationalities?: string[];
  custom_suggested_tags?: string[];
}

// Business categories and subcategories
export interface BusinessCategory {
  id: string;
  name: string;
  description?: string;
  subcategories: BusinessSubcategory[];
}

export interface BusinessSubcategory {
  id: string;
  name: string;
  description?: string;
  category_id: string;
}

// Constants for business-related enums
export const MEMBERSHIP_TIERS = ['starter', 'spotlight', 'luminary'] as const;
export const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'] as const;
export const BUSINESS_STAGES = [
  'idea',
  'startup',
  'early_stage',
  'growth',
  'established',
  'enterprise'
] as const;
export const PROFIT_STATUSES = ['for_profit', 'non_profit', 'hybrid'] as const;

// Business categories constants
export const BUSINESS_CATEGORIES = [
  'Technology',
  'Healthcare',
  'Food & Beverage',
  'Retail',
  'Professional Services',
  'Beauty & Wellness',
  'Education',
  'Arts & Crafts',
  'Home & Garden',
  'Fashion',
  'Consulting',
  'Event Planning',
  'Real Estate',
  'Transportation',
  'Other'
] as const;

export type BusinessCategoryType = typeof BUSINESS_CATEGORIES[number];
export type MembershipTier = typeof MEMBERSHIP_TIERS[number];
export type VerificationStatus = typeof VERIFICATION_STATUSES[number];
export type BusinessStage = typeof BUSINESS_STAGES[number];
export type ProfitStatus = typeof PROFIT_STATUSES[number];

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
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
}

export interface UserProfile extends User {
  services_count?: number;
  average_rating?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

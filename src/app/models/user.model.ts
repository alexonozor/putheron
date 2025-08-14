// User interface matching the backend MongoDB schema
export interface User {
  _id: string;
  email: string;
  password?: string; // Not usually sent to frontend
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  country_of_origin: string; // Required field
  user_mode?: 'client' | 'business_owner'; // Default is 'client'
  is_buyer?: boolean;
  is_seller?: boolean;
  is_active?: boolean;
  phone?: string;
  date_of_birth?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Request interfaces for API calls
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_buyer?: boolean;
  is_seller?: boolean;
  user_mode?: 'client' | 'business_owner';
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  country_of_origin: string; // Required field
  phone?: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  country_of_origin?: string;
  is_buyer?: boolean;
  is_seller?: boolean;
  phone?: string;
  date_of_birth?: Date;
}

// Response interfaces
export interface AuthResponse {
  success: boolean;
  data: {
    access_token: string;
    user: User;
  };
  message: string;
}

export interface UserResponse {
  success: boolean;
  data: User;
  message: string;
}

// Legacy interfaces for backward compatibility
export interface AuthUser {
  _id: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSession {
  user: AuthUser;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

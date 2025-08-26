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
  
  // Admin management fields
  is_banned?: boolean;
  email_verified?: boolean;
  ban_reason?: string;
  
  // Stripe fields
  stripe_account_id?: string;
  stripe_payouts_enabled?: boolean;
  stripe_requirements_due?: string[];
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

// Admin-specific interfaces
export interface AdminUser extends User {
  // Additional computed properties for admin views
  status?: 'active' | 'inactive' | 'banned';
  role?: string;
  last_login?: Date;
  profile_picture?: string; // Alias for avatar_url
  created_at?: Date; // Alias for createdAt
}

export interface BulkUserAction {
  action: 'ban' | 'unban' | 'activate' | 'deactivate' | 'delete';
  userIds: string[];
  reason?: string;
}

export interface UserActivity {
  _id: string;
  user_id: string;
  action: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  createdAt: Date;
  created_at?: Date; // Alias for createdAt
}

export interface PayPalAccount {
  _id: string;
  user_id: string;
  paypal_user_id: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  is_verified: boolean;
  account_type?: string;
  is_active: boolean;
  environment: 'sandbox' | 'live';
  last_used_at?: Date;
  last_synced_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayPalOAuthResponse {
  auth_url: string;
}

export interface PayPalConnectRequest {
  code: string;
  state: string;
}

export interface PayPalVerificationResult {
  is_verified: boolean;
  account_status: string;
  message: string;
}

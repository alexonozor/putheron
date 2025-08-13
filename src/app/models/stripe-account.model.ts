export interface StripeAccount {
  account_id: string;
  payouts_enabled: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  business_profile?: {
    name?: string;
    url?: string;
  };
  created: number;
  country: string;
  default_currency: string;
  capabilities?: {
    card_payments?: string;
    transfers?: string;
  };
}

export interface StripeAccountStatus {
  has_account: boolean;
  payouts_enabled: boolean;
  requirements_due: boolean;
  account?: StripeAccount;
}

export interface OnboardingLinkResponse {
  url: string;
}

export interface LoginLinkResponse {
  url: string;
}

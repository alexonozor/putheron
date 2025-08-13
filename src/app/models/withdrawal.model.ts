export interface Withdrawal {
  _id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  
  // PayPal specific fields
  paypal_account_id?: string;
  paypal_payout_batch_id?: string;
  paypal_payout_item_id?: string;
  paypal_transaction_id?: string;
  
  // Stripe specific fields
  stripe_account_id?: string;
  stripe_transfer_id?: string;
  stripe_payout_id?: string;
  
  description?: string;
  admin_notes?: string;
  processed_at?: Date;
  failed_reason?: string;
  createdAt: Date;
  updatedAt: Date;
  paypal_account?: {
    email: string;
    is_verified: boolean;
  };
}

export enum WithdrawalMethod {
  PAYPAL = 'paypal',
  STRIPE = 'stripe'
}

export enum WithdrawalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface CreateWithdrawalRequest {
  amount: number;
  method: WithdrawalMethod;
  paypal_account_id?: string; // For PayPal withdrawals
  description?: string;
}

export interface WithdrawalListResponse {
  withdrawals: Withdrawal[];
  total: number;
  page: number;
  limit: number;
}

export interface WithdrawalStats {
  total_withdrawn: number;
  total_fees_paid: number;
  pending_amount: number;
  withdrawal_count: number;
  available_balance: number;
}

export interface WithdrawalResponse {
  success: boolean;
  message: string;
  withdrawal: Withdrawal;
}

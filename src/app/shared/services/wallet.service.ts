import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WalletData {
  _id: string;
  user_id: string;
  wallet_type: 'available' | 'pending_clear' | 'active_orders';
  balance: number;
  total_earnings: number;
  total_withdrawn: number;
  is_active: boolean;
  last_transaction_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionData {
  _id: string;
  user_id: string;
  transaction_type: 'payment_received' | 'payment_cleared' | 'withdrawal' | 'refund' | 'additional_payment' | 'platform_fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  wallet_type: 'available' | 'pending_clear' | 'active_orders';
  description?: string;
  project_id?: {
    _id: string;
    title: string;
    status: string;
  };
  business_id?: {
    _id: string;
    name: string;
  };
  stripe_payment_intent_id?: string;
  payment_method?: string;
  reference_id?: string;
  cleared_at?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EarningsSummary {
  available_funds: number;
  pending_clearance: number;
  active_orders: number;
  total_earnings: number;
  total_withdrawn: number;
  net_earnings: number;
  wallets: WalletData[];
}

export interface WithdrawFundsDto {
  amount: number;
  withdrawal_method: string;
  description?: string;
  bank_details?: {
    account_number?: string;
    routing_number?: string;
    account_holder_name?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly apiUrl = `${environment.api.baseUrl}/wallets`;

  constructor(private http: HttpClient) {}

  // Get user wallets
  async getWallets(): Promise<WalletData[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: WalletData[]; message: string }>(`${this.apiUrl}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  }

  // Get earnings summary
  async getEarningsSummary(): Promise<EarningsSummary> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: EarningsSummary; message: string }>(`${this.apiUrl}/summary`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
      throw error;
    }
  }

  // Get user transactions
  async getTransactions(limit: number = 20, offset: number = 0): Promise<TransactionData[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: TransactionData[]; message: string }>(
          `${this.apiUrl}/transactions?limit=${limit}&offset=${offset}`
        )
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // Withdraw funds
  async withdrawFunds(withdrawDto: WithdrawFundsDto): Promise<TransactionData> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; data: TransactionData; message: string }>(
        `${this.apiUrl}/withdraw`,
        withdrawDto
      )
    );
    return response.data;
  }

  // Transfer funds between wallets
  async transferFunds(transferDto: {
    from_wallet: 'available' | 'pending_clear' | 'active_orders';
    to_wallet: 'available' | 'pending_clear' | 'active_orders';
    amount: number;
    description?: string;
    reference_id?: string;
  }): Promise<TransactionData[]> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; data: TransactionData[]; message: string }>(
        `${this.apiUrl}/transfer`,
        transferDto
      )
    );
    return response.data;
  }

  // Initialize user wallets
  async initializeWallets(): Promise<WalletData[]> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; data: WalletData[]; message: string }>(
        `${this.apiUrl}/initialize`,
        {}
      )
    );
    return response.data;
  }

  // Helper methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getWalletTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'available': 'Available Funds',
      'pending_clear': 'Payments Being Cleared',
      'active_orders': 'Payments for Active Orders'
    };
    return labels[type] || type;
  }

  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'payment_received': 'Payment Received',
      'payment_cleared': 'Payment Cleared',
      'withdrawal': 'Withdrawal',
      'refund': 'Refund',
      'additional_payment': 'Additional Payment',
      'platform_fee': 'Platform Fee'
    };
    return labels[type] || type;
  }
}

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface WalletData {
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

interface TransactionData {
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

interface EarningsSummary {
  available_funds: number;
  pending_clearance: number;
  active_orders: number;
  total_earnings: number;
  total_withdrawn: number;
  net_earnings: number;
  wallets: WalletData[];
  has_transactions?: boolean;
}

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
  ],
  templateUrl: './earnings.component.html',
  styleUrl: './earnings.component.scss'
})
export class EarningsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.api.baseUrl}/wallets`;

  // Signals
  readonly loading = signal(false);
  readonly loadingTransactions = signal(false);
  readonly earningsSummary = signal<EarningsSummary | null>(null);
  readonly transactions = signal<TransactionData[]>([]);
  readonly error = signal<string | null>(null);

  // Computed properties
  readonly hasEarnings = computed(() => {
    const summary = this.earningsSummary();
    return summary && summary.total_earnings > 0;
  });

  readonly canWithdraw = computed(() => {
    const summary = this.earningsSummary();
    return summary && summary.available_funds > 0;
  });

  readonly showEmptyState = computed(() => {
    const summary = this.earningsSummary();
    return !this.loading() && summary && !summary.has_transactions;
  });

  // Table configuration
  readonly displayedColumns = [
    'date',
    'type',
    'description',
    'amount',
    'status'
  ];

  ngOnInit() {
    this.loadEarningsSummary();
    this.loadTransactions();
  }

  async loadEarningsSummary() {
    console.log('🔄 Loading earnings summary...');
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('📡 Making API call to:', `${this.apiUrl}/summary`);
      
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: EarningsSummary; message: string }>(
          `${this.apiUrl}/summary`
        )
      );
      console.log('✅ API Response:', response);
      
      if (response.data) {
        this.earningsSummary.set(response.data);
        console.log('💰 Earnings summary set:', response.data);
      } else {
        console.log('🏗️ No earnings data, initializing wallets...');
        // Try to initialize wallets first
        await this.initializeWallets();
        // Then retry loading summary
        await this.loadEarningsSummaryRetry();
      }
    } catch (error: any) {
      console.error('❌ Error loading earnings summary:', error);
      console.error('Error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        url: error.url
      });
      
      // If it's a 401 error, it might be authentication
      if (error.status === 401) {
        this.error.set('Authentication failed. Please log in again.');
      } else if (error.status === 404) {
        console.log('🏗️ Wallets not found, attempting to initialize...');
        await this.initializeWallets();
        await this.loadEarningsSummaryRetry();
      } else {
        this.error.set('Failed to load earnings data');
      }
    } finally {
      this.loading.set(false);
      console.log('🏁 Loading complete. Summary:', this.earningsSummary());
    }
  }

  async initializeWallets() {
    try {
      console.log('🏗️ Initializing user wallets...');
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: any; message: string }>(
          `${this.apiUrl}/initialize`,
          {}
        )
      );
      console.log('✅ Wallets initialized:', response);
    } catch (error) {
      console.error('❌ Failed to initialize wallets:', error);
    }
  }

  async loadEarningsSummaryRetry() {
    try {
      console.log('🔄 Retrying earnings summary load...');
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: EarningsSummary; message: string }>(
          `${this.apiUrl}/summary`
        )
      );
      
      if (response.data) {
        this.earningsSummary.set(response.data);
        console.log('💰 Earnings summary loaded on retry:', response.data);
      } else {
        // Create a default empty summary
        const defaultSummary: EarningsSummary = {
          available_funds: 0,
          pending_clearance: 0,
          active_orders: 0,
          total_earnings: 0,
          total_withdrawn: 0,
          net_earnings: 0,
          wallets: [],
          has_transactions: false
        };
        this.earningsSummary.set(defaultSummary);
        console.log('📝 Set default earnings summary');
      }
    } catch (error) {
      console.error('❌ Retry failed:', error);
      // Set default empty summary even if retry fails
      const defaultSummary: EarningsSummary = {
        available_funds: 0,
        pending_clearance: 0,
        active_orders: 0,
        total_earnings: 0,
        total_withdrawn: 0,
        net_earnings: 0,
        wallets: [],
        has_transactions: false
      };
      this.earningsSummary.set(defaultSummary);
      console.log('📝 Set default earnings summary after error');
    }
  }

  async loadTransactions() {
    this.loadingTransactions.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: TransactionData[]; message: string }>(
          `${this.apiUrl}/transactions`
        )
      );
      this.transactions.set(response.data || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      this.transactions.set([]);
    } finally {
      this.loadingTransactions.set(false);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'completed': 'text-green-600',
      'pending': 'text-yellow-600',
      'failed': 'text-red-600',
      'cancelled': 'text-gray-600'
    };
    return colors[status] || 'text-gray-600';
  }

  getTransactionTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'payment_received': 'text-green-600',
      'additional_payment': 'text-green-600',
      'payment_cleared': 'text-blue-600',
      'withdrawal': 'text-red-600',
      'platform_fee': 'text-orange-600',
      'refund': 'text-purple-600'
    };
    return colors[type] || 'text-gray-600';
  }

  async requestWithdrawal() {
    // TODO: Implement withdrawal modal
    console.log('Request withdrawal clicked');
  }

  async retryLoad() {
    await this.loadEarningsSummary();
    await this.loadTransactions();
  }
}

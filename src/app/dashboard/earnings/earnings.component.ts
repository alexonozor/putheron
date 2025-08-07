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

interface WalletSummary {
  active_orders: number;        // Computed from accepted/in_progress projects
  payments_clearing: number;    // Computed from completed projects
  available: number;           // Manual field for cleared funds
  total_earnings: number;      // Sum of all three
}

interface TransactionData {
  _id: string;
  user_id: string;
  transaction_type: 'project_started' | 'project_completed' | 'additional_payment' | 'payment_cleared' | 'withdrawal' | 'refund' | 'platform_fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  wallet_type: 'active_orders' | 'payments_clearing' | 'available';
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
  readonly earningsSummary = signal<WalletSummary | null>(null);
  readonly transactions = signal<TransactionData[]>([]);
  readonly error = signal<string | null>(null);

  // Computed properties
  readonly hasEarnings = computed(() => {
    const summary = this.earningsSummary();
    return summary && summary.total_earnings > 0;
  });

  readonly canWithdraw = computed(() => {
    const summary = this.earningsSummary();
    return summary && summary.available > 0;
  });

  readonly showEmptyState = computed(() => {
    const summary = this.earningsSummary();
    const transactions = this.transactions();
    return !this.loading() && summary && transactions.length === 0;
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
        this.http.get<WalletSummary>(
          `${this.apiUrl}/summary`
        )
      );
      console.log('✅ API Response:', response);
      
      if (response) {
        this.earningsSummary.set(response);
        console.log('💰 Earnings summary set:', response);
      } else {
        console.log('🏗️ No earnings data, setting default...');
        // Set default empty summary
        const defaultSummary: WalletSummary = {
          active_orders: 0,
          payments_clearing: 0,
          available: 0,
          total_earnings: 0
        };
        this.earningsSummary.set(defaultSummary);
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
        console.log('🏗️ Wallets not found, setting default summary...');
        // Set default empty summary
        const defaultSummary: WalletSummary = {
          active_orders: 0,
          payments_clearing: 0,
          available: 0,
          total_earnings: 0
        };
        this.earningsSummary.set(defaultSummary);
      } else {
        this.error.set('Failed to load earnings data');
      }
    } finally {
      this.loading.set(false);
      console.log('🏁 Loading complete. Summary:', this.earningsSummary());
    }
  }

  async loadTransactions() {
    this.loadingTransactions.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<TransactionData[]>(
          `${this.apiUrl}/transactions`
        )
      );
      this.transactions.set(response || []);
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
      'project_started': 'Project Started',
      'project_completed': 'Project Completed',
      'additional_payment': 'Additional Payment',
      'payment_cleared': 'Payment Cleared',
      'withdrawal': 'Withdrawal',
      'refund': 'Refund',
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
      'project_started': 'text-blue-600',
      'project_completed': 'text-green-600',
      'additional_payment': 'text-green-600',
      'payment_cleared': 'text-purple-600',
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

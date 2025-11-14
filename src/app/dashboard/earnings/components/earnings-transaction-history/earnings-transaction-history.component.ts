import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

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
  selector: 'app-earnings-transaction-history',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatTableModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, EmptyStateComponent],
  templateUrl: './earnings-transaction-history.component.html',
  styleUrl: './earnings-transaction-history.component.scss'
})
export class EarningsTransactionHistoryComponent {
  @Input() transactions: TransactionData[] = [];
  @Input() filteredTransactions: TransactionData[] = [];
  @Input() loadingTransactions: boolean = false;
  @Input() viewMode: 'grid' | 'list' = 'list';
  @Input() hasActiveFilters: boolean = false;

  @Output() clearFilters = new EventEmitter<void>();

  readonly displayedColumns = ['date', 'type', 'description', 'amount', 'status'];

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      'project_started': 'play_circle',
      'project_completed': 'check_circle',
      'additional_payment': 'add_circle',
      'payment_cleared': 'verified',
      'withdrawal': 'send',
      'refund': 'money_off',
      'platform_fee': 'toll'
    };
    return icons[type] || 'help';
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }

  readonly Math = Math;
}

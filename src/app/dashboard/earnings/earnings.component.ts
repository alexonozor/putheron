import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PayPalService } from '../../services/paypal.service';
import { WithdrawalService } from '../../services/withdrawal.service';
import { PayPalAccount } from '../../models/paypal-account.model';
import { 
  Withdrawal, 
  WithdrawalStatus,
  WithdrawalMethod,
  CreateWithdrawalRequest 
} from '../../models/withdrawal.model';

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
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './earnings.component.html',
  styleUrl: './earnings.component.scss'
})
export class EarningsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly paypalService = inject(PayPalService);
  private readonly withdrawalService = inject(WithdrawalService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly apiUrl = `${environment.api.baseUrl}/wallets`;

  // Signals
  readonly loading = signal(false);
  readonly loadingTransactions = signal(false);
  readonly earningsSummary = signal<WalletSummary | null>(null);
  readonly transactions = signal<TransactionData[]>([]);
  readonly filteredTransactions = signal<TransactionData[]>([]);
  readonly error = signal<string | null>(null);
  readonly viewMode = signal<'grid' | 'list'>('list');
  
  // PayPal related signals
  readonly paypalAccounts = signal<PayPalAccount[]>([]);
  readonly withdrawals = signal<Withdrawal[]>([]);
  readonly paypalLoading = signal(false);

  // Filter form
  readonly filterForm: FormGroup = this.fb.group({
    startDate: [null],
    endDate: [null],
    activityFilter: ['']
  });

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

  readonly hasActiveFilters = computed(() => {
    const form = this.filterForm.value;
    return !!(form.startDate || form.endDate || (form.activityFilter && form.activityFilter !== ''));
  });

  // PayPal computed properties
  readonly hasPayPalAccount = computed(() => {
    const accounts = this.paypalAccounts();
    return accounts.length > 0 && accounts.some(account => account.is_verified && account.is_active);
  });

  readonly canWithdrawToPayPal = computed(() => {
    return this.canWithdraw() && this.hasPayPalAccount();
  });

  readonly paypalAccountStatus = computed(() => {
    const accounts = this.paypalAccounts();
    if (accounts.length === 0) return 'not-connected';
    if (accounts.some(account => account.is_verified && account.is_active)) return 'connected';
    if (accounts.some(account => !account.is_verified && account.is_active)) return 'pending';
    return 'failed';
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
    this.loadPayPalAccounts();
    this.loadWithdrawals();
    
    // Initialize filtered transactions and set up form change listener
    this.filteredTransactions.set(this.transactions());
    
    // Listen for form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
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
      const transactions = response || [];
      this.transactions.set(transactions);
      
      // Debug: Log available transaction types
      const uniqueTypes = [...new Set(transactions.map(t => t.transaction_type))];
      console.log('Available transaction types in data:', uniqueTypes);
      
      // Apply current filters to new data
      this.applyFilters();
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      this.transactions.set([]);
      this.filteredTransactions.set([]);
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

  async retryLoad() {
    await this.loadEarningsSummary();
    await this.loadTransactions();
  }

  // PayPal related methods
  async loadPayPalAccounts() {
    try {
      this.paypalLoading.set(true);
      const accounts = await firstValueFrom(this.paypalService.getAccounts());
      this.paypalAccounts.set(accounts);
    } catch (error) {
      console.error('Error loading PayPal accounts:', error);
    } finally {
      this.paypalLoading.set(false);
    }
  }

  async loadWithdrawals() {
    try {
      const response = await firstValueFrom(this.withdrawalService.getWithdrawals());
      this.withdrawals.set(response.withdrawals);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
  }

  async connectPayPal() {
    try {
      this.paypalLoading.set(true);
      const response = await firstValueFrom(this.paypalService.getConnectUrl());
      window.location.href = response.auth_url;
    } catch (error) {
      console.error('Error connecting PayPal:', error);
      this.snackBar.open('Failed to connect PayPal account', 'Close', { duration: 3000 });
    } finally {
      this.paypalLoading.set(false);
    }
  }

  async withdrawToPayPal() {
    const summary = this.earningsSummary();
    if (!summary || summary.available <= 0) {
      this.snackBar.open('No funds available for withdrawal', 'Close', { duration: 3000 });
      return;
    }

    if (!this.hasPayPalAccount()) {
      this.snackBar.open('Please connect your PayPal account first', 'Close', { duration: 3000 });
      return;
    }

    try {
      const withdrawalData: CreateWithdrawalRequest = {
        amount: summary.available,
        method: WithdrawalMethod.PAYPAL,
        paypal_account_id: this.paypalAccounts()[0]._id
      };

      const withdrawal = await firstValueFrom(this.withdrawalService.createWithdrawal(withdrawalData));
      
      this.snackBar.open(
        `Withdrawal of $${summary.available.toFixed(2)} initiated successfully`,
        'Close',
        { duration: 5000 }
      );

      // Refresh data
      await this.loadEarningsSummary();
      await this.loadWithdrawals();
    } catch (error) {
      console.error('Error initiating withdrawal:', error);
      this.snackBar.open('Failed to initiate withdrawal', 'Close', { duration: 3000 });
    }
  }

  // Filter methods
  onDateFilterChange() {
    console.log('Date filter changed:', this.filterForm.value);
    this.applyFilters();
  }

  onActivityFilterChange(event?: any) {
    console.log('Activity filter changed:', this.filterForm.value, event);
    this.applyFilters();
  }

  clearFilters() {
    this.filterForm.reset({
      startDate: null,
      endDate: null,
      activityFilter: ''
    });
    this.applyFilters();
  }

  private applyFilters() {
    const formValue = this.filterForm.value;
    let filtered = [...this.transactions()];
    
    console.log('Applying filters with form value:', formValue);
    console.log('Original transactions count:', filtered.length);

    // Date range filter
    if (formValue.startDate || formValue.endDate) {
      const originalCount = filtered.length;
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        
        if (formValue.startDate && transactionDate < new Date(formValue.startDate)) {
          return false;
        }
        
        if (formValue.endDate && transactionDate > new Date(formValue.endDate)) {
          return false;
        }
        
        return true;
      });
      console.log('After date filter:', filtered.length, 'removed:', originalCount - filtered.length);
    }

    // Activity type filter
    if (formValue.activityFilter && formValue.activityFilter !== '') {
      const originalCount = filtered.length;
      filtered = filtered.filter(transaction => {
        const matches = transaction.transaction_type === formValue.activityFilter;
        console.log('Transaction type:', transaction.transaction_type, 'Filter:', formValue.activityFilter, 'Matches:', matches);
        return matches;
      });
      console.log('After activity filter:', filtered.length, 'removed:', originalCount - filtered.length);
    }

    console.log('Final filtered transactions count:', filtered.length);
    this.filteredTransactions.set(filtered);
  }

  // View mode methods
  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  // Email report method
  async emailActivityReport() {
    try {
      this.loading.set(true);
      // This would typically call an API endpoint to send the email
      // For now, just show a success message
      this.snackBar.open('Activity report sent to your email', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error sending email report:', error);
      this.snackBar.open('Failed to send email report', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  // Debug method (remove in production)
  debugFilters() {
    console.log('=== FILTER DEBUG ===');
    console.log('Form value:', this.filterForm.value);
    console.log('Total transactions:', this.transactions().length);
    console.log('Filtered transactions:', this.filteredTransactions().length);
    console.log('Has active filters:', this.hasActiveFilters());
    
    // Show available transaction types
    const types = [...new Set(this.transactions().map(t => t.transaction_type))];
    console.log('Available transaction types:', types);
    
    // Test filter manually
    this.applyFilters();
  }
}

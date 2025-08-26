import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AdminTransactionsService, Transaction, TransactionStats, AdminTransactionFilters } from '../admin-transactions.service';

@Component({
  selector: 'app-admin-transactions-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatCheckboxModule
  ],
  templateUrl: './admin-transactions-list.component.html',
  styleUrl: './admin-transactions-list.component.scss'
})
export class AdminTransactionsListComponent implements OnInit {
  private readonly adminTransactionsService = inject(AdminTransactionsService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  

  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly transactions = signal<Transaction[]>([]);
  readonly stats = signal<TransactionStats | null>(null);
  readonly selectedTransactions = signal<Set<string>>(new Set());
  readonly pagination = signal({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    perPage: 25,
    hasNext: false,
    hasPrev: false
  });

  // Form
  readonly filterForm: FormGroup;

  // Table configuration
  readonly displayedColumns = ['select', 'id', 'user', 'amount', 'type', 'status', 'createdAt', 'actions'];

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      type: [''],
      dateFrom: [null],
      dateTo: [null]
    });

    // Auto-apply filters when form changes
    this.filterForm.valueChanges.subscribe(() => {
      // Debounce the filter application
      setTimeout(() => this.applyFilters(), 500);
    });
  }

  ngOnInit() {
    this.loadTransactions();
    this.loadStats();
  }

  private currentFilters = computed(() => {
    const formValue = this.filterForm.value;
    return {
      search: formValue.search || '',
      status: formValue.status || '',
      type: formValue.type || '',
      dateFrom: formValue.dateFrom ? formValue.dateFrom.toISOString() : '',
      dateTo: formValue.dateTo ? formValue.dateTo.toISOString() : '',
      page: this.pagination().currentPage,
      limit: this.pagination().perPage
    };
  });

  async loadTransactions() {
    try {
      this.loading.set(true);
      this.error.set(null);
      
      const response = await this.adminTransactionsService.getTransactionsAsync(this.currentFilters());
      console.log('Transactions response:', response); // Debug log
      
      this.transactions.set(response.transactions || []);
      
      // Defensive check for pagination
      const paginationData = response.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        perPage: 25,
        hasNext: false,
        hasPrev: false
      };
      
      this.pagination.set({
        currentPage: paginationData.currentPage || 1,
        totalPages: paginationData.totalPages || 1,
        totalCount: paginationData.totalCount || 0,
        perPage: paginationData.perPage || 25,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      });
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      this.error.set('Failed to load transactions. Please try again.');
      // Reset to empty state on error
      this.transactions.set([]);
      this.pagination.set({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        perPage: 25,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      this.loading.set(false);
    }
  }

  async loadStats() {
    try {
      const filters = this.currentFilters();
      const stats = await this.adminTransactionsService.getTransactionStatsAsync({
        search: filters.search,
        status: filters.status,
        type: filters.type,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });
      console.log('Stats response:', stats); // Debug log
      this.stats.set(stats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      // Set default stats on error
      this.stats.set({
        total: 0,
        totalAmount: 0,
        pending: 0,
        pendingAmount: 0,
        completed: 0,
        completedAmount: 0,
        failed: 0,
        failedAmount: 0,
        payments: 0,
        paymentsAmount: 0,
        withdrawals: 0,
        withdrawalsAmount: 0,
        refunds: 0,
        refundsAmount: 0,
        byStatus: {
          pending: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
        },
        byType: {
          payment: 0,
          withdrawal: 0,
          refund: 0,
          fee: 0,
          escrow: 0,
        }
      });
    }
  }

  applyFilters() {
    const currentPagination = this.pagination();
    this.pagination.set({
      ...currentPagination,
      currentPage: 1 // Reset to first page when filtering
    });
    this.loadTransactions();
    this.loadStats();
  }

  resetFilters() {
    this.filterForm.reset();
    this.loadTransactions();
    this.loadStats();
  }

  onPageChange(event: PageEvent) {
    const currentPagination = this.pagination();
    this.pagination.set({
      ...currentPagination,
      currentPage: event.pageIndex + 1,
      perPage: event.pageSize
    });
    this.loadTransactions();
  }

  onCheckboxChange(event: Event, transactionId: string) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectTransaction(transactionId);
    } else {
      this.deselectTransaction(transactionId);
    }
  }

  goToPreviousPage() {
    if (this.pagination().hasPrev) {
      const currentPagination = this.pagination();
      this.pagination.set({
        ...currentPagination,
        currentPage: currentPagination.currentPage - 1
      });
      this.loadTransactions();
    }
  }

  goToNextPage() {
    if (this.pagination().hasNext) {
      const currentPagination = this.pagination();
      this.pagination.set({
        ...currentPagination,
        currentPage: currentPagination.currentPage + 1
      });
      this.loadTransactions();
    }
  }

  // Selection methods
  selectTransaction(transactionId: string) {
    const selected = new Set(this.selectedTransactions());
    selected.add(transactionId);
    this.selectedTransactions.set(selected);
  }

  deselectTransaction(transactionId: string) {
    const selected = new Set(this.selectedTransactions());
    selected.delete(transactionId);
    this.selectedTransactions.set(selected);
  }

  toggleAllTransactions() {
    const allSelected = this.selectedTransactions().size === this.transactions().length;
    if (allSelected) {
      this.selectedTransactions.set(new Set());
    } else {
      const allIds = this.transactions().map(t => t._id);
      this.selectedTransactions.set(new Set(allIds));
    }
  }

  deselectAllTransactions() {
    this.selectedTransactions.set(new Set());
  }

  // Bulk operations
  async bulkUpdateStatus(status: string) {
    const transactionIds = Array.from(this.selectedTransactions());
    if (transactionIds.length === 0) return;

    if (!confirm(`Are you sure you want to update ${transactionIds.length} selected transactions to ${status}?`)) {
      return;
    }

    this.loading.set(true);
    try {
      await this.adminTransactionsService.bulkUpdateTransactionsAsync(transactionIds, { status: status as any });
      this.selectedTransactions.set(new Set());
      await this.loadTransactions();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error updating transactions:', err);
      this.error.set('Failed to update transactions. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async bulkDeleteTransactions() {
    const transactionIds = Array.from(this.selectedTransactions());
    if (transactionIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${transactionIds.length} selected transactions? This action cannot be undone.`)) {
      return;
    }

    this.loading.set(true);
    try {
      for (const id of transactionIds) {
        await this.adminTransactionsService.updateTransactionStatusAsync(id, 'cancelled', 'Bulk deletion');
      }
      this.selectedTransactions.set(new Set());
      await this.loadTransactions();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error deleting transactions:', err);
      this.error.set('Failed to delete transactions. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // Individual actions
  viewTransactionDetails(transactionId: string) {
    this.router.navigate(['./', transactionId], {relativeTo: this.route});
  }

  editTransaction(transaction: Transaction) {
    // TODO: Implement edit transaction functionality
    console.log('Edit transaction:', transaction._id);
  }

  async deleteTransaction(transactionId: string) {
    const confirmed = confirm('Are you sure you want to delete this transaction?');
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.adminTransactionsService.updateTransactionStatusAsync(transactionId, 'cancelled', 'Admin deletion');
      await this.loadTransactions();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      this.error.set('Failed to delete transaction. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async processRefund(transaction: Transaction) {
    const confirmed = confirm(`Process refund for transaction ${transaction._id}?`);
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.adminTransactionsService.processRefundAsync(transaction._id, transaction.amount, 'Admin initiated refund');
      await this.loadTransactions();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error processing refund:', err);
      this.error.set('Failed to process refund. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async retryTransaction(transaction: Transaction) {
    const confirmed = confirm(`Retry transaction ${transaction._id}?`);
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.adminTransactionsService.updateTransactionStatusAsync(transaction._id, 'pending', 'Admin retry');
      await this.loadTransactions();
      await this.loadStats();
    } catch (err: any) {
      console.error('Error retrying transaction:', err);
      this.error.set('Failed to retry transaction. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async exportTransactions() {
    try {
      this.loading.set(true);
      // TODO: Implement export functionality
      console.log('Export transactions with filters:', this.currentFilters());
      // For now, just simulate the export
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      console.error('Error exporting transactions:', err);
      this.error.set('Failed to export transactions. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}

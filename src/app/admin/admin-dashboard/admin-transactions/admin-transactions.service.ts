import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '../../../shared/services/config.service';

export interface Transaction {
  _id: string;
  user_id: string | {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    user_mode?: string;
    profile_picture?: string;
  };
  amount: number;
  currency?: string;
  fee?: number;
  transaction_type: 'PROJECT_STARTED' | 'PROJECT_COMPLETED' | 'ADDITIONAL_PAYMENT' | 'PAYMENT_CLEARED' | 'WITHDRAWAL' | 'WITHDRAWAL_RESERVED' | 'WITHDRAWAL_REFUND' | 'REFUND' | 'PLATFORM_FEE';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  wallet_type: 'active_orders' | 'payments_clearing' | 'available';
  description?: string;
  project_id?: string | {
    _id: string;
    title: string;
    status: string;
  };
  business_id?: string | {
    _id: string;
    name: string;
  };
  stripe_payment_intent_id?: string;
  payment_method?: string;
  reference_id?: string;
  failure_reason?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  cleared_at?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  
  // Computed properties for backward compatibility
  id?: string;
  userId?: string;
  type?: 'payment' | 'withdrawal' | 'refund' | 'fee' | 'escrow';
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  paymentDetails?: {
    method?: string;
    last4?: string;
    brand?: string;
    gateway?: string;
    transactionId?: string;
  };
  completedAt?: string;
}

export interface TransactionStats {
  total: number;
  totalAmount: number;
  pending: number;
  pendingAmount: number;
  completed: number;
  completedAmount: number;
  failed: number;
  failedAmount: number;
  payments: number;
  paymentsAmount: number;
  withdrawals: number;
  withdrawalsAmount: number;
  refunds: number;
  refundsAmount: number;
  byStatus: {
    pending?: number;
    completed?: number;
    failed?: number;
    cancelled?: number;
  };
  byType: {
    payment?: number;
    withdrawal?: number;
    refund?: number;
    fee?: number;
    escrow?: number;
  };
}

export interface TransactionEvent {
  _id: string;
  transactionId: string;
  type: string;
  message?: string;
  data?: Record<string, any>;
  createdAt: string;
}

export interface Refund {
  _id: string;
  id: string;
  transactionId: string;
  amount: number;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
}

export interface TransactionFilters {
  search?: string;
  status?: string;
  type?: string;
  userId?: string;
  businessId?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminTransactionFilters extends TransactionFilters {
  // Admin-specific filters can be added here
}

export interface TransactionsListResponse {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminTransactionsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private get apiUrl() {
    return this.config.getApiUrl('/admin/transactions');
  }

  // Get transactions list with filters and pagination
  getTransactions(filters: AdminTransactionFilters = {}): Observable<TransactionsListResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response: any) => {
        // Transform backend response to match frontend interface
        const transformedTransactions = (response.transactions || response.data?.transactions || []).map((transaction: any) => {
          // Transform transaction data to match frontend expectations
          const transformed = {
            ...transaction,
            // Add computed properties for backward compatibility
            id: transaction._id,
            userId: typeof transaction.user_id === 'string' ? transaction.user_id : transaction.user_id?._id,
            type: this.mapTransactionTypeToFrontend(transaction.transaction_type),
            user: typeof transaction.user_id === 'object' ? {
              _id: transaction.user_id._id,
              firstName: transaction.user_id.first_name,
              lastName: transaction.user_id.last_name,
              email: transaction.user_id.email,
            } : undefined,
            currency: 'USD', // Default currency
            fee: transaction.fee || 0,
            // Map completion date
            completedAt: transaction.processing_completed_at,
            // Create paymentDetails from existing fields
            paymentDetails: {
              method: transaction.payment_method,
              transactionId: transaction.stripe_payment_intent_id,
              gateway: transaction.stripe_payment_intent_id ? 'stripe' : undefined,
            }
          };
          return transformed;
        });

        return {
          transactions: transformedTransactions,
          pagination: {
            currentPage: response.page || 1,
            totalPages: response.totalPages || 1,
            totalCount: response.total || 0,
            perPage: filters.limit || 25,
            hasNext: (response.page || 1) < (response.totalPages || 1),
            hasPrev: (response.page || 1) > 1
          }
        } as TransactionsListResponse;
      })
    );
  }

  // Helper method to map backend transaction types to frontend types
  private mapTransactionTypeToFrontend(backendType: string): 'payment' | 'withdrawal' | 'refund' | 'fee' | 'escrow' {
    switch (backendType) {
      case 'PROJECT_STARTED':
      case 'PROJECT_COMPLETED':
      case 'ADDITIONAL_PAYMENT':
        return 'payment';
      case 'WITHDRAWAL':
        return 'withdrawal';
      case 'REFUND':
        return 'refund';
      case 'PLATFORM_FEE':
        return 'fee';
      case 'WITHDRAWAL_RESERVED':
        return 'escrow';
      default:
        return 'payment';
    }
  }

  // Async version
  async getTransactionsAsync(filters: AdminTransactionFilters = {}): Promise<TransactionsListResponse> {
    return firstValueFrom(this.getTransactions(filters));
  }

  // Get single transaction by ID
  getTransaction(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  // Async version
  async getTransactionAsync(id: string): Promise<Transaction> {
    return firstValueFrom(this.getTransaction(id));
  }

  // Get transaction statistics
  getTransactionStats(filters: Partial<AdminTransactionFilters> = {}): Observable<TransactionStats> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/stats`, { params }).pipe(
      map((response: any) => {
        // Transform backend response to match frontend interface
        const summary = response.summary || {};
        const byStatus = response.byStatus || {};
        const byType = response.byType || {};
        
        return {
          total: summary.total || 0,
          totalAmount: summary.totalAmount || 0,
          pending: summary.pending || 0,
          pendingAmount: byStatus.pending?.amount || 0,
          completed: summary.completed || 0,
          completedAmount: byStatus.completed?.amount || 0,
          failed: summary.failed || 0,
          failedAmount: byStatus.failed?.amount || 0,
          payments: byType.PROJECT_STARTED?.count || byType.PROJECT_COMPLETED?.count || 0,
          paymentsAmount: (byType.PROJECT_STARTED?.amount || 0) + (byType.PROJECT_COMPLETED?.amount || 0),
          withdrawals: byType.WITHDRAWAL?.count || 0,
          withdrawalsAmount: byType.WITHDRAWAL?.amount || 0,
          refunds: byType.REFUND?.count || 0,
          refundsAmount: byType.REFUND?.amount || 0,
          byStatus: {
            pending: byStatus.pending?.count || 0,
            completed: byStatus.completed?.count || 0,
            failed: byStatus.failed?.count || 0,
            cancelled: byStatus.cancelled?.count || 0,
          },
          byType: {
            payment: (byType.PROJECT_STARTED?.count || 0) + (byType.PROJECT_COMPLETED?.count || 0) + (byType.ADDITIONAL_PAYMENT?.count || 0),
            withdrawal: byType.WITHDRAWAL?.count || 0,
            refund: byType.REFUND?.count || 0,
            fee: byType.PLATFORM_FEE?.count || 0,
            escrow: byType.WITHDRAWAL_RESERVED?.count || 0,
          }
        } as TransactionStats;
      })
    );
  }

  // Async version
  async getTransactionStatsAsync(filters: Partial<AdminTransactionFilters> = {}): Promise<TransactionStats> {
    return firstValueFrom(this.getTransactionStats(filters));
  }

  // Update transaction status (for admin actions like refunds, cancellations)
  updateTransactionStatus(id: string, status: string, reason?: string): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}/status`, { status, reason });
  }

  // Async version
  async updateTransactionStatusAsync(id: string, status: string, reason?: string): Promise<Transaction> {
    return firstValueFrom(this.updateTransactionStatus(id, status, reason));
  }

  // Process refund
  processRefund(id: string, amount?: number, reason?: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/${id}/refund`, { amount, reason });
  }

  // Async version
  async processRefundAsync(id: string, amount?: number, reason?: string): Promise<Transaction> {
    return firstValueFrom(this.processRefund(id, amount, reason));
  }

  // Bulk operations
  bulkUpdateTransactions(transactionIds: string[], updates: Partial<Transaction>): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(`${this.apiUrl}/bulk`, { 
      transactionIds, 
      updates 
    });
  }

  // Async version
  async bulkUpdateTransactionsAsync(transactionIds: string[], updates: Partial<Transaction>): Promise<{ updated: number }> {
    return firstValueFrom(this.bulkUpdateTransactions(transactionIds, updates));
  }

  // Export transactions
  exportTransactions(filters: AdminTransactionFilters = {}): Observable<Blob> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/export`, { 
      params,
      responseType: 'blob' 
    });
  }

  // Transaction events
  async getTransactionEventsAsync(transactionId: string): Promise<TransactionEvent[]> {
    const response = await this.http.get<TransactionEvent[]>(
      `${this.apiUrl}/${transactionId}/events`
    ).toPromise();
    return response || [];
  }

  // Transaction refunds
  async getTransactionRefundsAsync(transactionId: string): Promise<Refund[]> {
    const response = await this.http.get<Refund[]>(
      `${this.apiUrl}/${transactionId}/refunds`
    ).toPromise();
    return response || [];
  }

  // Retry transaction
  async retryTransactionAsync(transactionId: string): Promise<Transaction> {
    const response = await this.http.post<Transaction>(
      `${this.apiUrl}/${transactionId}/retry`,
      {}
    ).toPromise();
    return response!;
  }

  // Delete transaction
  async deleteTransactionAsync(transactionId: string): Promise<void> {
    await this.http.delete(
      `${this.apiUrl}/${transactionId}`
    ).toPromise();
  }

  // Helper methods for UI
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'withdrawal':
        return 'bg-blue-100 text-blue-800';
      case 'refund':
        return 'bg-yellow-100 text-yellow-800';
      case 'escrow_release':
        return 'bg-purple-100 text-purple-800';
      case 'escrow_hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'payment':
        return 'Payment';
      case 'withdrawal':
        return 'Withdrawal';
      case 'refund':
        return 'Refund';
      case 'escrow_release':
        return 'Escrow Release';
      case 'escrow_hold':
        return 'Escrow Hold';
      default:
        return type;
    }
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUserName(userId: string | { _id: string; first_name: string; last_name: string; email: string; profile_picture?: string }): string {
    if (typeof userId === 'string') {
      return `User ID: ${userId}`;
    }
    return `${userId.first_name} ${userId.last_name}`.trim() || userId.email;
  }

  getBusinessName(businessId: string | { _id: string; name: string; slug: string; logo_url?: string }): string {
    if (typeof businessId === 'string') {
      return `Business ID: ${businessId}`;
    }
    return businessId.name;
  }

  getProjectTitle(projectId: string | { _id: string; title: string; status: string }): string {
    if (typeof projectId === 'string') {
      return `Project ID: ${projectId}`;
    }
    return projectId.title;
  }
}

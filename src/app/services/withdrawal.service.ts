import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Withdrawal,
  CreateWithdrawalRequest,
  WithdrawalListResponse,
  WithdrawalStats,
  WithdrawalResponse,
  WithdrawalStatus
} from '../models/withdrawal.model';

@Injectable({
  providedIn: 'root'
})
export class WithdrawalService {
  private apiUrl = `${environment.api.baseUrl}/withdrawals`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new withdrawal request
   */
  createWithdrawal(request: CreateWithdrawalRequest): Observable<Withdrawal> {
    return this.http.post<Withdrawal>(this.apiUrl, request);
  }

  /**
   * Get user's withdrawal history
   */
  getWithdrawals(
    page: number = 1, 
    limit: number = 10, 
    status?: WithdrawalStatus
  ): Observable<WithdrawalListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<WithdrawalListResponse>(this.apiUrl, { params });
  }

  /**
   * Get specific withdrawal by ID
   */
  getWithdrawal(withdrawalId: string): Observable<Withdrawal> {
    return this.http.get<Withdrawal>(`${this.apiUrl}/${withdrawalId}`);
  }

  /**
   * Cancel pending withdrawal
   */
  cancelWithdrawal(withdrawalId: string): Observable<WithdrawalResponse> {
    return this.http.post<WithdrawalResponse>(`${this.apiUrl}/${withdrawalId}/cancel`, {});
  }

  /**
   * Get withdrawal statistics
   */
  getWithdrawalStats(): Observable<WithdrawalStats> {
    return this.http.get<WithdrawalStats>(`${this.apiUrl}/stats/summary`);
  }

  /**
   * Process withdrawal (admin/testing)
   */
  processWithdrawal(withdrawalId: string): Observable<WithdrawalResponse> {
    return this.http.post<WithdrawalResponse>(`${this.apiUrl}/${withdrawalId}/process`, {});
  }

  /**
   * Get withdrawal status color for UI
   */
  getStatusColor(status: WithdrawalStatus): string {
    switch (status) {
      case WithdrawalStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case WithdrawalStatus.PROCESSING:
        return 'text-blue-600 bg-blue-100';
      case WithdrawalStatus.COMPLETED:
        return 'text-green-600 bg-green-100';
      case WithdrawalStatus.FAILED:
        return 'text-red-600 bg-red-100';
      case WithdrawalStatus.CANCELLED:
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Get withdrawal status icon
   */
  getStatusIcon(status: WithdrawalStatus): string {
    switch (status) {
      case WithdrawalStatus.PENDING:
        return 'clock';
      case WithdrawalStatus.PROCESSING:
        return 'sync';
      case WithdrawalStatus.COMPLETED:
        return 'check-circle';
      case WithdrawalStatus.FAILED:
        return 'x-circle';
      case WithdrawalStatus.CANCELLED:
        return 'minus-circle';
      default:
        return 'help-circle';
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Calculate platform fee (3%)
   */
  calculateFee(amount: number): number {
    return Math.round(amount * 0.03 * 100) / 100;
  }

  /**
   * Calculate net amount after fees
   */
  calculateNetAmount(amount: number): number {
    return amount - this.calculateFee(amount);
  }
}

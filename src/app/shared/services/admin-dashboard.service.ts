import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    banned: number;
    verified: number;
    unverified: number;
    businessOwners: number;
    customers: number;
  };
  businesses: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    featured: number;
    active: number;
  };
  transactions: {
    summary: {
      total: number;
      totalAmount: number;
      completed: number;
      pending: number;
      failed: number;
      cancelled: number;
    };
    byStatus: any;
    byType: any;
    byWalletType: any;
    recent: any[];
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
  reviews: {
    total: number;
    averageRating: number;
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStar: number;
  };
  revenue: {
    totalRevenue: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  recentActivity: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export interface TransactionAnalytics {
  summary: {
    total: number;
    totalAmount: number;
    completed: number;
    pending: number;
    failed: number;
    cancelled: number;
  };
  dailyTrends: Array<{
    date: string;
    transactions: number;
    revenue: number;
  }>;
  averageTransaction: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.api.baseUrl}/admin`;
  
  // Reactive state for dashboard stats
  private readonly _dashboardStats = new BehaviorSubject<DashboardStats | null>(null);
  private readonly _loading = new BehaviorSubject<boolean>(false);
  private readonly _error = new BehaviorSubject<string | null>(null);

  // Public observables
  readonly dashboardStats$ = this._dashboardStats.asObservable();
  readonly loading$ = this._loading.asObservable();
  readonly error$ = this._error.asObservable();

  // Cache control
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get comprehensive dashboard statistics
   */
  getDashboardStats(forceRefresh = false): Observable<DashboardStats> {
    const now = Date.now();
    
    // Return cached data if available and not expired (unless forced refresh)
    if (!forceRefresh && this._dashboardStats.value && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this._dashboardStats.asObservable().pipe(
        map(stats => stats!)
      );
    }

    this._loading.next(true);
    this._error.next(null);

    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.apiUrl}/dashboard/stats`).pipe(
      map(response => response.data),
      tap(stats => {
        this._dashboardStats.next(stats);
        this.lastFetchTime = now;
        this._loading.next(false);
      })
    );
  }

  /**
   * Get transaction analytics for charts
   */
  getTransactionAnalytics(
    dateRange?: { dateFrom: string; dateTo: string }
  ): Observable<TransactionAnalytics> {
    let params = new HttpParams();
    
    if (dateRange?.dateFrom) {
      params = params.set('dateFrom', dateRange.dateFrom);
    }
    if (dateRange?.dateTo) {
      params = params.set('dateTo', dateRange.dateTo);
    }

    return this.http.get<TransactionAnalytics>(`${this.apiUrl}/transactions/analytics`, { params });
  }

  /**
   * Get business statistics
   */
  getBusinessStats(): Observable<DashboardStats['businesses']> {
    return this.http.get<{ success: boolean; data: DashboardStats['businesses'] }>(`${this.apiUrl}/businesses/stats`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get user statistics
   */
  getUserStats(): Observable<DashboardStats['users']> {
    return this.http.get<{ success: boolean; data: DashboardStats['users'] }>(`${this.apiUrl}/users/stats`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(dateRange?: { dateFrom: string; dateTo: string }): Observable<DashboardStats['transactions']> {
    let params = new HttpParams();
    
    if (dateRange?.dateFrom) {
      params = params.set('dateFrom', dateRange.dateFrom);
    }
    if (dateRange?.dateTo) {
      params = params.set('dateTo', dateRange.dateTo);
    }

    return this.http.get<{ success: boolean; data: DashboardStats['transactions'] }>(`${this.apiUrl}/transactions/stats`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Refresh dashboard stats
   */
  refreshStats(): Observable<DashboardStats> {
    return this.getDashboardStats(true);
  }

  /**
   * Clear cache and reset state
   */
  clearCache(): void {
    this._dashboardStats.next(null);
    this._loading.next(false);
    this._error.next(null);
    this.lastFetchTime = 0;
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    console.error('AdminDashboardService error:', error);
    this._error.next(error?.message || 'An error occurred');
    this._loading.next(false);
  }

  /**
   * Set error state
   */
  setError(error: string): void {
    this._error.next(error);
    this._loading.next(false);
  }

  /**
   * Get current stats (synchronous)
   */
  getCurrentStats(): DashboardStats | null {
    return this._dashboardStats.value;
  }

  /**
   * Check if data is loading
   */
  isLoading(): boolean {
    return this._loading.value;
  }

  /**
   * Get current error
   */
  getCurrentError(): string | null {
    return this._error.value;
  }
}
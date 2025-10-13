import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { AdminDashboardService, DashboardStats, TransactionAnalytics } from '../../../shared/services/admin-dashboard.service';

interface TopBusiness {
  rank: number;
  name: string;
  revenue: number;
  rating: number;
  growth: number;
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.scss'
})
export class AdminOverviewComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly adminDashboardService = inject(AdminDashboardService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly dashboardData = signal<DashboardStats | null>(null);
  readonly transactionAnalytics = signal<TransactionAnalytics | null>(null);

  // Computed values for template
  readonly stats = computed(() => {
    const data = this.dashboardData();
    if (!data) {
      return {
        totalUsers: 0,
        totalBusinesses: 0,
        totalProjects: 0,
        totalReviews: 0,
        totalChats: 0, // Will be calculated from recent activity
        totalTransactions: 0,
        activeProjects: 0,
        completedProjects: 0,
        pendingBusinesses: 0,
        totalRevenue: 0
      };
    }

    return {
      totalUsers: data.users.total,
      totalBusinesses: data.businesses.total,
      totalProjects: data.projects.total,
      totalReviews: data.reviews.total,
      totalChats: data.recentActivity.filter(activity => activity.type === 'chat').length,
      totalTransactions: data.transactions.summary.total,
      activeProjects: data.projects.active,
      completedProjects: data.projects.completed,
      pendingBusinesses: data.businesses.pending,
      totalRevenue: data.revenue.totalRevenue
    };
  });

  readonly recentActivity = computed(() => {
    const data = this.dashboardData();
    return data?.recentActivity || [];
  });

  readonly revenue = computed(() => {
    const data = this.dashboardData();
    return data?.revenue || {
      totalRevenue: 0,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0
    };
  });

  readonly transactionSummary = computed(() => {
    const analytics = this.transactionAnalytics();
    const data = this.dashboardData();
    
    if (!analytics || !data) {
      return {
        thisMonth: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        monthlyGrowth: 0,
        transactionGrowth: 0,
        avgTransactionChange: 0,
        chartData: []
      };
    }

    return {
      thisMonth: this.revenue().thisMonth,
      totalTransactions: analytics.summary.total,
      averageTransaction: analytics.averageTransaction,
      monthlyGrowth: this.revenue().growth,
      transactionGrowth: 24, // This could be calculated from analytics
      avgTransactionChange: -5, // This could be calculated from analytics
      chartData: analytics.dailyTrends
    };
  });

  readonly topBusinesses = signal<TopBusiness[]>([
    { rank: 2, name: 'Tech Innovators LLC', revenue: 9850, rating: 4.8, growth: 15 },
    { rank: 3, name: 'Creative Solutions Co.', revenue: 8200, rating: 4.7, growth: -2 },
    { rank: 4, name: 'Business Consultants Pro', revenue: 7600, rating: 4.9, growth: 22 },
    { rank: 5, name: 'Marketing Masters Inc.', revenue: 6900, rating: 4.6, growth: 8 }
  ]);

  readonly user = this.authService.user;

  ngOnInit() {
    this.loadDashboardStats();
    this.loadTransactionAnalytics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadDashboardStats() {
    this.loading.set(true);
    this.error.set(null);

    this.adminDashboardService.getDashboardStats()
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Error loading dashboard stats:', err);
          this.error.set('Failed to load dashboard statistics. Please try again.');
          return of(null);
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.dashboardData.set(data);
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Subscription error:', err);
          this.error.set('An unexpected error occurred.');
          this.loading.set(false);
        }
      });
  }

  loadTransactionAnalytics() {
    // Load last 30 days of transaction analytics
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const dateRange = {
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0]
    };

    this.adminDashboardService.getTransactionAnalytics(dateRange)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Error loading transaction analytics:', err);
          this.error.set('Failed to load transaction analytics');
          // Return a default analytics object instead of null
          return of({
            summary: {
              total: 0,
              totalAmount: 0,
              completed: 0,
              pending: 0,
              failed: 0,
              cancelled: 0
            },
            dailyTrends: [],
            averageTransaction: 0
          });
        })
      )
      .subscribe(data => {
        this.transactionAnalytics.set(data);
      });
  }

  refreshStats() {
    this.loadDashboardStats();
    this.loadTransactionAnalytics();
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString();
  }

  exportReport() {
    // TODO: Implement report export functionality
    console.log('Exporting admin report...');
    alert('Report export functionality coming soon!');
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getMaxRevenue(): number {
    const analytics = this.transactionAnalytics();
    if (!analytics || !analytics.dailyTrends.length) {
      return 1; // Prevent division by zero
    }
    
    const maxRevenue = Math.max(...analytics.dailyTrends.map((d: any) => d.revenue));
    return maxRevenue > 0 ? maxRevenue : 1;
  }
}

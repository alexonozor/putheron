import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../shared/services/auth.service';

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
export class AdminOverviewComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly stats = signal({
    totalUsers: 0,
    totalBusinesses: 0,
    totalProjects: 0,
    totalReviews: 0,
    totalChats: 0,
    totalTransactions: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingBusinesses: 0,
    totalRevenue: 0
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
  }

  async loadDashboardStats() {
    this.loading.set(true);
    try {
      // TODO: Implement API calls to get admin dashboard stats
      // This is a placeholder - replace with actual API calls
      setTimeout(() => {
        this.stats.set({
          totalUsers: 2847,
          totalBusinesses: 456,
          totalProjects: 1234,
          totalReviews: 892,
          totalChats: 1250,
          totalTransactions: 1847,
          activeProjects: 187,
          completedProjects: 1047,
          pendingBusinesses: 23,
          totalRevenue: 67890
        });
        this.loading.set(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading admin dashboard stats:', error);
      this.loading.set(false);
    }
  }

  refreshStats() {
    this.loadDashboardStats();
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
}
